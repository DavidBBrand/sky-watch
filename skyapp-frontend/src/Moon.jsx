import React, { useState, useEffect, useRef } from "react";
import "./Moon.css";

const Moon = ({ lat, lon, date }) => {
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
    return () => { isMounted = false; clearInterval(interval); };
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
                <ellipse cx="50" cy="50" rx={rx} ry="50" fill={isGibbous ? "white" : "black"} />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1a1a1a" />
            <circle cx="50" cy="50" r="48" fill="rgba(254, 252, 215, 0.05)" />
            <circle cx="50" cy="50" r="48" fill="#fefcd7" mask="url(#moonMask)" className="moon-path-transition" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="illumination-value glow-sub2">{percentage?.toFixed(1)}%</h2>
          <p className="illumination-label glow-sub">Illumination</p>
        </div>
      </div>
    );
  };

  return (
    <div className="moon-container">
      <h2 className="card-title">LUNAR OBSERVATION for {date}</h2>

      {loading ? (
        <div className="moon-loading-box">
          <p className="loading-text">UPDATING TELEMETRY...</p>
        </div>
      ) : moonData ? (
        <>
          <LunarVisual percentage={moonData.illumination} />

          <div className="moon-stats-grid">
            <div className="text-left">
              <p className="stat-label">
                Altitude {trend === "rising" ? "↑" : trend === "setting" ? "↓" : ""}
              </p>
              <p className={`stat-value ${moonData.altitude > 0 ? 'alt-above' : 'alt-below'}`}>
                {moonData.altitude?.toFixed(1)}°
              </p>
            </div>
            <div className="text-right">
              <p className="stat-label">Azimuth</p>
              <p className="stat-value glow-sub2" style={{ color: "var(--text-main)" }}>
                {moonData.azimuth?.toFixed(1)}°
                <span className="azimuth-unit">({getCompassDirection(moonData.azimuth)})</span>
              </p>
            </div>
          </div>

          <div className="moon-details">
            {moonData.milestones?.map((m, i) => (
              <div key={i} className="milestone-item">
                <span className="milestone-phase">{m.phase}</span>
                <span className="milestone-date">{m.date}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="signal-lost">SIGNAL LOST</p>
      )}
    </div>
  );
};

export default Moon;
