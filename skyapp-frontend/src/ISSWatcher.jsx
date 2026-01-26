import React, { useState, useEffect } from "react";
import "./ISSWatcher.css";
const ISSWatcher = ({ lat, lon }) => {
  const [issPos, setIssPos] = useState({ lat: 0, lon: 0 });
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    const fetchISS = async () => {
      try {
        const res = await fetch("http://api.open-notify.org/iss-now.json");
        const data = await res.json();
        const { latitude, longitude } = data.iss_position;

        setIssPos({ lat: latitude, lon: longitude });

        // Basic Distance Calculation (Haversine)
        const R = 3958.8; // Radius of Earth in miles
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
    const interval = setInterval(fetchISS, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [lat, lon]);

  const isNearby = distance < 500; // Within 500 miles is "Close"

  return (
    <div
      className="iss-card"
      style={{
        background: "rgba(10, 10, 15, 0.8)",
        padding: "20px",
        borderRadius: "15px",
        border: `1px solid ${isNearby ? "#4ade80" : "#333"}`,
        transition: "all 0.5s ease"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <p
          style={{
            letterSpacing: "2px",
            fontSize: "1.3rem",
            color: "var(--text-sub)",
          }}
        >
          ORBITAL TRACKER
        </p>
        <div
          className={isNearby ? "ping-indicator" : ""}
          style={{
            backgroundColor: isNearby ? "#4ade80" : "#555",
            width: "8px",
            height: "8px",
            borderRadius: "50%"
          }}
        ></div>
      </div>

      <h2
        className="iss-radar-text"
        style={{
          margin: "10px 0 5px 0",
          /* Optional: Make it spin faster if the ISS is close! */
          animationDuration: isNearby ? "1s" : "4s"
        }}
      >
            INT'L SPACE STATION
      </h2>

      <div
        className={isNearby ? "iss-radar-text" : ""}
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold"
        }}
      >
        {distance ? `${distance.toFixed(0)} mi` : "Scanning..."}
      </div>

      <p
        style={{
          fontSize: "1.5rem",
          color: "var(--text-sub)",
          marginTop: "5px"
        }}
      >
        LAT: {parseFloat(issPos.lat).toFixed(2)} | LON:{" "}
        {parseFloat(issPos.lon).toFixed(2)}
      </p>

      {isNearby && (
        <div
          style={{
            marginTop: "15px",
            fontSize: "0.7rem",
            color: "#4ade80",
            fontWeight: "bold",
            animation: "pulse 1s infinite"
          }}
        >
          LOW ORBIT PROXIMITY ALERT
        </div>
      )}
    </div>
  );
};

export default ISSWatcher;
