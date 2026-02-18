import React, { useState, useEffect, useCallback } from "react";
import * as satellite from "satellite.js";
import "./Starlink.css";

const Starlink = ({ lat, lon }) => {
  const [nodes, setNodes] = useState([]);
  const [tles, setTles] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetching OMM/JSON Data
  useEffect(() => {
    fetch("/starlink.json")
      .then((res) => res.json())
      .then((data) => {
        setTles(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch((e) => {
        console.error("🛰️ DATA LOAD ERROR:", e);
        setLoading(false);
      });
  }, []);

  const updateRadar = useCallback(() => {
    if (!tles.length || !lat || !lon) return;

    const now = new Date();
    const gmst = satellite.gstime(now);

    // Observer: Franklin, TN (35.9N, -86.8W)
    // Documentation Note: Set the Observer in RADIANS
    const observerGd = {
      latitude: satellite.degreesToRadians(parseFloat(lat)),
      longitude: satellite.degreesToRadians(parseFloat(lon)),
      height: 0.122 // km
    };

    const visiblePoints = [];

    tles.forEach((sat) => {
      try {
        // v6.0.2 preferred method for JSON/OMM objects
        const satrec = satellite.json2satrec(sat);

        if (satrec && !satrec.error) {
          // Propagate returns { position: {x,y,z}, velocity: {x,y,z} }
          const pv = satellite.propagate(satrec, now);

          if (pv && pv.position) {
            const satEcf = satellite.eciToEcf(pv.position, gmst);

            // CRITICAL FIX: ecfToLookAngles(observer, satellite)
            // Documentation states: observer first, satellite second
            const lookAngles = satellite.ecfToLookAngles(observerGd, satEcf);

            // lookAngles.elevation is in radians
            if (lookAngles.elevation > 0) {
              const r = (1 - lookAngles.elevation / (Math.PI / 2)) * 50;
              const theta = lookAngles.azimuth - Math.PI / 2;

              visiblePoints.push({
                x: 50 + r * Math.cos(theta),
                y: 50 + r * Math.sin(theta),
                id: sat.OBJECT_ID || sat.NORAD_CAT_ID
              });
            }
          }
        }
      } catch (e) {
        /* skip */
      }
    });

    setNodes(visiblePoints);
    // console.log(`📡 RADAR: Tracking ${visiblePoints.length} satellites.`);
  }, [tles, lat, lon]);

  useEffect(() => {
    updateRadar();
    const timer = setInterval(updateRadar, 15000);
    return () => clearInterval(timer);
  }, [updateRadar]);

  return (
    
      <div>
        <div className="card-title">STARLINK SATELLITE RADAR</div>

        <div className="radar-container">
          <div className="radar-scanner"></div>
          <div className="radar-axis-h"></div>
          <div className="radar-axis-v"></div>
          <div className="radar-ring r1"></div>
          <div className="radar-ring r2"></div>
          <div className="radar-ring r3"></div>

          {nodes.map((n) => (
            <div
              key={n.id}
              className="radar-node"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            />
          ))}
          {loading && <div className="radar-status">LINKING...</div>}
        </div>
        <div className="stats-row">
          <span>ACTIVE: {nodes.length}</span>
          <span>
            LOCATION: {parseFloat(lat).toFixed(1)}N{" "}
            {Math.abs(parseFloat(lon)).toFixed(1)}W
          </span>
        </div>
      </div>
   
  );
};

export default Starlink;
