import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from skyfield.api import load, Topos
from skyfield import almanac
from datetime import datetime, timedelta
import httpx
# redis file 
from redis_client import cache_sky_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
# --- UPDATED ENDPOINTS ---


@app.get("/sky-summary")
@cache_sky_data(ttl_seconds=120)  # Cache for 2 minutes
def get_sky_summary(lat: float = Query(35.92), lon: float = Query(-86.86)):
    ts = load.timescale()
    t = ts.now()
    # 1. MOON DATA
    sun_obj, moon = eph['sun'], eph['moon']
    # Define location dynamically
    user_location = Topos(latitude_degrees=lat, longitude_degrees=lon)
    observer = earth + user_location

    # 1. Get Sun's current Altitude
    sun_astrometric = observer.at(t).observe(sun_obj)
    sun_alt, sun_az, _ = sun_astrometric.apparent().altaz()
    current_sun_alt = float(sun_alt.degrees)

    # 2. Determine "Light Phase"
    # Golden Hour is roughly -4 to +6 degrees
    is_golden_hour = -4 <= current_sun_alt <= 6

    # Blue Hour is roughly -6 to -4 degrees
    is_blue_hour = -6 <= current_sun_alt < -4

    m = observer.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun_obj)

    # 2. SUNRISE/SUNSET (Dynamic Location)
    t0 = ts.utc(t.utc_datetime().year,
                t.utc_datetime().month, t.utc_datetime().day)
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=1))
    times, events = almanac.find_discrete(
        t0, t1, almanac.sunrise_sunset(eph, user_location))
    # 3. PLANET VISIBILITY
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
            "is_visible": bool(alt.degrees > 0)
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
@cache_sky_data(ttl_seconds=120)  # Caches for 2 minutes
async def get_weather(lat: float = Query(35.92), lon: float = Query(-86.86)):
    # We added: &current=relative_humidity_2m,surface_pressure,visibility
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,visibility"
        f"&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto"
    )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0)
            data = response.json()
            
            # Open-Meteo puts these in the 'current' object now
            current = data.get("current", {})
            
            #Defensive check: if Open-Meteo sends None, we provide a fallback
            def safe_get(val, default=0):
                return val if val is not None else default 
            
            return {
                "temp": round(safe_get(current.get("temperature_2m"))),
                "windspeed": safe_get(current.get("wind_speed_10m")),
                "humidity": safe_get(current.get("relative_humidity_2m")),
                "pressure": safe_get(current.get("surface_pressure")),
                "visibility": safe_get(current.get("visibility")), # Returns in meters
                "description": get_weather_description(safe_get(current.get("weather_code"))),
                "timezone": data.get("timezone", "UTC"),
                "utc_offset": data.get("utc_offset_seconds", 0),
                "local_time": current.get("time", "Unknown")
            }
        except Exception as e:
            print(f"Error: {e}")
            return {"error": "Weather service unavailable"}


@app.get("/moon-details")
@cache_sky_data(ttl_seconds=120)  # Caches for 2 minutes
def get_moon_details(lat: float = Query(35.92), lon: float = Query(-86.86)):
    ts = load.timescale()
    t = ts.now()

    # Create the observer based on user input
    user_location = Topos(latitude_degrees=lat, longitude_degrees=lon)
    observer = earth + user_location

    # 1. Calculate illumination
    sun_obj, moon = eph['sun'], eph['moon']
    astrometric = observer.at(t).observe(moon)
    apparent = astrometric.apparent()

    illumination = apparent.fraction_illuminated(sun_obj)

    # 2. NEW: Calculate Altitude and Azimuth
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
