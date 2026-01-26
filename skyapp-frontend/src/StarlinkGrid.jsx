import React, { useState, useEffect } from "react";
import "./StarlinkGrid.css";

const StarlinkGrid = () => {
  const [satCount, setSatCount] = useState(42); 
  const [health, setHealth] = useState(98.4);

  useEffect(() => {
    const interval = setInterval(() => {
      setSatCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setHealth(prev => parseFloat((98 + Math.random()).toFixed(1)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="starlink-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="orbital-label">MESH NETWORK</p>
        <div className="ping-indicator" style={{ backgroundColor: "#00ff9d" }}></div>
      </div>

      <h2 className="radar-text" style={{ margin: "15px 0 5px 0", fontSize: "1.4rem" }}>
        STARLINK SECTOR
      </h2>

      <div className="sat-visual-grid">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="grid-node" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>

      <div className="stats-row">
        <div className="stat-group">
          <p className="stat-caption">ACTIVE NODES</p>
          <p className="stat-value">{satCount}</p>
        </div>
        <div className="stat-group">
          <p className="stat-caption">LINK HEALTH</p>
          <p className="stat-value">{health}%</p>
        </div>
      </div>
      
      <p className="sector-tag">TRANSIT SECTOR: 7G-ALPHA</p>
    </div>
  );
};

export default StarlinkGrid;