import React, { useState, useEffect } from "react";
import * as satellite from "satellite.js";
import "./StarlinkGrid.css";

const StarlinkGrid = ({ lat, lon }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalInOrbit, setTotalInOrbit] = useState(0);
  const [health, setHealth] = useState(99.4);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState("Scanning Location...");

  // 1. Reverse Geocoding
  useEffect(() => {
    const getLocalName = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "Ground Station";
        setCityName(`${city}${data.address.state ? ", " + data.address.state : ""}`);
      } catch (e) {
        setCityName("Orbital Uplink Active");
      }
    };
    if (lat && lon) getLocalName();
  }, [lat, lon]);

  // 2. Orbital Calculation
  useEffect(() => {
    console.log("📡 Starlink Logic Initialized. Props:", { lat, lon });
    
    let tles = [];

    const calculateVisible = (currentTles = tles) => {
      if (!currentTles.length) {
        console.warn("⚠️ No TLE data available for calculation.");
        return;
      }
      if (lat === undefined || lon === undefined) {
        console.warn("⚠️ Lat/Lon undefined. Calculation paused.");
        return;
      }

      let count = 0;
      const now = new Date();
      const nLat = parseFloat(lat);
      const nLon = parseFloat(lon);
      const adjLon = (nLon > 0 && nLon > 60) ? -nLon : nLon;

      const observerGd = {
        longitude: satellite.degreesToRadians(adjLon),
        latitude: satellite.degreesToRadians(nLat),
        height: 0.122
      };

      const gmst = satellite.gstime(now);

      currentTles.forEach((sat) => {
        try {
          const l1 = (sat.TLE_LINE1 || sat.tle_line1)?.trim();
          const l2 = (sat.TLE_LINE2 || sat.tle_line2)?.trim();

          if (!l1 || !l2) return;

          const satrec = satellite.twoline2satrec(l1, l2);
          const posVel = satellite.propagate(satrec, now);
          
          if (posVel.position) {
            const posEcf = satellite.eciToEcf(posVel.position, gmst);
            const look = satellite.ecfToLookAngles(posEcf, observerGd);
            if (look.elevation > 0) count++;
          }
        } catch (e) {}
      });

      console.log(`✅ Calculation Finished: ${count} satellites visible.`);
      setVisibleCount(count);
      setHealth(parseFloat((98.5 + Math.random() * 1.2).toFixed(1)));
    };

    const fetchData = async () => {
      console.log("🌐 Fetching Starlink TLEs from CelesTrak...");
      try {
        const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json");
        const data = await res.json();
        const satelliteArray = Array.isArray(data) ? data : [data];
        
        console.log(`📥 Data Received. Constellation size: ${satelliteArray.length}`);
        tles = satelliteArray;
        setTotalInOrbit(satelliteArray.length);
        setLoading(false);
        calculateVisible(satelliteArray);
      } catch (e) {
        console.error("❌ Fetch error:", e);
      }
    };

    fetchData();
    const interval = setInterval(() => calculateVisible(), 15000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  return (
    <div className="glass-card starlink-card">
      <div className="card-header">
        <svg className="iss-favicon" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 3L12 5M12 19L12 21M3 12L5 12M19 12L21 12M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="orbital-label">STARLINK MESH NETWORK</p>
      </div>

      <h2 style={{ margin: "15px 0 5px 0", fontSize: "1.4rem", letterSpacing: "1px" }}>
        LOCAL_NODES <span style={{ opacity: 0.5 }}>//</span> OVERHEAD
      </h2>

      <div className="sat-visual-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid-node" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>

      <div className="stats-row">
        <div className="stat-group">
          <p className="stat-caption">VISIBLE NODES</p>
          <p className="stat-value" style={{ color: visibleCount > 0 ? "#00f2ff" : "#ff4d4d" }}>
            {loading ? "SCANNING" : visibleCount}
          </p>
        </div>
        <div className="stat-group">
          <p className="stat-caption">CONSTELLATION</p>
          <p className="stat-value">{totalInOrbit}</p>
        </div>
      </div>
      
      <div className="sector-tag-container" style={{ marginTop: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" }}>
        <p className="sector-tag" style={{ margin: 0, fontSize: "1.1rem" }}>
          {loading ? "INITIALIZING..." : `COORD: ${parseFloat(lat).toFixed(2)}N / ${Math.abs(parseFloat(lon)).toFixed(2)}W`}
        </p>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginTop: "4px" }}>
          REGION: {cityName}
        </p>
      </div>
    </div>
  );
};

export default StarlinkGrid;