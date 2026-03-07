import redis
import json
import asyncio
import os
from functools import wraps
from dotenv import load_dotenv

# Load variables from .env if it exists
load_dotenv()

# Logic: 
# 1. Look for REDIS_URL (Set this in Render/Vercel for Upstash)
# 2. Fallback to 127.0.0.1 (Standard for WSL/Local Redis)
redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

# Create the client
# decode_responses=True ensures we get strings back instead of bytes
r = redis.from_url(redis_url, decode_responses=True)

def cache_sky_data(ttl_seconds=60):
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            lat = kwargs.get('lat', 35.92)
            lon = kwargs.get('lon', -86.86)
            cache_key = f"{func.__name__}:{round(float(lat), 1)}:{round(float(lon), 1)}"
            
            try:
                cached_val = r.get(cache_key)
                if cached_val:
                    return json.loads(cached_val)
            except Exception as e:
                print(f"Redis Cache Read Error: {e}")

            result = await func(*args, **kwargs)
            
            # Only cache if result is valid and not an error dictionary
            try:
                if result and not (isinstance(result, dict) and "error" in result):
                    r.setex(cache_key, ttl_seconds, json.dumps(result))
            except Exception as e:
                print(f"Redis Cache Write Error: {e}")
                
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            lat = kwargs.get('lat', 35.92)
            lon = kwargs.get('lon', -86.86)
            cache_key = f"{func.__name__}:{round(float(lat), 1)}:{round(float(lon), 1)}"
            
            try:
                cached_val = r.get(cache_key)
                if cached_val:
                    return json.loads(cached_val)
            except Exception as e:
                print(f"Redis Cache Read Error: {e}")

            result = func(*args, **kwargs)
            
            try:
                if result and not (isinstance(result, dict) and "error" in result):
                    r.setex(cache_key, ttl_seconds, json.dumps(result))
            except Exception as e:
                print(f"Redis Cache Write Error: {e}")
                
            return result

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

# --- Connection Diagnostic ---
try:
    r.ping()
    connection_type = "Cloud/Upstash" if "upstash" in redis_url or "render" in redis_url else "WSL/Local"
    print(f"Redis Status: Connected to {connection_type} ({redis_url.split('@')[-1] if '@' in redis_url else redis_url})")
except Exception as e:
    print(f"Redis Status: Connection Failed! Error: {e}")