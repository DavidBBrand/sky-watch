import React, { memo } from "react"; 
import "./Planets.css";

const Planets = memo(({ skyData }) => { 
  if (!skyData) return null;

  const { sun, planets } = skyData;

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

  const getCompassDirection = (az) => {
    const azimuth = parseFloat(az);
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h2 className="card-title">Planetary Telemetry</h2>
          <div className="planet-grid">
            {Object.entries(planets).map(([name, info]) => {
              // Logic declared here requires { } and 'return' below
              const isBelowHorizon = parseFloat(info.altitude) < 0;

              return (
                <div key={name} className="planet-item">
                  <div style={{ fontSize: "2.4rem", marginBottom: "2px" }}>
                    {planetIcons[name] || "✨"}
                  </div>

                  <div style={{ fontSize: "1rem", fontWeight: "400", color: "var(--text-main)" }}>
                    <span
                      className="glow-sub2"
                      style={{
                        fontSize: "1.8rem",
                        fontFamily: "serif",
                        fontWeight: "400"
                      }}
                    >
                      {getPlanetSymbol(name)}
                    </span>
                  </div>
                  
                  <div
                    className="glow-sub2"
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: "400",
                      color: "var(--text-main)",
                      fontFamily: "Arial, sans-serif",
                      marginBottom: "8px"
                    }}
                  >
                    {name}
                  </div>

                  <span className={`status-tag ${info.is_visible ? "status-visible" : "status-set"}`}>
                    {info.is_visible ? "Above Horizon" : "Below Horizon"}
                  </span>

                  <div 
                    className="glow-sub2"
                    style={{
                      fontSize: "1.3rem",
                      color: "var(--text-sub)",
                      marginTop: "8px",
                    }}
                  >
                    {getCompassDirection(info.azimuth)} at {info.azimuth}° Az
                  </div>
                  
                  <div
                    // className="glow-sub2"
                    style={{
                      fontSize: "1.3rem",
                      color:  isBelowHorizon ? "#a34631" :"#4a95ae",
                      fontWeight: "800",
                    }}
                  >
                    {info.altitude}° Alt
                  </div>
                  <div>
                  <span className="distance">Distance: </span>
                  <span className="glow-sub2 distance-derple">
                    {info.distance_au} AU
                  </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Planets;
