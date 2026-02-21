import redis
import json
import asyncio # New import
from functools import wraps

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def cache_sky_data(ttl_seconds=60):
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs): # For async routes
            lat = kwargs.get('lat', 35.92)
            lon = kwargs.get('lon', -86.86)
            cache_key = f"{func.__name__}:{round(lat, 1)}:{round(lon, 1)}"
            
            cached_val = r.get(cache_key)
            if cached_val:
                return json.loads(cached_val)

            # Await the async function
            result = await func(*args, **kwargs)
            r.setex(cache_key, ttl_seconds, json.dumps(result))
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs): # For sync routes (like sky_summary)
            lat = kwargs.get('lat', 35.92)
            lon = kwargs.get('lon', -86.86)
            cache_key = f"{func.__name__}:{round(lat, 1)}:{round(lon, 1)}"
            
            cached_val = r.get(cache_key)
            if cached_val:
                return json.loads(cached_val)

            result = func(*args, **kwargs)
            r.setex(cache_key, ttl_seconds, json.dumps(result))
            return result

        # Return the correct wrapper based on the function type
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator