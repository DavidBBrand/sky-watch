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
  const [issDistance, setIssDistance] = useState(null);
  const [locationDate, setLocationDate] = useState("");

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
  // Use the timezone from weatherData if available, otherwise default to Chicago/Franklin
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
    // Fallback in case the API returns an invalid timezone string
    console.error("Timezone Error:", e);
    setLocationDate(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).replace(/(\w+)/, "$1."));
  }

  // CORRECTED DEPENDENCIES: Using location object and weatherData for timezone sync
}, [location.lat, location.lon, weatherData?.timezone]); // Recalculate if location changes

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
        <h1 className="main-title">SKY WATCH</h1>
        <div
          className="logo-container"
          role="img"
          aria-label="Sky Dashboard Logo"
        />

        <div className="search-wrapper">
          <LocationSearch onLocationChange={setLocation} />
        </div>

        <div className="telemetry-info">
          <span>{location.name}</span>
          <span>
            {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"}{" "}
            / {Math.abs(location.lon).toFixed(2)}°
            {location.lon >= 0 ? "E" : "W"}
          </span>
          <span className="time-display">
            Solar Time: {getLocalSolarTime()}
          </span>
          <span>
            UTC OFFSET: {location.lon >= 0 ? "+" : ""}
            {(location.lon / 15).toFixed(1)} HRS
          </span>
          <span className="time-display">
            LOCAL STANDARD TIME: {weatherData ? getLiveLocalTime() : "--:--"}
          </span>
          {skyData?.sun?.phase && <GoldenHour sunData={skyData.sun} />}
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card">
          <MoonGraphic3 lat={location.lat} lon={location.lon} date={locationDate} />
        </div>

        <div className="glass-card">
          <Weather
            lat={location.lat}
            lon={location.lon}
            onDataReceived={setWeatherData}
            sun={skyData?.sun}
            theme={isNight ? "night" : "day"}
          />
        </div>

        <div
          className={`glass-card ${issDistance < 500 ? "proximity-alert-active" : ""}`}
        >
          <ISSWatcher
            lat={location.lat}
            lon={location.lon}
            onDistanceUpdate={setIssDistance}
          />
        </div>

        <div className="glass-card">
          <StarlinkGrid lat={location.lat} lon={location.lon} />
        </div>

        <div className="glass-card">
          <MapCard
            lat={location.lat}
            lon={location.lon}
            theme={isNight ? "night" : "day"}
            skyData={skyData}
            location={location}
          />
        </div>

        <div className="glass-card">
          {skyData ? (
            <SkyDetails skyData={skyData} />
          ) : (
            <div className="loading-card">
              <p>Synchronizing with {location.name}...</p>
            </div>
          )}
        </div>
      </div>

      <p className="copyright">Copyright © 2026 David Brand</p>
    </div>
  );
}

export default App;
