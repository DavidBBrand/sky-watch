import os
import json
from pathlib import Path
import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from skyfield.api import load, Topos
from skyfield import almanac
from datetime import datetime, timedelta
import httpx
from redis_client import cache_sky_data
import traceback

app = FastAPI()

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


@app.get("/starlink-live")
@cache_sky_data(ttl_seconds=86400)
async def get_starlink_tles():
    url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle"
    backup_path = Path(__file__).parent / "starlink_backup.json"

    # 1. Disguise the API call as a standard Chrome browser to bypass the 403 block
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/plain, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9"
    }

    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        try:
            # Increased timeout to 15s to accommodate the large text file
            response = await client.get(url, timeout=15.0)
            response.raise_for_status()

            raw_lines = [line.strip()
                         for line in response.text.splitlines() if line.strip()]

            structured_sats = []
            for i in range(0, len(raw_lines), 3):
                if i + 2 < len(raw_lines):
                    name = raw_lines[i]
                    line1 = raw_lines[i+1]
                    line2 = raw_lines[i+2]

                    if line1.startswith("1 ") and line2.startswith("2 "):
                        norad_id = line1[2:7].strip()
                        structured_sats.append({
                            "OBJECT_NAME": name,
                            "OBJECT_ID": norad_id,
                            "TLE_LINE1": line1,
                            "TLE_LINE2": line2
                        })

            # 2. Auto-heal the backup file with the correct format!
            if len(structured_sats) > 0:
                with open(backup_path, "w") as f:
                    json.dump(structured_sats, f)

            return structured_sats[:1500]

        except (httpx.ConnectTimeout, httpx.HTTPStatusError, Exception) as e:
            print(f" LIVE FETCH FAILED: {e}. Switching to local backup.")

            if backup_path.exists():
                with open(backup_path, "r") as f:
                    data = json.load(f)
                    return data[:1500]

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

    # 5. RESTORED: PLANET VISIBILITY LOGIC
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


if __name__ == "__main__":
    import uvicorn
    print("Initializing Sky Watch Telemetry Dashboard...")
    # allows you to run the server by typing 'python main.py'
    uvicorn.run(app, host="0.0.0.0", port=8000)
