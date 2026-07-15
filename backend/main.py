import os
import json
import math
import asyncio
from pathlib import Path
import requests
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from skyfield.api import load, Topos
from skyfield import almanac
from datetime import datetime, timedelta
import httpx
from redis_client import cache_sky_data
import traceback


async def keepalive_loop():
    """Ping /health every 10 minutes to keep the Render free-tier container warm."""
    await asyncio.sleep(60)  # brief delay on startup before first ping
    while True:
        try:
            async with httpx.AsyncClient() as client:
                await client.get("https://sky-watch-backend.onrender.com/health", timeout=10.0)
        except Exception:
            pass  # silently ignore; Render will restart if truly down
        await asyncio.sleep(600)  # 10 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(keepalive_loop())
    yield
    task.cancel()


app = FastAPI(lifespan=lifespan)

origins = [
    "https://sky-watch-chi.vercel.app",
    "https://skywatchdash.com",
    "https://www.skywatchdash.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Regex to allow any localhost port (dev) and sky-watch-*.vercel.app
    allow_origin_regex=r"http://localhost:\d+|https://sky-watch-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Global Ephemeris Loading (Keep this outside the functions for speed)
eph = load('de421.bsp')
earth = eph['earth']


def get_weather_description(code):
    mapping = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle",
        53: "Moderate drizzle", 55: "Dense drizzle", 61: "Slight rain",
        63: "Moderate rain", 65: "Heavy rain", 71: "Slight snow",
        73: "Moderate snow", 75: "Heavy snow", 95: "Thunderstorm"
    }
    return mapping.get(code, "Cloudy")
# --- NEW HELPER FOR MOON PHASES ---


def get_upcoming_moon_phases():
    ts = load.timescale()
    t0 = ts.now()
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=31))

    # Find the times and phase IDs (0=New, 1=First Quarter, 2=Full, 3=Last Quarter)
    times, phases = almanac.find_discrete(t0, t1, almanac.moon_phases(eph))

    phase_names = ["New Moon", "First Quarter", "Full Moon", "Last Quarter"]

    milestones = []
    for time, phase_id in zip(times, phases):
        milestones.append({
            "phase": phase_names[phase_id],
            "date": time.utc_datetime().strftime("%b %d")
        })

    return milestones


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/starlink-live")
@cache_sky_data(ttl_seconds=86400)
async def get_starlink_tles():
    backup_path = Path(__file__).parent / "starlink_backup.json"

    username = os.getenv("SPACETRACK_USER")
    password = os.getenv("SPACETRACK_PASS")

    if not username or not password:
        print("SPACETRACK credentials not set. Switching to local backup.")
    else:
        login_url = "https://www.space-track.org/ajaxauth/login"
        tle_url = (
            "https://www.space-track.org/basicspacedata/query/class/gp"
            "/OBJECT_NAME/^^STARLINK/orderby/NORAD_CAT_ID/format/3le"
        )
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                # Authenticate
                login_resp = await client.post(
                    login_url,
                    data={"identity": username, "password": password},
                    timeout=15.0
                )
                login_resp.raise_for_status()

                # Fetch TLEs
                tle_resp = await client.get(tle_url, timeout=30.0)
                tle_resp.raise_for_status()

                raw_lines = [line.strip() for line in tle_resp.text.splitlines() if line.strip()]

                structured_sats = []
                for i in range(0, len(raw_lines), 3):
                    if i + 2 < len(raw_lines):
                        name = raw_lines[i]
                        line1 = raw_lines[i + 1]
                        line2 = raw_lines[i + 2]
                        if line1.startswith("1 ") and line2.startswith("2 "):
                            norad_id = line1[2:7].strip()
                            structured_sats.append({
                                "OBJECT_NAME": name,
                                "OBJECT_ID": norad_id,
                                "TLE_LINE1": line1,
                                "TLE_LINE2": line2
                            })

                if structured_sats:
                    # Atomic write: write to temp file then rename so a mid-write
                    # interruption never leaves the backup in a corrupted state.
                    tmp_path = backup_path.with_suffix(".tmp")
                    with open(tmp_path, "w") as f:
                        json.dump(structured_sats, f)
                    tmp_path.replace(backup_path)
                    return structured_sats

        except Exception as e:
            print(f"Space-track fetch failed: {e}. Switching to local backup.")

    if backup_path.exists():
        try:
            with open(backup_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Backup JSON corrupted or unreadable: {e}")

    return {"error": "Satellite link offline."}


@app.get("/sky-summary")
@cache_sky_data(ttl_seconds=120)
async def get_sky_summary(lat: float = Query(35.92), lon: float = Query(-86.86)):
    ts = load.timescale()
    t = ts.now()
    sun_obj, moon = eph['sun'], eph['moon']
    user_location = Topos(latitude_degrees=lat, longitude_degrees=lon)
    observer = earth + user_location

    # 1. SUN & LIGHT PHASE
    sun_astrometric = observer.at(t).observe(sun_obj)
    sun_alt, sun_az, _ = sun_astrometric.apparent().altaz()
    current_sun_alt = float(sun_alt.degrees)

    is_golden_hour = -4 <= current_sun_alt <= 6 
    is_blue_hour = -6 <= current_sun_alt < -4

    # 2. SUNRISE/SUNSET (With Polar Support)
    t0 = ts.utc(t.utc_datetime().year,
                t.utc_datetime().month, t.utc_datetime().day)
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=1))
    times, events = almanac.find_discrete(
        t0, t1, almanac.sunrise_sunset(eph, user_location))

    if len(times) == 0:
        sunrise_val = sunset_val = "Polar Day" if current_sun_alt > 0 else "Polar Night"
    else:
        sunrise_val = times[events == 1][0].utc_iso() if any(
            events == 1) else None
        sunset_val = times[events == 0][0].utc_iso() if any(
            events == 0) else None

    # 3. ZENITH TELEMETRY
    inflection_times, transit_types = almanac.find_discrete(
        t0, t1, almanac.meridian_transits(eph, sun_obj, user_location)
    )

    zenith_time = zenith_alt = zenith_az = None
    if any(transit_types == 1):
        t_zenith = inflection_times[transit_types == 1][0]
        zenith_time = t_zenith.utc_iso()
        z_astrometric = observer.at(t_zenith).observe(sun_obj)
        z_alt, z_az, _ = z_astrometric.apparent().altaz()
        zenith_alt = round(float(z_alt.degrees), 1)
        zenith_az = round(float(z_az.degrees), 1)

    # 4. MOON DATA
    m = observer.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun_obj)

    # 5. PLANET VISIBILITY LOGIC
    target_planets = {
        "Venus": eph['venus'],
        "Mars": eph['mars'],
        "Jupiter": eph['jupiter_barycenter'],
        "Saturn": eph['saturn_barycenter'],
        "Uranus": eph['uranus_barycenter'],
        "Neptune": eph['neptune_barycenter']
    }

    planet_data = {}
    for name, body in target_planets.items():
        astrometric = observer.at(t).observe(body)
        p_alt, p_az, distance = astrometric.apparent().altaz()
        planet_data[name] = {
            "altitude": round(float(p_alt.degrees), 1),
            "azimuth": round(float(p_az.degrees), 1),
            "is_visible": bool(p_alt.degrees > 0),
            "distance_au": round(float(distance.au), 2)
        }

    return {
        "moon": {"illumination": round(float(illumination * 100), 2)},
        "sun": {
            "sunrise": sunrise_val,
            "sunset": sunset_val,
            "zenith": zenith_time,
            "zenith_alt": zenith_alt,
            "zenith_az": zenith_az,
            "current_altitude": round(current_sun_alt, 1),
            "phase": "Golden Hour" if is_golden_hour else "Blue Hour" if is_blue_hour else "Standard"
        },
        "planets": planet_data
    }


