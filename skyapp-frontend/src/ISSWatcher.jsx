import React, { useState, useEffect } from "react";
import "./ISSWatcher.css";

// 1. Accept onDistanceUpdate prop
const ISSWatcher = ({ lat, lon, onDistanceUpdate }) => {
  const [issPos, setIssPos] = useState({ lat: 0, lon: 0 });
  const [distance, setDistance] = useState(null);
  const [cityName, setCityName] = useState("Local Station");

  useEffect(() => {
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

    const fetchISS = async () => {
      try {
        const res = await fetch("http://api.open-notify.org/iss-now.json");
        const data = await res.json();
        const { latitude, longitude } = data.iss_position;

        setIssPos({ lat: latitude, lon: longitude });

        // Haversine formula for distance
        const R = 3958.8; // Miles
        const dLat = (latitude - lat) * (Math.PI / 180);
        const dLon = (longitude - lon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) *
            Math.cos(latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const currentDistance = R * c;

        setDistance(currentDistance);

        // 2. Lift the distance state up to App.jsx
        if (onDistanceUpdate) {
          onDistanceUpdate(currentDistance);
        }
      } catch (e) {
        console.error("ISS Tracking Offline");
      }
    };

    fetchISS();
    const interval = setInterval(fetchISS, 5000);
    return () => clearInterval(interval);
  }, [lat, lon, onDistanceUpdate]);

  // Threshold corrected to 1000 miles (for testing)
  const isNearby = distance !== null && distance < 500;

  return (
    <div className={`iss-card-internal ${isNearby ? "nearby" : ""}`}>
      <h3
        style={{
          fontSize: "1.2rem",
          color: "var(--text-main)",
          margin: "20px 24px 24px 24px"
        }}
      >
        ISS TRACKER
      </h3>
        
      <div className="svg-container">
        <svg
          className="iss-favicon-small"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="10" y="8" width="4" height="8" rx="1" />
          <rect x="7" y="11" width="10" height="2" rx="0.5" />
          <rect x="2" y="5" width="4" height="14" rx="1" opacity="0.8" />
          <rect x="18" y="5" width="4" height="14" rx="1" opacity="0.8" />
          <rect x="6" y="11.5" width="12" height="1" />
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div
          className="ping-indicator"
          style={{
            backgroundColor: isNearby ? "#af0e0e" : "var(--accent-color)"
          }}
        ></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div
          className={isNearby ? "iss-radar-text" : ""}
          style={{
            fontSize: "2.2rem",
            fontWeight: "500",
            color: isNearby ? "transparent" : "var(--accent-color)",
            lineHeight: "2",
            marginBottom: "12px",
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
          from <i>{cityName}</i>
        </p>
      </div>

      <p
        style={{
          fontSize: "1.2rem",
          color: "var(--text-sub)",
          marginTop: "15px",
          opacity: 0.8,
          fontFamily: "Calibri",
        }}
      >
        LAT: {parseFloat(issPos.lat).toFixed(2)} |  LON:{" "}
        {parseFloat(issPos.lon).toFixed(2)}
      </p>

      <div>
        <iframe
          title="ISS Map"
          src="https://isstracker.pl/en/widget/map?disableInfoBox=1&lang=en"
        ></iframe>
      </div>

      {isNearby && (
        <div className="proximity-alert">LOW ORBIT PROXIMITY ALERT</div>
      )}
    </div>
  );
};

export default ISSWatcher;
