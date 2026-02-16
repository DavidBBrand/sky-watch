import React, { useState, useEffect, useRef } from "react";
import "./MoonTracker.css";

const MoonGraphic3 = ({ lat, lon, date }) => {
  const [moonData, setMoonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState(null);
  const prevAlt = useRef(null);

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    const fetchMoonData = () => {
      fetch(`http://127.0.0.1:8000/moon-details?lat=${lat}&lon=${lon}`)
        .then((response) => response.json())
        .then((data) => {
          if (isMounted) {
            if (prevAlt.current !== null) {
              setTrend(data.altitude > prevAlt.current ? "rising" : "setting");
            }
            prevAlt.current = data.altitude;
            setMoonData(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error("Error fetching moon data:", err);
            setLoading(false);
          }
        });
    };

    fetchMoonData();
    const interval = setInterval(fetchMoonData, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lat, lon]);

  const getCompassDirection = (az) => {
    if (az === undefined) return "--";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(az / 45) % 8;
    return directions[index];
  };

  const LunarVisual = ({ percentage }) => {
    const isGibbous = percentage > 50;
    const rx = Math.abs(50 - percentage) * (50 / 50);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", width: "100%", marginTop: "10px" }}>
        <div style={{ width: "140px", height: "140px", position: "relative" }}>
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-15deg)" }}>
            <defs>
              <mask id="moonMask">
                <rect x="0" y="0" width="100" height="100" fill="black" />
                <rect x="50" y="0" width="50" height="100" fill="white" />
                <ellipse cx="50" cy="50" rx={rx} ry="50" fill={isGibbous ? "white" : "black"} />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1a1a1a" />
            <circle cx="50" cy="50" r="48" fill="rgba(254, 252, 215, 0.05)" />
            <circle cx="50" cy="50" r="48" fill="#fefcd7" mask="url(#moonMask)" style={{ transition: "all 0.5s ease-in-out" }} />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-main)" }}>{percentage?.toFixed(1)}%</h2>
          <p style={{ color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "2.5px", fontSize: "1rem", margin: 0 }}>Illumination</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-main)", marginBottom: "30px", textAlign: "center", fontWeight: "500" }}>
        LUNAR OBSERVATION for {date}
      </h2>

      {loading ? (
        <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-main)", fontSize: "0.8rem", opacity: 0.6 }}>UPDATING TELEMETRY...</p>
        </div>
      ) : moonData ? (
        <>
          <LunarVisual percentage={moonData.illumination} />

          {/* Current Position Stats */}
          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "15px 5px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "var(--text-sub)", fontSize: "0.6rem", margin: 0, textTransform: "uppercase" }}>
                Altitude {trend === "rising" ? "↑" : trend === "setting" ? "↓" : ""}
              </p>
              <p style={{ color: moonData.altitude > 0 ? "#17ae4e" : "var(--accent-color2)", fontFamily: "monospace", margin: 0, fontSize: "1.2rem", fontWeight: "bold" }}>
                {moonData.altitude?.toFixed(1)}°
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "var(--text-sub)", fontSize: "0.6rem", margin: 0, textTransform: "uppercase" }}>Azimuth</p>
              <p style={{ color: "var(--text-main)", fontFamily: "monospace", margin: 0, fontSize: "1.2rem" }}>
                {moonData.azimuth?.toFixed(1)}°
                <span style={{ color: "var(--accent-color)", marginLeft: "5px", fontSize: "0.9rem" }}>({getCompassDirection(moonData.azimuth)})</span>
              </p>
            </div>
          </div>

          {/* NEW: Lunar Milestones Section */}
          <div style={{ 
            marginTop: "10px", 
            padding: "15px", 
            background: "rgba(255, 255, 255, 0.03)", 
            borderRadius: "8px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {moonData.milestones?.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "var(--accent-color2)", fontSize: "1.0rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {m.phase}
                </span>
                <span style={{ color: "var(--text-main)", fontSize: "1rem", fontWeight: "600", fontFamily: "monospace" }}>
                  {m.date}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: "var(--accent-color2)", fontSize: "0.8rem", textAlign: "center" }}>SIGNAL LOST</p>
      )}
    </div>
  );
};

export default MoonGraphic3;