@app.get("/weather")
@cache_sky_data(ttl_seconds=300)  # Cache for 15 mins to stay super safe
async def get_weather(lat: float = Query(35.92), lon: float = Query(-86.86)):
    # Best practice: Put this in Render Env Variables as WEATHER_API_KEY
    api_key = os.getenv("WEATHER_API_KEY")

    if not api_key:
        return {"error": "API Key missing", "details": "Check Render Environment Variables"}

    # unitGroup=us gives us Fahrenheit, mph, inHg, etc. Adjust as needed for metric.
    url = (
        f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/"
        f"{lat},{lon}?unitGroup=us&key={api_key}&include=current"
    )

    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url, timeout=15.0)

            if response.status_code != 200:
                print(f"Weather Provider Error: {response.status_code}")
                return {"error": f"API Status {response.status_code}"}

            data = response.json()
            current = data.get("currentConditions")

            if not current:
                return {"error": "Data structure mismatch"}

            raw_pressure = current.get("pressure", 0)

            if raw_pressure and raw_pressure > 100:
                # Calculation: hPa * 0.02953 = inHg
                display_pressure = round(raw_pressure * 0.02953, 2)
            else:
                display_pressure = raw_pressure

            return {
                "temp": round(current.get("temp")),
                "windspeed": current.get("windspeed"),
                "humidity": current.get("humidity"),
                "pressure": display_pressure,
                "visibility": current.get("visibility"),
                "description": current.get("conditions"),
                "timezone": data.get("timezone", "UTC")
            }
    except Exception as e:
        print(f"Visual Crossing Connection Error: {e}")
        return {"error": "Connection Timeout"}


@app.get("/moon-details")
@cache_sky_data(ttl_seconds=120)  # Caches for 2 minutes
async def get_moon_details(lat: float = Query(35.92), lon: float = Query(-86.86)):
    ts = load.timescale()
    t = ts.now()

    # Create the observer based on user location input
    user_location = Topos(latitude_degrees=lat, longitude_degrees=lon)
    observer = earth + user_location

    # Calculate illumination
    sun_obj, moon = eph['sun'], eph['moon']
    astrometric = observer.at(t).observe(moon)
    apparent = astrometric.apparent()

    illumination = apparent.fraction_illuminated(sun_obj)

    # Calculate Altitude and Azimuth
    alt, az, distance = apparent.altaz()
    # Get the 4 major upcoming phases
    milestones = get_upcoming_moon_phases()

    # Return Moon details for Moon.jsx:
    return {
        "illumination": round(float(illumination * 100), 2),
        "altitude": round(float(alt.degrees), 2),
        "azimuth": round(float(az.degrees), 2),
        "milestones": milestones
    }


