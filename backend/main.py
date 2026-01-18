import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from skyfield.api import load, Topos
from skyfield import almanac
from datetime import datetime, timedelta
import httpx

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

# --- UPDATED ENDPOINTS ---


@app.get("/sky-summary")
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
        "Saturn": eph['saturn_barycenter']
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

# @app.get("/weather")
# def get_weather(lat: float = Query(35.92), lon: float = Query(-86.86)):
#     # Added &timezone=auto to the URL
#     url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto"
#     try:
#         response = requests.get(url)
#         data = response.json()
#         current = data["current_weather"]
#         return {
#             "temp": round(current["temperature"]),
#             "windspeed": current["windspeed"],
#             "description": get_weather_description(current["weathercode"]),
#             "timezone": data.get("timezone"), # Return the timezone name (e.g., "America/Chicago")
#             "local_time": current["time"]      # Return the formatted local time string
#         }
#     except Exception as e:
#         return {"error": str(e)}


@app.get("/weather")
async def get_weather(lat: float = Query(35.92), lon: float = Query(-86.86)):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=5.0)  # Set a timeout
            data = response.json()

            current = data.get("current_weather", {})
            return {
                "temp": round(current.get("temperature", 0)),
                "windspeed": current.get("windspeed", 0),
                "description": get_weather_description(current.get("weathercode", 0)),
                "timezone": data.get("timezone", "UTC"),
                # Return UTC offset in seconds
                "utc_offset": data.get("utc_offset_seconds", 0),
                "local_time": current.get("time", "Unknown")
            }
        except Exception as e:
            return {"error": "Weather service timeout"}


@app.get("/moon-details")
def get_moon_details(lat: float = Query(35.92), lon: float = Query(-86.86)):
    ts = load.timescale()
    t = ts.now()

    # Create the observer based on user input
    user_location = Topos(latitude_degrees=lat, longitude_degrees=lon)
    observer = earth + user_location

    # Calculate illumination
    sun_obj, moon = eph['sun'], eph['moon']
    m = observer.at(t).observe(moon).apparent()
    illumination = m.fraction_illuminated(sun_obj)

    # Return exactly what MoonTracker.jsx is looking for
    return {"illumination": round(float(illumination * 100), 4)}
