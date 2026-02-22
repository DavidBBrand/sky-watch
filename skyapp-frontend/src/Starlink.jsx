import React, { useState, useEffect, useCallback } from "react";
import * as satellite from "satellite.js";
import "./Starlink.css";

const Starlink = ({ lat, lon }) => {
  const [nodes, setNodes] = useState([]);
  const [tles, setTles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetching LIVE TLE Data
  useEffect(() => {
    setLoading(true);
    fetch(`http://127.0.0.1:8000/starlink-live?lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => {
        setTles(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch((e) => {
        console.error("🛰️ DATA LOAD ERROR:", e);
        setLoading(false);
      });
  }, [lat, lon]);

  // 2. Update Radar Positions
  const updateRadar = useCallback(() => {
    if (!tles.length || !lat || !lon) return;

    const now = new Date();
    const gmst = satellite.gstime(now);
    const observerGd = {
      latitude: satellite.degreesToRadians(parseFloat(lat)),
      longitude: satellite.degreesToRadians(parseFloat(lon)),
      height: 0.122
    };

    const visiblePoints = [];

    tles.forEach((sat) => {
      try {
        const satrec = satellite.json2satrec(sat);
        if (satrec && !satrec.error) {
          const pv = satellite.propagate(satrec, now);
          if (pv && pv.position) {
            const satEcf = satellite.eciToEcf(pv.position, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, satEcf);

            if (lookAngles.elevation > 0) {
              const satAltitude = 550;
              const groundDistKm = (Math.PI / 2 - lookAngles.elevation) * (satAltitude / 2);
              const groundDistMiles = Math.round(groundDistKm * 0.621371);

              // 42% radius keeps the nodes safely inside for labels
              const r = (1 - lookAngles.elevation / (Math.PI / 2)) * 42;
              const theta = lookAngles.azimuth - Math.PI / 2;

              visiblePoints.push({
                x: 50 + r * Math.cos(theta),
                y: 50 + r * Math.sin(theta),
                id: sat.OBJECT_ID || sat.NORAD_CAT_ID,
                name: sat.OBJECT_NAME || "STARLINK",
                distance: groundDistMiles
              });
            }
          }
        }
      } catch (e) { /* skip */ }
    });

    setNodes(visiblePoints);
  }, [tles, lat, lon]);

  useEffect(() => {
    updateRadar();
    const timer = setInterval(updateRadar, 15000);
    return () => clearInterval(timer);
  }, [updateRadar]);

  return (
    <div className="starlink-card">
      <div className="card-title">STARLINK NEARBY</div>

      <div className="radar-container">
        {/* Layer 1: Background & Scanner */}
        <div className="radar-scanner"></div>
        <div className="radar-axis-h"></div>
        <div className="radar-axis-v"></div>
        <div className="radar-ring r1"></div>
        <div className="radar-ring r2"></div>
        <div className="radar-ring r3"></div>

        {/* Layer 2: Directions */}
        <span className="radar-direction dir-n">N</span>
        <span className="radar-direction dir-e">E</span>
        <span className="radar-direction dir-s">S</span>
        <span className="radar-direction dir-w">W</span>

        {/* Layer 3: Distance Markers */}
        <span className="radar-label label-center">0mi</span>
        <span className="radar-label label-r1">200mi</span>
        <span className="radar-label label-r2">500mi</span>
        <span className="radar-label label-r3">1600mi</span>

        {/* Layer 4: Satellites */}
        {nodes.map((n) => (
          <div
            key={n.id}
            className="radar-node"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <span className="node-tooltip">
              <strong>{n.name}</strong><br/>
              {n.distance} mi
            </span>
          </div>
        ))}
        
        {loading && <div className="radar-status">LINKING...</div>}
      </div>

      <div className="stats-row">
        <div className="stat-group">
          <p className="stat-caption">Active</p>
          <p className="stat-value">{nodes.length}</p>
        </div>
        <div className="stat-group" style={{ textAlign: "right" }}>
          <p className="stat-caption">Observer</p>
          <p className="stat-value">
            {parseFloat(lat).toFixed(1)}°N {Math.abs(parseFloat(lon)).toFixed(1)}°W
          </p>
        </div>
      </div>
    </div>
  );
};

export default Starlink;