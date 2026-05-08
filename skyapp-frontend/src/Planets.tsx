import React, { memo } from "react"; 
import "./Planets.css";

// 1. Define telemetry shape for individual planets
interface PlanetTelemetry {
  altitude: string | number;
  azimuth: string | number;
  distance_au: string | number;
  is_visible: boolean;
}

// 2. Define the global SkyData interface
interface SkyData {
  sun: {
    phase: string;
    [key: string]: any; // Flex for additional sun telemetry
  };
  planets: {
    [key: string]: PlanetTelemetry;
  };
}

interface PlanetsProps {
  skyData: SkyData;
}

const Planets: React.FC<PlanetsProps> = memo(({ skyData }) => { 
  if (!skyData) return null;

  const { planets } = skyData;

  const planetIcons: Record<string, string> = {
    Mercury: "🌑",
    Venus: "🌕",
    Mars: "🔴",
    Jupiter: "🟠",
    Saturn: "🪐",
    Uranus: "💎",
    Neptune: "🔵"
  };

  const getPlanetSymbol = (name: string): string => {
    const symbols: Record<string, string> = {
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

  const getCompassDirection = (az: string | number): string => {
    const azimuth = typeof az === 'string' ? parseFloat(az) : az;
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <div className="card-title">Planets</div>
          
          <div className="planet-grid">
            {Object.entries(planets).map(([name, info]) => {
              const alt = typeof info.altitude === 'string' ? parseFloat(info.altitude) : info.altitude;
              const isBelowHorizon = alt < 0;

              return (
                <div key={name} className="planet-item">
                  <div style={{ fontSize: "2.4rem", marginBottom: "2px" }}>
                    {planetIcons[name] || "✨"}
                  </div>

                  <div style={{ fontSize: "1rem", fontWeight: "400", color: "var(--text-main)" }}>
                    <span
                      className="glow-sub"
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
                      fontSize: "1.8rem",
                      fontWeight: "600",
                      color: "var(--text-main)",
                      fontFamily: "Share Tech, sans-serif",
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
                      fontSize: "1.2rem",
                      fontFamily: "Roboto Condensed",
                      color: "var(--text-sub)",
                      marginTop: "8px",
                      letterSpacing: "-1.5px"
                    }}
                  >
                    {getCompassDirection(info.azimuth)} at {info.azimuth}° Az
                  </div>
                  
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontFamily: "Roboto Condensed",
                      color: isBelowHorizon ? "#a34631" : "#4a95ae",
                      fontWeight: "600",
                      letterSpacing: "-1px"
                    }}
                  >
                    {info.altitude}° Alt
                  </div>
                  <div className="derp">
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
