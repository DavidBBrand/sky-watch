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

  // UI THEME EFFECT
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isNight ? 'night' : 'day');
  }, [isNight]);

  // 2. UPDATED DATA FETCH EFFECT
  // This now runs whenever the 'location' state changes
  useEffect(() => {
    // We clear old data so the user sees a "loading" state when switching cities
    setSkyData(null);

    fetch(`http://127.0.0.1:8000/sky-summary?lat=${location.lat}&lon=${location.lon}`)
      .then((response) => response.json())
      .then((data) => setSkyData(data))
      .catch((err) => console.error("FETCH ERROR:", err));
  }, [location]); // Dependency array includes location

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
        }}
      >
        {isNight ? '🌙 Night Mode' : '☀️ Day Mode'}
      </button>

      {/* 2. Header Section */}
      <header style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontWeight: '300', color: 'var(--text-main)' }}>
          SKY DASHBOARD 
        </h1>
        <p style={{ color: 'var(--text-sub)', letterSpacing: '2px', fontSize: '0.8rem', marginTop: '10px', textTransform: 'uppercase' }}>
          FOR {location.name} ({location.lat.toFixed(2)}° N, {location.lon.toFixed(2)}° W)
        </p>
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
          <div className="sky-details-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ opacity: 0.5, color: 'var(--text-sub)' }}>Synchronizing with {location.name}...</p>
          </div>
        )}
      </div>
      <p style={{ fontSize: '0.6em', opacity: '0.4', marginTop: '40px' }}>Copyright © 2026 David Brand </p>
    </div>
  );
}

export default App;