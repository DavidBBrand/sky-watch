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
  sun?: {
    phase?: string | number;
    [key: string]: any;
  };
  planets?: {
    [key: string]: PlanetTelemetry;
  };
}

interface PlanetsProps {
  skyData: SkyData;
}

const Planets: React.FC<PlanetsProps> = memo(({ skyData }) => {
  if (!skyData) return null;

  const { planets } = skyData;
  if (!planets) return null;

  const planetIcons: Record<string, React.ReactNode> = {
    Mercury: "🌑",
    Venus: (
      <svg viewBox="0 0 100 100" style={{ width: "3.8rem", height: "3.8rem" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="venus-g" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#fffde8" />
            <stop offset="30%" stopColor="#f5e098" />
            <stop offset="65%" stopColor="#d4a832" />
            <stop offset="100%" stopColor="#8a6015" />
          </radialGradient>
          <filter id="venus-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="50" cy="50" r="43" fill="url(#venus-g)" filter="url(#venus-glow)" />
        <ellipse cx="50" cy="36" rx="40" ry="5" fill="rgba(255,255,255,0.12)" />
        <ellipse cx="50" cy="52" rx="38" ry="4" fill="rgba(255,255,255,0.08)" />
        <ellipse cx="50" cy="67" rx="32" ry="3.5" fill="rgba(255,255,255,0.09)" />
      </svg>
    ),
    Mars: (
      <svg viewBox="0 0 100 100" style={{ width: "3.8rem", height: "3.8rem" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="mars-g" cx="36%" cy="30%" r="68%">
            <stop offset="0%"   stopColor="#e07248" />
            <stop offset="30%"  stopColor="#c1440e" />
            <stop offset="70%"  stopColor="#8a2a06" />
            <stop offset="100%" stopColor="#541602" />
          </radialGradient>
          <filter id="mars-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="mars-clip">
            <circle cx="50" cy="50" r="43" />
          </clipPath>
        </defs>
        <g filter="url(#mars-glow)">
          <circle cx="50" cy="50" r="43" fill="url(#mars-g)" />
          <g clipPath="url(#mars-clip)">
            <ellipse cx="34" cy="38" rx="15" ry="11" fill="rgba(36,7,1,0.42)" />
            <ellipse cx="65" cy="56" rx="13" ry="9"  fill="rgba(33,6,1,0.38)" />
            <ellipse cx="60" cy="72" rx="11" ry="8"  fill="rgba(28,5,1,0.35)" />
            <ellipse cx="50" cy="44" rx="13" ry="9"  fill="rgba(220,115,58,0.13)" />
            <ellipse cx="28" cy="50" rx="9"  ry="7"  fill="rgba(215,110,55,0.10)" />
            <ellipse cx="50" cy="10"   rx="15" ry="5.8" fill="rgba(245,250,255,0.84)" />
            <ellipse cx="50" cy="10"   rx="11" ry="4"   fill="rgba(210,230,250,0.72)" />
            <ellipse cx="48" cy="11.5" rx="7"  ry="2.6" fill="rgba(175,210,242,0.48)" />
          </g>
        </g>
      </svg>
    ),
    Jupiter: (
      <svg viewBox="0 0 100 100" style={{ width: "3.8rem", height: "3.8rem" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="jup-sphere" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,240,210,0.45)" />
            <stop offset="100%" stopColor="rgba(50,20,0,0.65)" />
          </radialGradient>
          <filter id="jup-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="jup-clip">
            <circle cx="50" cy="50" r="43" />
          </clipPath>
        </defs>
        <g filter="url(#jup-glow)">
          <g clipPath="url(#jup-clip)">
            <rect x="0" y="0" width="100" height="100" fill="#d4a860" />
            <rect x="0" y="7" width="100" height="10" fill="#e0c080" opacity="0.65" />
            <rect x="0" y="19" width="100" height="8" fill="#6b3e1e" opacity="0.85" />
            <rect x="0" y="27" width="100" height="7" fill="#f0d090" opacity="0.75" />
            <rect x="0" y="34" width="100" height="12" fill="#7a4825" opacity="0.9" />
            <rect x="0" y="46" width="100" height="10" fill="#f5e0a0" opacity="0.8" />
            <rect x="0" y="56" width="100" height="12" fill="#7a4825" opacity="0.9" />
            <rect x="0" y="68" width="100" height="7" fill="#e8c880" opacity="0.65" />
            <rect x="0" y="75" width="100" height="7" fill="#6b3a1a" opacity="0.8" />
            <rect x="0" y="82" width="100" height="11" fill="#c8a060" opacity="0.55" />
            <circle cx="50" cy="50" r="43" fill="url(#jup-sphere)" />
            <ellipse cx="65" cy="62" rx="12" ry="6.5" fill="#c03820" opacity="0.88" />
            <ellipse cx="65" cy="62" rx="8" ry="4" fill="#d84830" opacity="0.55" />
          </g>
        </g>
      </svg>
    ),
    Saturn: (
      <svg viewBox="0 0 160 100" style={{ width: "6rem", height: "3.75rem" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="saturn-g" cx="38%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#fdf6dc" />
            <stop offset="15%"  stopColor="#f5e4a8" />
            <stop offset="40%"  stopColor="#e8c870" />
            <stop offset="68%"  stopColor="#c49a38" />
            <stop offset="88%"  stopColor="#9a7020" />
            <stop offset="100%" stopColor="#6a4c10" />
          </radialGradient>
          <radialGradient id="saturn-limb" cx="80" cy="46" r="34" gradientUnits="userSpaceOnUse">
            <stop offset="65%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
          <filter id="saturn-glow" x="-20%" y="-25%" width="140%" height="150%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="saturn-sphere-clip">
            <circle cx="80" cy="46" r="34" />
          </clipPath>
          <clipPath id="saturn-front-ring-clip">
            <rect x="0" y="39.5" width="160" height="60.5" />
          </clipPath>
        </defs>
        <g filter="url(#saturn-glow)">
          {/* Back rings */}
          <ellipse cx="80" cy="54" rx="46.4" ry="9.77"  fill="none" stroke="rgba(180,162,118,0.26)" strokeWidth="9.7" />
          <ellipse cx="80" cy="54" rx="58.3" ry="12.27" fill="none" stroke="rgba(242,225,165,0.84)" strokeWidth="14.1" />
          <ellipse cx="80" cy="54" rx="52"   ry="10.95" fill="none" stroke="rgba(255,245,195,0.32)" strokeWidth="2" />
          <ellipse cx="80" cy="54" rx="66.5" ry="14.0"  fill="none" stroke="rgba(4,2,0,0.92)"        strokeWidth="2.3" />
          <ellipse cx="80" cy="54" rx="71.9" ry="15.13" fill="none" stroke="rgba(218,196,136,0.68)" strokeWidth="8.4" />
          {/* Planet */}
          <circle cx="80" cy="46" r="34" fill="url(#saturn-g)" />
          <g clipPath="url(#saturn-sphere-clip)">
            <ellipse cx="80" cy="58" rx="34"  ry="5.5" fill="rgba(0,0,0,0.24)" />
            <ellipse cx="80" cy="30" rx="32"  ry="3"   fill="rgba(255,238,165,0.15)" />
            <ellipse cx="80" cy="38" rx="33"  ry="2.5" fill="rgba(185,145,55,0.2)" />
            <ellipse cx="80" cy="46" rx="33"  ry="3"   fill="rgba(228,185,85,0.13)" />
            <ellipse cx="80" cy="53" rx="32"  ry="2.2" fill="rgba(160,120,34,0.18)" />
            <circle  cx="80" cy="46" r="34"            fill="url(#saturn-limb)" />
          </g>
          {/* Front rings */}
          <ellipse cx="80" cy="54" rx="46.4" ry="9.77"  fill="none" stroke="rgba(180,162,118,0.28)" strokeWidth="9.7"  clipPath="url(#saturn-front-ring-clip)" />
          <ellipse cx="80" cy="54" rx="58.3" ry="12.27" fill="none" stroke="rgba(248,230,170,0.90)" strokeWidth="14.1" clipPath="url(#saturn-front-ring-clip)" />
          <ellipse cx="80" cy="54" rx="52"   ry="10.95" fill="none" stroke="rgba(255,245,195,0.35)" strokeWidth="2"    clipPath="url(#saturn-front-ring-clip)" />
          <ellipse cx="80" cy="54" rx="66.5" ry="14.0"  fill="none" stroke="rgba(4,2,0,0.92)"       strokeWidth="2.3"  clipPath="url(#saturn-front-ring-clip)" />
          <ellipse cx="80" cy="54" rx="71.9" ry="15.13" fill="none" stroke="rgba(220,198,138,0.72)" strokeWidth="8.4"  clipPath="url(#saturn-front-ring-clip)" />
        </g>
      </svg>
    ),
    Uranus: (
      <svg viewBox="0 0 100 100" style={{ width: "3.8rem", height: "3.8rem" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="uranus-g" cx="36%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#d8f8f8" />
            <stop offset="30%" stopColor="#82e0e8" />
            <stop offset="70%" stopColor="#3ab0ba" />
            <stop offset="100%" stopColor="#1a6870" />
          </radialGradient>
          <filter id="uranus-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="uranus-clip">
            <circle cx="50" cy="50" r="43" />
          </clipPath>
        </defs>
        <g filter="url(#uranus-glow)">
          <ellipse cx="50" cy="50" rx="49" ry="7" fill="none" stroke="rgba(180,240,240,0.45)" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="43" fill="url(#uranus-g)" />
          <g clipPath="url(#uranus-clip)">
            <ellipse cx="50" cy="33" rx="40" ry="4" fill="rgba(255,255,255,0.1)" />
            <ellipse cx="50" cy="50" rx="39" ry="3.5" fill="rgba(255,255,255,0.07)" />
            <ellipse cx="50" cy="66" rx="36" ry="3" fill="rgba(255,255,255,0.06)" />
          </g>
        </g>
      </svg>
    ),
    Neptune: (
      <svg viewBox="0 0 100 100" style={{ width: "3.8rem", height: "3.8rem" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="nept-g" cx="36%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#80c8f8" />
            <stop offset="30%" stopColor="#1878d8" />
            <stop offset="70%" stopColor="#0848a0" />
            <stop offset="100%" stopColor="#042060" />
          </radialGradient>
          <filter id="nept-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="nept-clip">
            <circle cx="50" cy="50" r="43" />
          </clipPath>
        </defs>
        <g filter="url(#nept-glow)">
          <circle cx="50" cy="50" r="43" fill="url(#nept-g)" />
          <g clipPath="url(#nept-clip)">
            <ellipse cx="50" cy="30" rx="40" ry="5" fill="rgba(100,180,255,0.18)" />
            <ellipse cx="50" cy="48" rx="39" ry="4" fill="rgba(100,180,255,0.13)" />
            <ellipse cx="50" cy="64" rx="37" ry="3.5" fill="rgba(0,0,80,0.18)" />
            <ellipse cx="38" cy="46" rx="11" ry="7" fill="rgba(0,0,60,0.52)" />
            <ellipse cx="38" cy="46" rx="7" ry="4.5" fill="rgba(0,0,40,0.38)" />
            <ellipse cx="56" cy="34" rx="8" ry="2.5" fill="rgba(255,255,255,0.22)" />
            <ellipse cx="63" cy="56" rx="6" ry="2" fill="rgba(255,255,255,0.18)" />
          </g>
        </g>
      </svg>
    )
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
                  <div style={{ fontSize: "3.8rem", lineHeight: 1, display: "flex", justifyContent: "center", marginBottom: "-2px" }}>
                    {planetIcons[name] || "✨"}
                  </div>

                  <div style={{ lineHeight: 1, margin: 0, padding: 0 }}>
                    <span
                      className="glow-sub"
                      style={{
                        fontSize: "2rem",
                        fontFamily: "serif",
                        fontWeight: "400",
                        display: "block",
                        lineHeight: 1,
                      }}
                    >
                      {getPlanetSymbol(name)}
                    </span>
                  </div>

                  <div
                    className="glow-sub2"
                    style={{
                      fontSize: "2.2rem",
                      fontWeight: "600",
                      color: "var(--text-main)",
                      fontFamily: "Share Tech, sans-serif",
                      lineHeight: 1,
                      marginBottom: "0px",
                      marginTop: "2px",
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
                      fontSize: "1.4rem",
                      fontFamily: "Roboto Condensed",
                      color: "var(--text-sub)",
                      marginTop: "0px",
                      letterSpacing: "-1px"
                    }}
                  >
                    {getCompassDirection(info.azimuth)} at {info.azimuth}° Az
                  </div>
                  
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontFamily: "Roboto Condensed",
                      color: isBelowHorizon ? "#a34631" : "#4a95ae",
                      fontWeight: "600",
                      letterSpacing: "-1px",
                      lineHeight: "1",
                      marginBottom: "-6px"
                      
                    }}
                  >
                    {info.altitude}° Alt
                  </div>
                  <div style={{ lineHeight: "1", marginBottom: "6px"}}>
                    <span className="distance">Distance: </span>
                    <span className="glow-sub2" style={{ fontSize: "1.3rem" }}>
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
