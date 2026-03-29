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
# redis file
from redis_client import cache_sky_data
import traceback

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://sky-watch-chi.vercel.app",
    "https://skywatchdash.com",
    "https://www.skywatchdash.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Regex to allow any subdomain of sky-watch-*.vercel.app
    allow_origin_regex=r"https://sky-watch-.*\.vercel\.app",
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
    url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json"
    backup_path = Path(__file__).parent / "starlink_backup.json"
    
    headers = {
        "User-Agent": "Mozilla/5.0 SkyWatch-Telemetry-Monitor/1.0",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        try:
            # Short timeout so the user doesn't wait 15s for a failure
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
            return response.json()[:100]

        except (httpx.ConnectTimeout, httpx.HTTPStatusError, Exception) as e:
            print(f" LIVE FETCH FAILED: {e}. Switching to local backup.")
            
            # FALLBACK: Load from the local JSON file
            if backup_path.exists():
                with open(backup_path, "r") as f:
                    data = json.load(f)
                    return data[:100]
            
            return {"error": "Satellite link offline. No backup available."}

@app.get("/sky-summary")
@cache_sky_data(ttl_seconds=120)  # Cache for 2 minutes
async def get_sky_summary(lat: float = Query(35.92), lon: float = Query(-86.86)):
    ts = load.timescale()
    t = ts.now()
    # MOON DATA
    sun_obj, moon = eph['sun'], eph['moon']
    # Define location dynamically
    user_location = Topos(latitude_degrees=lat, longitude_degrees=lon)
    observer = earth + user_location

    # Get Sun's current Altitude
    sun_astrometric = observer.at(t).observe(sun_obj)
    sun_alt, sun_az, _ = sun_astrometric.apparent().altaz()
    current_sun_alt = float(sun_alt.degrees)

    # Determine "Light Phase"
    # Golden Hour is roughly -4 to +6 degrees
    is_golden_hour = -4 <= current_sun_alt <= 6

    # Blue Hour is roughly -6 to -4 degrees
    is_blue_hour = -6 <= current_sun_alt < -4

    m = observer.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun_obj)

    # SUNRISE/SUNSET (Dynamic Location)
    t0 = ts.utc(t.utc_datetime().year,
                t.utc_datetime().month, t.utc_datetime().day)
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=1))
    times, events = almanac.find_discrete(
        t0, t1, almanac.sunrise_sunset(eph, user_location))
    # PLANET VISIBILITY
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
        alt, az, distance = astrometric.apparent().altaz()
        planet_data[name] = {
            "altitude": round(float(alt.degrees), 1),
            "azimuth": round(float(az.degrees), 1),
            "is_visible": bool(alt.degrees > 0),
            "distance_au": round(float(distance.au), 2)
        }

    return {
        "moon": {"illumination": round(float(illumination * 100), 2)},
        "sun": {
            "sunrise": times[events == 1][0].utc_iso() if any(events == 1) else None,
            "sunset": times[events == 0][0].utc_iso() if any(events == 0) else None,
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

    # Return exactly what MoonTracker.jsx is looking for
    return {
        "illumination": round(float(illumination * 100), 2),
        "altitude": round(float(alt.degrees), 2),
        "azimuth": round(float(az.degrees), 2),
        "milestones": milestones
    }
