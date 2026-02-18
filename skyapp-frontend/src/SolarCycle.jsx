import React from "react";
import "./SolarCycle.css";

const SolarCycle = ({ sun }) => {
  if (!sun) return null;

  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="solar-cycle-container">
      <h4 className="glow-sub">Solar Cycle</h4> 
      
      <div className="solar-flex">
        {/* Sunrise Section */}
        <div className="planet-item" style={{ flex: 1 }}>
          <span style={{ fontSize: "4.0rem" }}>🌅</span>
          <p className="solar-time">{formatTime(sun.sunrise)}</p>
          <p className="solar-label glow-sub">SUNRISE</p>
        </div>

        {/* Sunset Section */}
        <div className="planet-item" style={{ flex: 1 }}>
          <span style={{ fontSize: "4.0rem" }}>🌇</span>
          <p className="solar-time">{formatTime(sun.sunset)}</p>
          <p className="solar-label glow-sub">SUNSET</p>
        </div>
      </div>
    </div>
  );
};

export default SolarCycle;