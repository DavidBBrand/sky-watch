import { useState, useEffect } from "react";
import "./App.css";
import MoonTracker from "./MoonTracker.jsx";
import Weather from "./Weather.jsx";
import SkyDetails from "./SkyDetails.jsx";
import LocationSearch from "./LocationSearch.jsx";

function App() {
  const [isNight, setIsNight] = useState(true);
  const [skyData, setSkyData] = useState(null);

  // 1. DYNAMIC LOCATION STATE
  // Initialized to your Franklin, TN coordinates
  const [location, setLocation] = useState({
    lat: 35.9251,
    lon: -86.8689,
    name: "Franklin, TN"
  });

  const getLocalSolarTime = () => {
    const now = new Date();
    // Get UTC time in hours
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    // Every 15 degrees is 1 hour of offset
    const solarOffset = location.lon / 15;
    let localSolarHours = (utcHours + solarOffset + 24) % 24;

    const h = Math.floor(localSolarHours);
    const m = Math.floor((localSolarHours - h) * 60);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  // UI THEME EFFECT
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isNight ? "night" : "day"
    );
  }, [isNight]);

  // 2. UPDATED DATA FETCH EFFECT
  // This now runs whenever the 'location' state changes
  useEffect(() => {
    // We clear old data so the user sees a "loading" state when switching cities
    setSkyData(null);

    fetch(
      `http://127.0.0.1:8000/sky-summary?lat=${location.lat}&lon=${location.lon}`
    )
      .then((response) => response.json())
      .then((data) => setSkyData(data))
      .catch((err) => console.error("FETCH ERROR:", err));
  }, [location]); // Dependency array includes location

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "60px"
      }}
    >
      {/* 1. Toggle Button */}
      <button
        onClick={() => setIsNight(!isNight)}
        className="theme-toggle-btn"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 100
        }}
      >
        {isNight ? "🌙 Night Mode" : "☀️ Day Mode"}
      </button>

      {/* 2. Header Section */}
      <header style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1
          style={{
            margin: 0,
            fontWeight: "200",
            color: "var(--text-main)",
            fontSize: "2.5rem"
          }}
        >
          SKY DASHBOARD
        </h1>
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            color: "var(--text-sub)",
            letterSpacing: "2px",
            fontSize: "0.9rem",
            textTransform: "uppercase",
            fontWeight: "300"
          }}
        >
          <span>{location.name}</span>
          <span>
            {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"}{" "}
            /{" "}
            {Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? "E" : "W"}
          </span>
          <span
            style={{
              color: "var(--accent-color)",
              fontSize: "0.8rem",
              fontWeight: "500"
            }}
          >
            Solar Time: {getLocalSolarTime()}
          </span>
          {/* Standard Time Offset */}
          <span
            style={{ fontSize: "0.7rem", opacity: 0.6, letterSpacing: "1px" }}
          >
            UTC OFFSET: {location.lon >= 0 ? "+" : ""}
            {(location.lon / 15).toFixed(1)} HRS
          </span>
        </div>
      </header>

      {/* 3. NEW: Location Search Bar */}
      <LocationSearch onLocationChange={setLocation} />

      {/* 4. Cards Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "center",
          gap: "25px",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "1200px",
          padding: "20px"
        }}
      >
        {/* Pass location to these components so they can fetch their own weather/moon data too! */}
        <MoonTracker lat={location.lat} lon={location.lon} />
        <Weather lat={location.lat} lon={location.lon} />

        {skyData ? (
          <SkyDetails skyData={skyData} />
        ) : (
          <div
            className="sky-details-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <p style={{ opacity: 0.5, color: "var(--text-sub)" }}>
              Synchronizing with {location.name}...
            </p>
          </div>
        )}
      </div>
      <p style={{ fontSize: "0.6em", opacity: "0.4", marginTop: "40px" }}>
        Copyright © 2026 David Brand{" "}
      </p>
    </div>
  );
}

export default App;
