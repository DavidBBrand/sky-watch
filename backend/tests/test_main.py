import pytest
from httpx import AsyncClient, ASGITransport # Added ASGITransport
from main import app 

@pytest.mark.asyncio
async def test_sky_summary_success():
    # New way to initialize the client for FastAPI
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/sky-summary?lat=35.92&lon=-86.86")
    
    assert response.status_code == 200
    data = response.json()
    assert "sun" in data
    assert "planets" in data

@pytest.mark.asyncio
async def test_invalid_coordinates():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/sky-summary?lat=abc&lon=-86.86")
    
    assert response.status_code == 422