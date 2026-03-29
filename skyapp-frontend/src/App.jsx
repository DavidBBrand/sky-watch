import { useState, useEffect } from "react";
// ADD THIS IMPORT BELOW:
import { useLocation } from "./LocationContext.jsx";

import "./App.css";
import Weather from "./Weather.jsx";
import Planets from "./Planets.jsx";
import LocationSearch from "./LocationSearch.jsx";
import GoldenHour from "./GoldenHour.jsx";
import MapCard from "./MapCard.jsx";
import ISSWatcher from "./ISSWatcher.jsx";
import Starlink from "./Starlink.jsx";
import Moon from "./Moon.jsx";
import logoDay from "./assets/skywatchday.png";
import logoNight from "./assets/skywatch.png";

function App() {
  const { location, updateLocation } = useLocation(); 

  const [isNight, setIsNight] = useState(true);
  const [skyData, setSkyData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [issDistance, setIssDistance] = useState(null);
  const [locationDate, setLocationDate] = useState("");

  const currentLogo = isNight ? logoNight : logoDay;

  const getLocalSolarTime = () => {
    if (!location) return "--:--";
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const solarOffset = location.lon / 15;
    let localSolarHours = (utcHours + solarOffset + 24) % 24;
    const h = Math.floor(localSolarHours);
    const m = Math.floor((localSolarHours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

const getLiveLocalTime = () => {
    // Visual Crossing 
    if (!weatherData || !weatherData.timezone) return "--:--";
    
    try {
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: weatherData.timezone, 
      });
    } catch (e) {
      console.error("Local Time Error:", e);
      return "--:--";
    }
  };
  // Sync Date with Timezone
  useEffect(() => {
    const targetTimeZone = weatherData?.timezone || "America/Chicago";
    try {
      const dateString = new Date()
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: targetTimeZone
        })
        .replace(/(\w+)/, "$1.");
      setLocationDate(dateString);
    } catch (e) {
      console.error("Timezone Error:", e);
    }
  }, [location.lat, location.lon, weatherData?.timezone]);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isNight ? "night" : "day"
    );
  }, [isNight]);

  // Global Sky Data Fetch
  useEffect(() => {
   
    if (location.lat === null) return;

    const controller = new AbortController();
    const fetchSkyData = async () => {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(
          `${API_BASE_URL}/sky-summary?lat=${location.lat}&lon=${location.lon}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        setSkyData(data);
      } catch (err) {
        if (err.name !== "AbortError") console.error("FETCH ERROR:", err);
      }
    };

    fetchSkyData();
    return () => controller.abort();
  }, [location.lat, location.lon]); // fires once lat changes from null
  if (location.lat === null) {
    return (
      <div className="loading-screen card-title">
        <div className="scanner"></div>
          <div>System Initializing...</div>
          <div>Please click <strong>'Allow'</strong> to synchronize local telemetry</div>
      </div>
    );
  }
  return (
    <div className="app-container">
      {/* SYSTEM STATUS OVERLAY */}
      {location.isInitial && (
        <div className="system-status-bar">
          <span className="blink">●</span> Initializing...
        </div>
      )}
      <button onClick={() => setIsNight(!isNight)} className="theme-toggle-btn" aria-label="Toggle day/night mode">
        {isNight ? "🌙 Night Mode" : "☀️ Day Mode"}
      </button>

      <header className="header-section">
        <h1 className="main-title">SKY WATCH</h1>
        <h2 className="sub-title">Telemetry Dashboard</h2>

        <div
          className="logo-container"
          style={{ backgroundImage: `url(${currentLogo})` }}
        ></div>
        <div className="search-wrapper">
          <LocationSearch onLocationChange={updateLocation} />
        </div>

        <div className="telemetry-info">
          <span className="glow-sub">{location.name}</span>
          <span className="glow-sub">
            {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"}{" "}
            / {Math.abs(location.lon).toFixed(2)}°
            {location.lon >= 0 ? "E" : "W"}
          </span>
          <span className="time-display">
            Solar Time: {getLocalSolarTime()}
          </span>
          <span className="glow-sub">
            UTC Offset: {location.lon >= 0 ? "+" : ""}
            {(location.lon / 15).toFixed(1)} HRS
          </span>
          <span className="time-display">
            Local Time: {weatherData ? getLiveLocalTime() : "--:--"}
          </span>
          {skyData?.sun?.phase && <GoldenHour sunData={skyData.sun} />}
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card">
          <Moon date={locationDate} />
        </div>
        <div className="glass-card">
          <Weather
            onDataReceived={setWeatherData}
            sun={skyData?.sun}
            theme={isNight ? "night" : "day"}
          />
        </div>
        <div
          className={`glass-card ${issDistance < 500 ? "proximity-alert-active" : ""}`}
        >
          <ISSWatcher onDistanceUpdate={setIssDistance} />
        </div>
        <div className="glass-card">
          <Starlink />
        </div>
        <div className="glass-card">
          <MapCard
            theme={isNight ? "night" : "day"}
            skyData={skyData}
            date={locationDate}
          />
        </div>
        <div className="glass-card">
          {skyData ? (
            <Planets skyData={skyData} />
          ) : (
            <div className="loading-card glow-sub2">
              <div>Synchronizing with {location.name}...</div>
            </div>
          )}
        </div>
      </div>
      <p className="copyright glow-sub2"> © 2026 David Brand</p>
    </div>
  );
}

export default App;
