import React, { useState, useEffect } from "react";
import "./ISSWatcher.css";

const ISSWatcher = ({ lat, lon }) => {
  const [issPos, setIssPos] = useState({ lat: 0, lon: 0 });
  const [distance, setDistance] = useState(null);
  const [cityName, setCityName] = useState("Local Station");

  useEffect(() => {
    // 1. Get the name of the user's location (Reverse Geocoding)
    const getLocalName = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const city =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          "Unknown";
        const state = data.address.state || "";
        setCityName(`${city}${state ? ", " + state : ""}`);
      } catch (e) {
        setCityName("Ground Station");
      }
    };

    if (lat && lon) getLocalName();

    // 2. ISS Tracking Logic
    const fetchISS = async () => {
      try {
        const res = await fetch("http://api.open-notify.org/iss-now.json");
        const data = await res.json();
        const { latitude, longitude } = data.iss_position;

        setIssPos({ lat: latitude, lon: longitude });

        const R = 3958.8;
        const dLat = (latitude - lat) * (Math.PI / 180);
        const dLon = (longitude - lon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) *
            Math.cos(latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setDistance(R * c);
      } catch (e) {
        console.error("ISS Tracking Offline");
      }
    };

    fetchISS();
    const interval = setInterval(fetchISS, 5000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  const isNearby = distance < 500;

  return (
    <div className={`iss-card ${isNearby ? "nearby" : ""}`}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <p
          style={{
            letterSpacing: "2px",
            fontSize: "1.2rem",
            color: "var(--text-sub)",
            marginBottom: "25px",
            fontWeight: "600"
          }}
        >
          ORBITAL TRACKER
        </p>
      </div>
      {/* --- Ping Section --- */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          margin: "40px 0"
        }}
      >
        <div
          className="ping-indicator"
          style={{
            backgroundColor: isNearby ? "#aade4a" : "#16e782"
          }}
        ></div>
      </div>

      <h2
        className="iss-radar-text"
        style={{
          margin: "15px 0 5px 0",
          fontSize: "1.4rem",
          animationDuration: isNearby ? "1.5s" : "4s"
        }}
      >
        INT'L SPACE STATION
      </h2>

    <svg 
    className="iss-favicon" 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    {/* Central Module */}
    <rect x="10" y="8" width="4" height="8" rx="1" />
    <rect x="7" y="11" width="10" height="2" rx="0.5" />
    {/* Left Solar Arrays */}
    <rect x="2" y="5" width="4" height="14" rx="1" opacity="0.8" />
    {/* Right Solar Arrays */}
    <rect x="18" y="5" width="4" height="14" rx="1" opacity="0.8" />
    {/* Connecting Truss */}
    <rect x="6" y="11.5" width="12" height="1" />
  </svg>
  <h3>ISS Tracker</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div
          className={isNearby ? "iss-radar-text" : ""}
          style={{
            fontSize: "2.2rem",
            fontWeight: "bold",
            color: isNearby ? "transparent" : "var(--text-main)",
            fontFamily: "monospace",
            lineHeight: "1",
            marginBottom: "20px",
            marginTop: "25px"
          }}
        >
          {distance
            ? `${Math.round(distance).toLocaleString()}mi`
            : "SCANNING..."}
        </div>

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-sub)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            margin: 0
          }}
        >
          from {cityName}
        </p>
      </div>

      <p
        style={{
          fontSize: "0.7rem",
          color: "var(--text-sub)",
          marginTop: "15px",
          fontFamily: "monospace",
          opacity: 0.8
        }}
      >
        LAT: {parseFloat(issPos.lat).toFixed(2)} | LON:{" "}
        {parseFloat(issPos.lon).toFixed(2)}
      </p>

      {isNearby && (
        <div className="proximity-alert">LOW ORBIT PROXIMITY ALERT</div>
      )}
    </div>
  );
};

export default ISSWatcher;
