import React from "react";
import "./SkyDetails.css";

const SkyDetails = ({ skyData }) => {
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
    Mercury: "☿️", // Or "🌑"
    Venus: "♀️", // Or "🌕"
    Mars: "🔴",
    Jupiter: "🟠",
    Saturn: "🪐",
    Uranus: "💎",
    Neptune: "🔵"
  };

  return (
    <div className="sky-details-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px"
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--text-sub)",
              margin: 0
            }}
          >
            Celestial Observations
          </p>
          <h2
            style={{
              fontSize: "1.2rem",
              margin: "5px 0 0 0",
              fontWeight: "600",
              color: "var(--text-main)"
            }}
          >
            Franklin, TN
          </h2>
        </div>
        <span
          style={{
            fontSize: "0.6rem",
            background: "var(--card-border)",
            color: "var(--text-main)",
            padding: "4px 8px",
            borderRadius: "10px"
          }}
        >
          35.92° N
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Solar Section */}
        <div>
          <h3
            style={{
              color: "#3b82f6",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "10px"
            }}
          >
            Solar Cycle
          </h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <div className="planet-item" style={{ flex: 1 }}>
              <span style={{ fontSize: "4.2rem" }}>🌅</span>
              <p
                style={{
                  fontSize: "0.8rem",
                  margin: "5px 0 0 0",
                  fontWeight: "500",
                  color: "var(--text-main)"
                }}
              >
                {formatTime(sun.sunrise)}
              </p>
              <p
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-sub)",
                  margin: 0
                }}
              >
                SUNRISE
              </p>
            </div>
            <div className="planet-item" style={{ flex: 1 }}>
              <span style={{ fontSize: "4.2rem" }}>🌇</span>
              <p
                style={{
                  fontSize: "0.8rem",
                  margin: "5px 0 0 0",
                  fontWeight: "500",
                  color: "var(--text-main)"
                }}
              >
                {formatTime(sun.sunset)}
              </p>
              <p
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-sub)",
                  margin: 0
                }}
              >
                SUNSET
              </p>
            </div>
          </div>
        </div>

        {/* Planets Section */}
        <div>
          <h3
            style={{
              color: "#a855f7",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "5px"
            }}
          >
            Planets
          </h3>
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
                  
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
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
                    fontSize: "0.65rem",
                    color: "var(--text-sub)",
                    marginTop: "4px"
                  }}
                >
                  {info.altitude}°
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkyDetails;
