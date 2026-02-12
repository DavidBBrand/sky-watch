import React from "react";
import "./SkyDetails.css";

const SolarCycle = ({ sun }) => {
  // Guard clause in case data hasn't loaded yet
  if (!sun) return null;

  // Helper to format the ISO string from Skyfield/Python
  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="solar-cycle-container">
      <h4
        style={{
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--accent-color4)",         
        }}
      >
        Solar Cycle
      </h4>     
      <div style={{ display: "flex", gap: "36px" }}>
        {/* Sunrise Section */}
        <div className="planet-item" style={{ flex: 1 }}>
          <span style={{ fontSize: "5.0rem" }}>🌅</span>
          <p
            style={{
              fontSize: "1rem",
              margin: "12px 0 0 0",
              fontWeight: "500",
              color: "var(--text-main)"
            }}
          >
            {formatTime(sun.sunrise)}
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-sub)",
              margin: 0
            }}
          >
            SUNRISE
          </p>
        </div>

        {/* Sunset Section */}
        <div className="planet-item" style={{ flex: 1 }}>
          <span style={{ fontSize: "5.0rem" }}>🌇</span>
          <p
            style={{
              fontSize: "1rem",
              margin: "12px 0 0 0",
              fontWeight: "500",
              color: "var(--text-main)"
            }}
          >
            {formatTime(sun.sunset)}
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-sub)",
              margin: 0
            }}
          >
            SUNSET
          </p>
        </div>
      </div>
    </div>

  );
};

export default SolarCycle;