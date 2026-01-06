import { useState, useEffect } from "react";
import "./App.css";
import MoonTracker from "./MoonTracker.jsx";
import Weather from "./Weather.jsx";
import SkyDetails from "./SkyDetails.jsx";

function App() {
  const [isNight, setIsNight] = useState(true); 
  const [skyData, setSkyData] = useState(null);

  const locationName = "Franklin, TN";
  const coordinates = { lat: 35.9251, lon: -86.8689 };

  // UI THEME EFFECT
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isNight ? 'night' : 'day');
  }, [isNight]);

  // DATA FETCH EFFECT
  useEffect(() => {
    fetch("http://127.0.0.1:8000/sky-summary")
      .then((response) => response.json())
      .then((data) => setSkyData(data))
      .catch((err) => console.error("FETCH ERROR:", err));
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      paddingTop: '60px' 
    }}>
      
      {/* 1. Toggle Button */}
      <button 
        onClick={() => setIsNight(!isNight)}
        className="theme-toggle-btn" 
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100
          // Other styles now handled by index.css button class
        }}
      >
        {isNight ? '🌙 Night Mode' : '☀️ Day Mode'}
      </button>

      {/* 2. Header Section */}
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ margin: 0, fontWeight: '300', color: 'var(--text-main)' }}>
          SKY DASHBOARD 
        </h1>
        <p style={{ color: 'var(--text-sub)', letterSpacing: '2px', fontSize: '0.8rem', marginTop: '10px' }}>
          FOR {locationName.toUpperCase()} ({coordinates.lat}° N, {coordinates.lon}° W)
        </p>
      </header>

      {/* 3. Cards Container */}
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
        <MoonTracker />
        <Weather />

        {skyData ? (
          <SkyDetails skyData={skyData} />
        ) : (
          <div className="sky-details-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ opacity: 0.5, color: 'red'}}>Connecting to Sky Station...</p>
          </div>
        )}
      </div>
      <p style={{ fontSize: '0.7rem', opacity: '0.3'}}>Copyright © 2026 David Brand </p>
    </div>
  );
}

export default App;