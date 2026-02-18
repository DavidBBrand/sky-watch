import React from "react";
import "./Planets.css";

const Planets = ({ skyData }) => {
  if (!skyData) return null;

  const { sun, planets } = skyData;

  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const planetIcons = {
    Mercury: "🌑",
    Venus: "🌕",
    Mars: "🔴",
    Jupiter: "🟠",
    Saturn: "🪐",
    Uranus: "💎",
    Neptune: "🔵"
  };
  const getPlanetSymbol = (name) => {
    const symbols = {
      Venus: "♀",
      Mars: "♂",
      Jupiter: "♃",
      Saturn: "♄",
      Mercury: "☿",
      Uranus: "♅",
      Neptune: "♆"
    };
    return symbols[name] || "•";
  };

  const getAltitudeDescription = (alt) => {
    const altitude = parseFloat(alt);
    if (altitude <= 0) return "Below Horizon";
    if (altitude < 10) return "Near Horizon";
    if (altitude < 30) return "Low in Sky";
    if (altitude < 60) return "Mid Sky";
    return "High Overhead";
  };

  const getCompassDirection = (az) => {
    const azimuth = parseFloat(az);
    // Divide 360 into 8 chunks of 45 degrees
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    // Offset by 22.5 to center the labels (e.g., North is 337.5 to 22.5)
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };

  return (
    
      <div >

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
        <h2
          className="card-title"
        >
          Visible Planets
        </h2>
            <div className="planet-grid">
              {Object.entries(planets).map(([name, info]) => (
                <div key={name} className="planet-item">
                  <div style={{ fontSize: "2.2rem", marginBottom: "5px" }}>
                    {planetIcons[name] || "✨"}
                  </div>

                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      color: "var(--text-main)"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.0rem",
                        fontFamily: "serif",
                        fontWeight: "400"
                      }}
                    >
                      {getPlanetSymbol(name)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "400",
                      marginBottom: "4px",
                      color: "var(--text-main)"
                    }}
                  >
                    {name}
                  </div>
                  <span
                    className={`status-tag ${
                      info.is_visible ? "status-visible" : "status-set"
                    }`}
                  >
                    {info.is_visible ? "Visible" : "Set"}
                  </span>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-sub)",
                      marginTop: "4px",
                      opacity: 0.8
                    }}
                  >
                    {getCompassDirection(info.azimuth)} at {info.azimuth}°
                    Azimuth
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-sub)",
                      opacity: 0.8
                    }}
                  >
                    {info.altitude}° Altitude
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default Planets;
