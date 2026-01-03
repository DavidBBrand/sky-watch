import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from skyfield.api import load, Topos
from skyfield import almanac
from datetime import datetime, timedelta

app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configuration - Change these to your local coordinates!
# LAT = "35.92"  # Example: Franklin, TN
# LON = "-86.86"

# # Load the ephemeris once
# eph = load('de421.bsp')

def get_weather_description(code):
    """Maps Open-Meteo WMO codes to human-readable strings"""
    mapping = {
        0: "Clear sky",
        1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        95: "Thunderstorm"
    }
    return mapping.get(code, "Cloudy")

@app.get("/moon-illumination")
def get_moon():
    ts = load.timescale()
    t = ts.now()
    sun, moon, earth = eph['sun'], eph['moon'], eph['earth']
    e = earth.at(t)
    m = e.observe(moon).apparent()
    illumination = m.fraction_illuminated(sun)
    return {"illumination": round(illumination * 100, 2)}




app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LAT = 35.92  # Franklin, TN
LON = -86.86
# Create a Topos object for coordinate-based calculations
LOCATION = Topos(latitude_degrees=LAT, longitude_degrees=LON)

eph = load('de421.bsp')
earth = eph['earth']
observer = earth + LOCATION

@app.get("/sky-summary")
def get_sky_summary():
    ts = load.timescale()
    t = ts.now()
    
    # --- 1. MOON DATA ---
    sun, moon = eph['sun'], eph['moon']
    m = observer.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun)

    # --- 2. SUNRISE/SUNSET ---
    # Find events between midnight today and midnight tomorrow
    t0 = ts.utc(t.utc_datetime().year, t.utc_datetime().month, t.utc_datetime().day)
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=1))
    
    times, events = almanac.find_discrete(t0, t1, almanac.sunrise_sunset(eph, LOCATION))
    
    # --- 3. PLANET VISIBILITY ---
    # Planets to track
    target_planets = {
        "Venus": eph['venus'],
        "Mars": eph['mars'],
        "Jupiter": eph['jupiter_barycenter'],
        "Saturn": eph['saturn_barycenter']
    }
    
    planet_data = {}
    for name, body in target_planets.items():
        astrometric = observer.at(t).observe(body)
        alt, az, distance = astrometric.apparent().altaz()
        planet_data[name] = {
            "altitude": round(alt.degrees, 1),
            "is_visible": alt.degrees > 0  # Above the horizon
        }

    return {
        "moon": {"illumination": round(illumination * 100, 2)},
        "sun": {
            "sunrise": times[events == 1][0].utc_iso() if any(events == 1) else None,
            "sunset": times[events == 0][0].utc_iso() if any(events == 0) else None,
        },
        "planets": planet_data
    }
    
@app.get("/weather")
def get_weather():
    # Added temperature_unit=fahrenheit and windspeed_unit=mph
    url = f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph"
    
    try:
        response = requests.get(url)
        data = response.json()
        current = data["current_weather"]
        return {
            "temp": round(current["temperature"]), # Rounded for a cleaner look
            "windspeed": current["windspeed"],
            "description": get_weather_description(current["weathercode"])
        }
    except Exception as e:
        return {"error": str(e)}