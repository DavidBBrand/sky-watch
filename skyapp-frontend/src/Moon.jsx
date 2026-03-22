import React, { useState, useEffect, useRef, memo } from "react";
import { useLocation } from "./LocationContext.jsx"; // 1. Use Context
import "./Moon.css";

//  Wrap in memo to prevent unmounting when App theme changes
const Moon = memo(({ date }) => {
  //  Destructure location from global state
  const { location } = useLocation();
  const { lat, lon } = location;

  const [moonData, setMoonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState(null);
  const prevAlt = useRef(null);

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    const fetchMoonData = () => {
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

      fetch(`${API_BASE_URL}/moon-details?lat=${lat}&lon=${lon}`)
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
    const interval = setInterval(fetchMoonData, 120000);
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
      <div className="lunar-visual-wrapper">
        <div className="moon-svg-frame">
          <svg viewBox="0 0 100 100" className="moon-svg">
            <defs>
              <mask id="moonMask">
                <rect x="0" y="0" width="100" height="100" fill="black" />
                <rect x="50" y="0" width="50" height="100" fill="white" />
                <ellipse
                  cx="50"
                  cy="50"
                  rx={rx}
                  ry="50"
                  fill={isGibbous ? "white" : "black"}
                />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1a1a1a" />
            <circle cx="50" cy="50" r="48" fill="rgba(254, 252, 215, 0.05)" />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#fefcd7"
              mask="url(#moonMask)"
              className="moon-path-transition"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="glow-sub2 perc" style={{ fontSize: "3rem", marginTop: "6px", marginBottom: "6px"}}>
            {percentage?.toFixed(1)}%
          </h2>
          <p className="glow-sub2" style={{ fontSize: "1.5rem"}}>Illumination</p>
        </div>
      </div>
    );
  };

  return (
    <div className="moon-container">
      <div className="moon-container">
        <div className="moon-header-block">
          <div className="glow-sub date-display">The Moon from</div>
          <div className="glow-sub location-name">{location.name}</div>
          <div className="glow-sub2 date-display">{date}</div>
        </div>
        {/* ... rest of the code */}
      </div>

      {loading ? (
        <div className="moon-loading-box">
          <p className="loading-text">UPDATING...</p>
        </div>
      ) : moonData ? (
        <>
          <LunarVisual percentage={moonData.illumination} />

          <div className="moon-stats-grid">
            <div className="text-left">
              <div className="stat-label">
                Altitude{" "}
                {trend === "rising" ? "↑" : trend === "setting" ? "↓" : ""}
              </div>
              <div style={{ fontSize: "1.7rem" }} className={`glow-sub`}>
                {moonData.altitude?.toFixed(1)}°
              </div>
            </div>
            <div className="text-right">
              <div className="stat-label">Azimuth</div>
              <div style={{ fontSize: "1.7rem" }} className="glow-sub">
                {moonData.azimuth?.toFixed(1)}°
                <span style={{ fontSize: "1.7rem" }} className="glow-sub">
                  ({getCompassDirection(moonData.azimuth)})
                </span>
              </div>
            </div>
          </div>

          <div className="moon-details">
            {moonData.milestones?.map((m, i) => (
              <div key={i} className="milestone-item">
                <span className="milestone-phase">{m.phase}</span>
                <span className="milestone-date glow-sub ">{m.date}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="signal-lost">SIGNAL LOST</p>
      )}
    </div>
  );
});

export default Moon;