@app.get("/solar-system")
@cache_sky_data(ttl_seconds=3600)
async def get_solar_system_positions():
    ts = load.timescale()
    t = ts.now()
    sun = eph['sun']

    bodies = {
        "Mercury": eph['mercury'],
        "Venus":   eph['venus'],
        "Earth":   eph['earth'],
        "Mars":    eph['mars'],
        "Jupiter": eph['jupiter_barycenter'],
        "Saturn":  eph['saturn_barycenter'],
        "Uranus":  eph['uranus_barycenter'],
        "Neptune": eph['neptune_barycenter'],
    }

    # Obliquity of ecliptic (J2000) — rotates ICRF equatorial → ecliptic plane
    eps = math.radians(23.4393)
    cos_e, sin_e = math.cos(eps), math.sin(eps)

    result: dict = {}
    for name, body in bodies.items():
        pos = sun.at(t).observe(body).position.au
        xi, yi, zi = float(pos[0]), float(pos[1]), float(pos[2])
        # Rotate to ecliptic plane so top-down view shows circular orbits
        x_ecl = xi
        y_ecl = yi * cos_e + zi * sin_e
        dist = math.sqrt(xi**2 + yi**2 + zi**2)
        result[name] = {
            "x_au": round(x_ecl, 4),
            "y_au": round(y_ecl, 4),
            "dist_au": round(dist, 4),
        }

    # Moon: position relative to Earth, then offset by Earth's heliocentric position
    moon_pos = eph['earth'].at(t).observe(eph['moon']).position.au
    mx = float(moon_pos[0]) * cos_e  # approximate ecliptic rotation for Moon too
    my = float(moon_pos[1]) * cos_e + float(moon_pos[2]) * sin_e
    moon_dist = math.sqrt(sum(float(p)**2 for p in moon_pos))
    result["Moon"] = {
        "x_au": round(result["Earth"]["x_au"] + float(moon_pos[0]), 6),
        "y_au": round(result["Earth"]["y_au"] + my, 6),
        "dist_au": round(moon_dist, 6),
    }

    return result


@app.get("/solar-system/range")
@cache_sky_data(ttl_seconds=3600)
async def get_solar_system_range():
    ts = load.timescale()
    t0 = ts.now()
    t = ts.tt_jd(t0.tt + np.arange(365))
    sun = eph['sun']

    bodies = {
        "Mercury": eph['mercury'],
        "Venus":   eph['venus'],
        "Earth":   eph['earth'],
        "Mars":    eph['mars'],
        "Jupiter": eph['jupiter_barycenter'],
        "Saturn":  eph['saturn_barycenter'],
        "Uranus":  eph['uranus_barycenter'],
        "Neptune": eph['neptune_barycenter'],
    }

    # Obliquity of ecliptic (J2000) — rotates ICRF equatorial → ecliptic plane
    eps = math.radians(23.4393)
    cos_e, sin_e = math.cos(eps), math.sin(eps)

    per_body: dict = {}
    for name, body in bodies.items():
        pos = sun.at(t).observe(body).position.au  # shape (3, 365)
        xi, yi, zi = pos[0], pos[1], pos[2]
        x_ecl = xi
        y_ecl = yi * cos_e + zi * sin_e
        dist = np.sqrt(xi**2 + yi**2 + zi**2)
        per_body[name] = (x_ecl, y_ecl, dist)

    # Moon: position relative to Earth, then offset by Earth's heliocentric position
    moon_pos = eph['earth'].at(t).observe(eph['moon']).position.au
    mx = moon_pos[0]
    my = moon_pos[1] * cos_e + moon_pos[2] * sin_e
    moon_dist = np.sqrt(moon_pos[0]**2 + moon_pos[1]**2 + moon_pos[2]**2)

    earth_x, earth_y, _ = per_body["Earth"]
    dates = t.utc_strftime("%Y-%m-%d")

    days = []
    for i in range(365):
        day_entry = {}
        for name, (xs, ys, ds) in per_body.items():
            day_entry[name] = {
                "x_au": round(float(xs[i]), 4),
                "y_au": round(float(ys[i]), 4),
                "dist_au": round(float(ds[i]), 4),
            }
        day_entry["Moon"] = {
            "x_au": round(float(earth_x[i] + mx[i]), 6),
            "y_au": round(float(earth_y[i] + my[i]), 6),
            "dist_au": round(float(moon_dist[i]), 6),
        }
        days.append(day_entry)

    return {"dates": list(dates), "days": days}


if __name__ == "__main__":
    import uvicorn
    print("Initializing Sky Watch Telemetry Dashboard...")
    # allows you to run the server by typing 'python main.py'
    uvicorn.run(app, host="0.0.0.0", port=8000)
