# Sky Watch Telemetry Dashboard

A high-precision, observatory-style dashboard featuring real-time astronomical tracking and local weather synchronization.

## Getting Started

Live Demo: [skywatchdash.com](https://www.skywatchdash.com)

This application is fully containerized using **Docker** and **Docker Compose**. This ensures sub-millisecond astronomical accuracy and environmental parity across all platforms.

### Prerequisites

* **Docker Desktop**: Must be installed and running
* **Weather API Key**: Sign up for a free key at [Visual Crossing Weather](https://www.visualcrossing.com/weather-api).
### Infrastructure Services
This project uses **Docker Compose** to automatically orchestrate the following services:

* **FastAPI (telemetry-api):** The core Python engine running on port `8000`.
* **Redis (cache):** An in-memory data store used for telemetry caching.
    * **Image:** `redis:7-alpine`
    * **Internal Port:** `6379`
    * **Purpose:** Mitigates API rate limits by caching astronomical vectors and weather data for 24 hours.

### Local Installation
1. **Clone & Navigate:**
   ```bash
   git clone [https://github.com/DavidBBrand/sky-watch.git]
   cd sky-watch
### Frontend Setup (React + Vite)
```bash
cd skyapp-frontend
npm install
npm run dev
```
### BACKEND SETUP (Docker)
from the root directory containing the docker-compose.yml file, run:
```bash
docker-compose up --build
```

## 🛰️ System Architecture
```mermaid
graph TD
    subgraph Frontend ["⚛️ React Frontend (Vite)"]
        UI[App.tsx / Dashboard]
        LC[LocationContext - GPS / Search]
        Radar[Starlink Radar - satellite.js]
        Globe[StarlinkGlobe - react-globe.gl]
        Solar[SolarSystem - SVG]
        LeafletMap[WeatherMap - Leaflet]
    end

    subgraph Backend ["🐍 FastAPI Backend (Python)"]
        API[API Endpoints]
        SF[Skyfield - de421.bsp]
        Redis[(Redis Cache)]
        Backup[starlink_backup.json]
    end

    subgraph External ["🌐 External APIs"]
        VC[Visual Crossing - Weather]
        ST[Space-Track - TLE Data]
        MB[Mapbox - Radar Map Tiles]
    end

    LC -->|lat/lon| UI
    UI -->|GET /sky-summary| API
    UI -->|GET /starlink-live| API
    UI -->|GET /solar-system| API
    API <-->|TTL Cache| Redis
    API --> SF
    SF -->|de421.bsp local| SF
    API -->|Weather fetch| VC
    API -->|TLE fetch| ST
    ST -->|Fallback| Backup
    VC --> API
    ST --> API
    API -->|JSON| UI
    UI -->|Map tiles| MB
    UI --> Radar
    UI --> Globe
    UI --> Solar
    UI --> LeafletMap
```

## ⏱️ Timing Diagram

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant FastAPI
    participant Redis
    participant VisualCrossing
    participant SpaceTrack

    User->>Browser: Opens Sky Watch
    Browser->>Browser: Request GPS Coordinates
    Browser->>FastAPI: GET /sky-summary?lat=xx&lon=yy
    FastAPI->>Redis: Check Cache
    alt Cache Hit
        Redis-->>FastAPI: Return Cached Data
    else Cache Miss
        FastAPI->>VisualCrossing: Fetch Weather Data
        VisualCrossing-->>FastAPI: Weather JSON
        FastAPI->>FastAPI: Compute Planetary Positions (de421.bsp)
        FastAPI->>Redis: Store Result (TTL 24h)
    end
    FastAPI-->>Browser: JSON Payload
    Browser->>FastAPI: GET /starlink-live
    FastAPI->>SpaceTrack: Fetch TLEs (or serve backup)
    SpaceTrack-->>FastAPI: TLE Data
    FastAPI-->>Browser: Satellite TLEs
    Browser->>Browser: Propagate Orbits (satellite.js)
    Browser->>User: Render Dashboard
```
