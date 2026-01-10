import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from skyfield.api import load, Topos
from skyfield import almanac
from datetime import datetime, timedelta

app = FastAPI()

# 1. CORS Middleware (Must be defined once)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Configuration & Global Data
LAT = 35.92  # Franklin, TN
LON = -86.86
LOCATION = Topos(latitude_degrees=LAT, longitude_degrees=LON)

# Load the ephemeris (the planetary map) once at startup
eph = load('de421.bsp')
earth = eph['earth']
observer = earth + LOCATION

def get_weather_description(code):
    mapping = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 
        53: "Moderate drizzle", 55: "Dense drizzle", 61: "Slight rain", 
        63: "Moderate rain", 65: "Heavy rain", 71: "Slight snow", 
        73: "Moderate snow", 75: "Heavy snow", 95: "Thunderstorm"
    }
    return mapping.get(code, "Cloudy")

# --- ENDPOINTS ---

@app.get("/sky-summary")
def get_sky_summary():
    ts = load.timescale()
    t = ts.now()
    
    # 1. MOON DATA
    sun_obj, moon = eph['sun'], eph['moon']
    m = observer.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun_obj)

    # 2. SUNRISE/SUNSET
    t0 = ts.utc(t.utc_datetime().year, t.utc_datetime().month, t.utc_datetime().day)
    t1 = ts.utc(t0.utc_datetime() + timedelta(days=1))
    times, events = almanac.find_discrete(t0, t1, almanac.sunrise_sunset(eph, LOCATION))
    
    # 3. PLANET VISIBILITY
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
            "altitude": round(float(alt.degrees), 1), # Ensure it's a float
            "azimuth": round(float(az.degrees), 1), 
            "is_visible": bool(alt.degrees > 0)       # Ensure it's a standard bool
        }

    return {
        "moon": {"illumination": round(float(illumination * 100), 2)},
        "sun": {
            "sunrise": times[events == 1][0].utc_iso() if any(events == 1) else None,
            "sunset": times[events == 0][0].utc_iso() if any(events == 0) else None,
        },
        "planets": planet_data
    }

@app.get("/weather")
def get_weather():
    url = f"https://api.open-meteo.com/v1/forecast?latitude={LAT}&longitude={LON}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph"
    try:
        response = requests.get(url)
        data = response.json()
        current = data["current_weather"]
        return {
            "temp": round(current["temperature"]),
            "windspeed": current["windspeed"],
            "description": get_weather_description(current["weathercode"])
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/moon-illumination") # Kept for backward compatibility with old components
def get_moon():
    ts = load.timescale()
    t = ts.now()
    sun, moon = eph['sun'], eph['moon']
    m = earth.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun)
    print(illumination)
    return {"illumination": round(illumination * 100, 2)} 