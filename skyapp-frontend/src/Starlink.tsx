import React, { useState, useEffect, useCallback, memo } from "react";
import * as satellite from "satellite.js";
import { useLocation } from "./LocationContext";
import "./Starlink.css";

//  Define the TLE (Two-Line Element) structure from your FastAPI backend
interface TLEData {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: string;
  TLE_LINE0: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  error?: string;
}

//  Define the Radar Node (The processed visual point)
interface RadarNode {
  x: number;
  y: number;
  id: string;
  name: string;
  distance: number;
}

const Starlink: React.FC = memo(() => {
  const { location } = useLocation();
  const { lat, lon } = location;

  const [nodes, setNodes] = useState<RadarNode[]>([]);
  const [tles, setTles] = useState<TLEData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAlert, setIsAlert] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";

    fetch(`${API_BASE_URL}/starlink-live?lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => {
        setTles(Array.isArray(data) ? data : [data]);
        setLoading(false);
      })
      .catch((e) => {
        console.error(" DATA LOAD ERROR:", e);
        setLoading(false);
      });
  }, [lat, lon]);

  const updateRadar = useCallback(() => {
    if (!tles.length || lat === null || lon === null) return;

    const now = new Date();
    const gmst = satellite.gstime(now);

    // Observer position (Geodetic)
    const observerGd = {
      latitude: satellite.degreesToRadians(lat),
      longitude: satellite.degreesToRadians(lon),
      height: 0.122 // Ground altitude in km
    };

    const visiblePoints: RadarNode[] = [];
    let closeContact = false;

    tles.forEach((sat) => {
      try {
        if (!sat || sat.error) return;

        const line1 = sat.TLE_LINE1;
        const line2 = sat.TLE_LINE2;

        if (!line1 || !line2) return;

        const satrec = satellite.twoline2satrec(line1, line2);

        if (satrec && !satrec.error) {
          const pv = satellite.propagate(satrec, now);

          if (pv && typeof pv.position !== 'boolean') {
            const satEcf = satellite.eciToEcf(pv.position, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, satEcf);

            if (lookAngles.elevation > 0) {
              const slantRangeKm = lookAngles.rangeSat;

              if (slantRangeKm) {
                const slantRangeMiles = Math.round(slantRangeKm * 0.621371);
                const MAX_RANGE = 500; // The absolute edge of your radar screen in miles

                //  Ignore anything outside our local bubble
                if (slantRangeMiles <= MAX_RANGE) {

                  // Trigger alert if they get within 150 miles
                  if (slantRangeMiles < 150) closeContact = true;

                  //  Linear Distance Scaling:
                  // If distance is 500mi, r = 48% (outer edge of the CSS circle).
                  // If distance is 250mi, r = 24% (middle ring).
                  const r = (slantRangeMiles / MAX_RANGE) * 48;
                  const theta = lookAngles.azimuth - Math.PI / 2;

                  const rawId = sat.OBJECT_ID || sat.NORAD_CAT_ID || Math.random();
                  const rawName = sat.OBJECT_NAME || "STARLINK";

                  visiblePoints.push({
                    x: 50 + r * Math.cos(theta),
                    y: 50 + r * Math.sin(theta),
                    id: String(rawId),
                    name: String(rawName),
                    distance: slantRangeMiles
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        // console.log(e);
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

        <div className="radar-center-anchor">
          <span className="radar-label label-center">{location.name}</span>
        </div>
        <span className="radar-label label-r1">150mi</span>
        <span className="radar-label label-r2">300mi</span>
        <span className="radar-label label-r3">500mi</span>

        {nodes.map((n) => (
          <div
            key={n.id}
            className="radar-node"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <span className="node-tooltip">
              <strong className="tooltip-name">{n.name}</strong>
              <br />
              <span style={{ color: "var(--accent-color2)" }}>{n.distance} mi</span>
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
            {lat !== null ? lat.toFixed(1) : "--"}°N{" "} /
            {lon !== null ? Math.abs(lon).toFixed(1) : "--"}°W
          </p>
        </div>
      </div>
    </div>
  );
});

export default Starlink;


