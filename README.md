# 🌙 Sky Watch Telemetry Dashboard

A high-precision, observatory-style dashboard featuring real-time astronomical tracking and local weather synchronization.

## 🚀 Getting Started

Live Demo: [skywatchdash.com](https://www.skywatchdash.com)

This application is fully containerized using **Docker** and **Docker Compose**. This ensures sub-millisecond astronomical accuracy and environmental partiy across all platforms.

### Prerequisites

* **Docker Desktop**: Must be installed and running
* **Weather API Key**: Sign up for a free key at [Visual Crossing Weather](https://www.visualcrossing.com/weather-api).
### 🗄️ Infrastructure Services
This project uses **Docker Compose** to automatically orchestrate the following services:

* **FastAPI (telemetry-api):** The core Python engine running on port `8000`.
* **Redis (cache):** An in-memory data store used for telemetry caching.
    * **Image:** `redis:7-alpine`
    * **Internal Port:** `6379`
    * **Purpose:** Mitigates API rate limits by caching astronomical vectors and weather data for 24 hours.

### Local Installation
1. **Clone & Navigate:**
   ```bash
   git clone [https://github.com/dbrand87/sky-watch.git](https://github.com/dbrand87/sky-watch.git)
   cd sky-watch
### Frontend Setup (React + Vite)
```bash
cd skyapp-frontend
npm install
npm run dev
```
## BACKEND SETUP (Docker)
from the root directory containing the docker-compose.yml file, run:
```bash
docker-compose up --build
```

## 🛰️ System Architecture

```mermaid
graph TD
    subgraph Frontend [React Frontend - Vite]
        UI[App.jsx / Dashboard UI]
        LC[LocationContext - GPS/Address]
        TC[ThemeContext - Night/Day Mode]
        Map[Leaflet - Star/ISS Map]
    end

    subgraph Backend [FastAPI - Python]
        API[Main API Endpoints]
        SF[Skyfield - Ephemeris Engine]
        Redis[(Redis Cache)]
    end

    subgraph External [External Data]
        NASA[NASA JPL/DE421 Data]
        ReverseGeo[Reverse Geocoding API]
    end

    %% Interactions
    LC -->|Lat/Lon| UI
    UI -->|GET /sky-summary| API
    API -->|Check Cache| Redis
    Redis -->|Miss| SF
    SF -->|Orbital Math| NASA
    SF -->|Result| API
    API -->|JSON Data| UI
    UI -->|Render Planets/Moon| Map
```

## ⏱️ Timing Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant FastAPI
    participant Redis
    participant NASA

    User->>Browser: Opens Sky Watch
    Browser->>Browser: Get GPS Coord
    Browser->>FastAPI: GET /sky-summary?lat=xx&lon=yy
    FastAPI->>Redis: Check Cache
    alt Cache Hit
        Redis-->>FastAPI: Return Cached Data
    else Cache Miss
        FastAPI->>NASA: Fetch Ephemeris (DE421)
        NASA-->>FastAPI: Planetary Vectors
        FastAPI->>Redis: Store Result (24h)
    end
    FastAPI-->>Browser: JSON Payload
    Browser->>User: Render HUD & Star Map
```
