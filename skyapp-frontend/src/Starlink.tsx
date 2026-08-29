import React, { useState, useEffect, useRef, memo } from "react";
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

interface WorkerOutput {
  nodes: RadarNode[];
  isAlert: boolean;
}

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || "";
const RADIUS_METERS = 500 * 1609.344; // 500 miles in meters

// Compute Mapbox zoom so the image edge = exactly 500 miles from center.
// Mercator formula: meters_per_px = (cos(lat) * EARTH_CIRC) / (256 * 2^Z)
const calcRadarZoom = (lat: number, imagePx: number): number => {
  const metersPerPx = (2 * RADIUS_METERS) / imagePx;
  return Math.log2((Math.cos((lat * Math.PI) / 180) * 40075016.686) / (512 * metersPerPx));
};

interface StarlinkProps {
  theme?: "day" | "night";
}

const Starlink: React.FC<StarlinkProps> = memo(({ theme = "night" }) => {
  const { location } = useLocation();
  const { lat, lon } = location;

  const [nodes, setNodes] = useState<RadarNode[]>([]);
  const [tles, setTles] = useState<TLEData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [radarSize, setRadarSize] = useState<number>(0);
  const radarRef = useRef<HTMLDivElement>(null);

  // Refs so the worker dispatch interval always sends the latest data
  // without needing to rebuild the interval on every TLE/location change.
  const tlesRef = useRef<TLEData[]>([]);
  const latRef  = useRef(lat);
  const lonRef  = useRef(lon);

  // Keep refs in sync with state / props
  useEffect(() => { tlesRef.current = tles; }, [tles]);
  useEffect(() => { latRef.current = lat; lonRef.current = lon; }, [lat, lon]);

  // Measure the actual rendered radar container so the map zoom is always correct
  useEffect(() => {
    const el = radarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setRadarSize(Math.round(entries[0].contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch TLEs from backend (once per location change)
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
        console.error("Starlink TLE fetch error:", e);
        setLoading(false);
      });
  }, [lat, lon]);

  // Spawn the Web Worker once. The heavy TLE propagation loop runs there,
  // off the main thread, so it never blocks the solar system animation RAF.
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("./starlinkWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
      setNodes(e.data.nodes);
      setIsAlert(e.data.isAlert);
    };

    worker.onerror = (err) => {
      console.error("Starlink worker error:", err);
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Dispatch to the worker immediately when TLEs arrive, then every 3.5s.
  // The interval itself is cheap (just a postMessage); all math runs in the worker.
  useEffect(() => {
    if (!tles.length) return;

    const dispatch = () => {
      if (!tlesRef.current.length || latRef.current === null || lonRef.current === null) return;
      workerRef.current?.postMessage({
        tles: tlesRef.current,
        lat: latRef.current,
        lon: lonRef.current,
      });
    };

    dispatch(); // immediate on first load / location change
    const timer = setInterval(dispatch, 3500);
    return () => clearInterval(timer);
  }, [tles, lat, lon]);

  return (
    <div className="starlink-card">
      <div className="card-title">Starlink Satellite Radar</div>
      <div ref={radarRef} className={`radar-container ${isAlert ? "alert" : ""}`}>
        {lat !== null && lon !== null && MAPBOX_TOKEN && radarSize > 0 && (
          <img
            className="radar-map-overlay"
            src={`https://api.mapbox.com/styles/v1/mapbox/${theme === "day" ? "light-v11" : "dark-v11"}/static/${lon},${lat},${calcRadarZoom(lat, radarSize).toFixed(2)},0/${radarSize}x${radarSize}@2x?access_token=${MAPBOX_TOKEN}`}
            alt=""
            aria-hidden="true"
          />
        )}
        <div className="radar-scanner"></div>
        <div className="radar-axis-h"></div>
        <div className="radar-axis-v"></div>
        <div className="radar-ring r1"></div>
        <div className="radar-ring r2"></div>

        <span className="radar-direction dir-n">N</span>
        <span className="radar-direction dir-e">E</span>
        <span className="radar-direction dir-s">S</span>
        <span className="radar-direction dir-w">W</span>

        <div className="radar-center-anchor">
          <span className="radar-label label-center">{location.name}</span>
        </div>
        <span className="radar-label label-r1">70°</span>
        <span className="radar-label label-r2">50°</span>

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
