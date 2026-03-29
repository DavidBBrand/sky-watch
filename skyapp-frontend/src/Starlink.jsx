import React, { useState, useEffect, useCallback, memo } from "react";
import * as satellite from "satellite.js";
import { useLocation } from "./LocationContext";
import "./Starlink.css";

const Starlink = memo(() => {
  // FIX: Destructure 'location' (the key used in Context), then get lat/lon
  const { location } = useLocation();
  const { lat, lon } = location;

  const [nodes, setNodes] = useState([]);
  const [tles, setTles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAlert, setIsAlert] = useState(false);

  useEffect(() => {
    setLoading(true);
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    fetch(`${API_BASE_URL}/starlink-live?lat=${lat}&lon=${lon}`)
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
    // FIX: Added 'let' to avoid ReferenceError
    let closeContact = false;

    tles.forEach((sat) => {
      try {
        const satrec = satellite.json2satrec(sat);
        if (satrec && !satrec.error) {
          const pv = satellite.propagate(satrec, now);
          if (pv && pv.position) {
            const satEcf = satellite.eciToEcf(pv.position, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, satEcf);
            if (lookAngles.elevation > 0) {
              // FIX: Use .rangeSat instead of .range
              const slantRangeKm = lookAngles.rangeSat;

              if (slantRangeKm) {
                const slantRangeMiles = Math.round(slantRangeKm * 0.621371);

                // Proximity Alert logic
                if (slantRangeMiles < 400) closeContact = true;

        
                const r = (1 - lookAngles.elevation / (Math.PI / 2)) * 42;
                const theta = lookAngles.azimuth - Math.PI / 2;

                visiblePoints.push({
                  x: 50 + r * Math.cos(theta),
                  y: 50 + r * Math.sin(theta),
                  id: sat.OBJECT_ID || sat.NORAD_CAT_ID,
                  name: sat.OBJECT_NAME || "STARLINK",
                  distance: slantRangeMiles
                });
              }
            }
          }
        }
      } catch (e) {
        /* skip */
      }
    });

    setNodes(visiblePoints);
    setIsAlert(closeContact);
  }, [tles, lat, lon]);

  useEffect(() => {
    updateRadar();
    const timer = setInterval(updateRadar, 15000);
    return () => clearInterval(timer);
  }, [updateRadar]);

  return (
    <div className="starlink-card">
      <div className="card-title">Starlink Satellite Radar</div>
      <div className={`radar-container ${isAlert ? "alert" : ""}`}>
        <div className="radar-scanner"></div>
        <div className="radar-axis-h"></div>
        <div className="radar-axis-v"></div>
        <div className="radar-ring r1"></div>
        <div className="radar-ring r2"></div>
        <div className="radar-ring r3"></div>

        <span className="radar-direction dir-n">N</span>
        <span className="radar-direction dir-e">E</span>
        <span className="radar-direction dir-s">S</span>
        <span className="radar-direction dir-w">W</span>

        <span className="radar-label label-center">{location.name}</span>
        <span className="radar-label label-r1">400mi</span>
        <span className="radar-label label-r2">750mi</span>
        <span className="radar-label label-r3">1600mi</span>

        {nodes.map((n) => (
          <div
            key={n.id}
            className="radar-node"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <span className="node-tooltip">
              <strong className="tooltip-name">{n.name}</strong>
              <br />
              <span style={{color: "var(--accent-color3)"}}>{n.distance} mi</span>
            </span>
          </div>
        ))}
        {loading && <div className="radar-status glow-sub">Loading...</div>}
      </div>

      <div className="stats-row">
        <div className="stat-group">
          <p className="stat-caption">Active</p>
          <p className="stat-value glow-sub">{nodes.length}</p>
        </div>
        <div className="stat-group" style={{ textAlign: "right" }}>
          <p className="stat-caption">Observer </p>
          <p className="stat-value glow-sub">
            {parseFloat(lat).toFixed(1)}°N{" "} / 
            {Math.abs(parseFloat(lon)).toFixed(1)}°W
          </p>
        </div>
      </div>
    </div>
  );
});

export default Starlink;
