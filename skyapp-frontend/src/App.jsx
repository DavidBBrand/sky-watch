import { useState, useEffect } from "react";
import "./App.css";
import Weather from "./Weather.jsx";
import SkyDetails from "./SkyDetails.jsx";
import LocationSearch from "./LocationSearch.jsx";
import GoldenHour from "./GoldenHour.jsx";
import MapCard from "./MapCard.jsx";
import ISSWatcher from "./ISSWatcher.jsx";
import StarlinkGrid from "./StarlinkGrid.jsx";
import MoonGraphic3 from "./MoonGraphic3.jsx";

function App() {
  const [isNight, setIsNight] = useState(true);
  const [skyData, setSkyData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const [location, setLocation] = useState({
    lat: 35.9251,
    lon: -86.8689,
    name: "Franklin, TN"
  });

  const getLocalSolarTime = () => {
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const solarOffset = location.lon / 15;
    let localSolarHours = (utcHours + solarOffset + 24) % 24;
    const h = Math.floor(localSolarHours);
    const m = Math.floor((localSolarHours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const getLiveLocalTime = () => {
    if (!weatherData || !weatherData.utc_offset) return "--:--";
    const now = new Date();
    const utcTimestamp = now.getTime() + now.getTimezoneOffset() * 60000;
    const remoteTime = new Date(utcTimestamp + weatherData.utc_offset * 1000);
    return remoteTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isNight ? "night" : "day"
    );
  }, [isNight]);

  useEffect(() => {
    setSkyData(null);
    fetch(
      `http://127.0.0.1:8000/sky-summary?lat=${location.lat}&lon=${location.lon}`
    )
      .then((response) => response.json())
      .then((data) => setSkyData(data))
      .catch((err) => console.error("FETCH ERROR:", err));
  }, [location]);

  return (
    <div className="app-container">
      <button onClick={() => setIsNight(!isNight)} className="theme-toggle-btn">
        {isNight ? "🌙 Night Mode" : "☀️ Day Mode"}
      </button>

      <header className="header-section">
        <h1 className="rainbow-animated">SKY DASHBOARD</h1>

        <div className="telemetry-info">
          <span>{location.name}</span>
          <span>
            {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"}{" "}
            / {Math.abs(location.lon).toFixed(2)}°
            {location.lon >= 0 ? "E" : "W"}
          </span>
          <span className="accent-text">Solar Time: {getLocalSolarTime()}</span>
          <span>
            UTC OFFSET: {location.lon >= 0 ? "+" : ""}
            {(location.lon / 15).toFixed(1)} HRS
          </span>
          <span className="time-display">
            LOCAL STANDARD TIME: {weatherData ? getLiveLocalTime() : "--:--"}
          </span>
          {skyData?.sun?.phase && <GoldenHour sunData={skyData.sun} />}
        </div>

        <div className="search-wrapper">
          <LocationSearch onLocationChange={setLocation} />
        </div>
      </header>

      <div className="dashboard-grid">
        <MoonGraphic3 lat={location.lat} lon={location.lon} />
        
        <Weather
          lat={location.lat}
          lon={location.lon}
          onDataReceived={setWeatherData}
        />

        <ISSWatcher lat={location.lat} lon={location.lon} />

        <div className="grid-span-1">
          <StarlinkGrid lat={location.lat} lon={location.lon} />
        </div>

        {/* --- MAP CARD GRID PLACEMENT --- */}
        <div className="grid-span-1">
          <MapCard
            lat={location.lat}
            lon={location.lon}
            theme={isNight ? "night" : "day"}
          />
        </div>

        {skyData ? (
          <SkyDetails skyData={skyData} />
        ) : (
          <div className="sky-details-card loading-card">
            <p>Synchronizing with {location.name}...</p>
          </div>
        )}
      </div>

      <p className="copyright">Copyright © 2026 David Brand</p>
    </div>
  );
}

export default App;
