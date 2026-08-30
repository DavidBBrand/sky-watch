import React, { useState, useEffect, useRef, memo } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import StarlinkGlobeWorker from "./starlinkGlobeWorker?worker";
import { useLocation } from "./LocationContext";
import "./StarlinkGlobe.css";

interface TLEData {
  OBJECT_NAME: string;
  OBJECT_ID?: string;
  NORAD_CAT_ID?: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
}

interface SatPoint {
  lat: number;
  lng: number;
  name: string;
  aboveHorizon: boolean; // elevation > 0 from user's location → matches radar
}

interface UserMarker {
  lat: number;
  lng: number;
  name: string;
}

interface StarlinkGlobeProps {
  theme?: "day" | "night";
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

const STARLINK_FACTS: string[] = [
  "Starlink satellites orbit roughly 550 km (340 mi) up — far lower than traditional geostationary satellites at 35,786 km.",
  "Each Starlink satellite weighs about 260 kg (573 lbs), roughly the mass of a grand piano.",
  "SpaceX has launched more than 6,000 Starlink satellites since 2019, the largest satellite constellation ever deployed.",
  "A single Falcon 9 launch can carry up to 60 Starlink satellites at once.",
  "Many Starlink satellites use krypton or argon-fueled ion thrusters to maintain orbit and dodge space debris.",
  "Starlink satellites are designed to fully burn up in the atmosphere at the end of their roughly 5-year lifespan.",
  "Newer Starlink satellites talk to each other via laser inter-satellite links, skipping ground relays entirely.",
  "Starlink's low orbit cuts latency to as little as 20–40 ms, versus 600+ ms for older geostationary internet satellites.",
  "SpaceX has FCC approval for up to 12,000 Starlink satellites, with plans for as many as 42,000 in later phases.",
  "Freshly launched Starlink satellites form a bright 'train' of lights across the night sky before spreading into their final orbits.",
  "Starlink satellites are flat-panelled so hundreds can stack tightly inside a single rocket fairing.",
  "Astronomers have raised concerns that Starlink's brightness can interfere with ground-based telescope observations.",
  "Starlink uses inclined orbital shells at different altitudes to provide broadband coverage worldwide, including polar regions.",
  "Each satellite steers multiple simultaneous broadband beams toward users on the ground using phased-array antennas.",
];

const StarlinkGlobe: React.FC<StarlinkGlobeProps> = memo(({ theme = "night", isExpanded = false, onExpand, onCollapse }) => {
  const { location } = useLocation();
  const { lat, lon } = location;

  // Pick a random split of facts once per mount so left/right stay stable while expanded
  const [[leftFacts, rightFacts]] = useState<[string[], string[]]>(() => {
    const shuffled = [...STARLINK_FACTS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 8);
    return [picked.slice(0, 4), picked.slice(4, 8)];
  });

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tles, setTles] = useState<TLEData[]>([]);
  const [satPoints, setSatPoints] = useState<SatPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Refs so the worker dispatch interval always sends the latest data
  const tlesRef = useRef<TLEData[]>([]);
  const latRef  = useRef(lat);
  const lonRef  = useRef(lon);
  const workerRef = useRef<Worker | null>(null);

  // Track container size so the globe fills the card
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep refs in sync so the worker dispatch always sends fresh data
  useEffect(() => { tlesRef.current = tles; }, [tles]);
  useEffect(() => { latRef.current = lat; lonRef.current = lon; }, [lat, lon]);

  // Fetch TLEs once — backend Redis cache serves subsequent requests instantly
  useEffect(() => {
    const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";
    fetch(`${API_BASE_URL}/starlink-live`)
      .then(res => res.json())
      .then(data => setTles(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Spawn the Web Worker once. All TLE propagation (thousands of satellites) runs
  // there, off the main thread, so the 5-second update never blocks the RAF loop.
  useEffect(() => {
    const worker = new StarlinkGlobeWorker();
    worker.onmessage = (e: MessageEvent<{ points: SatPoint[] }>) => {
      setSatPoints(e.data.points);
    };
    worker.onerror = (err) => console.error("StarlinkGlobe worker error:", err);
    workerRef.current = worker;
    return () => { worker.terminate(); workerRef.current = null; };
  }, []);

  // Dispatch to the worker on first TLE load, then every 5 seconds.
  useEffect(() => {
    if (!tles.length) return;
    const dispatch = () => {
      if (!tlesRef.current.length) return;
      workerRef.current?.postMessage({
        tles: tlesRef.current,
        lat: latRef.current,
        lon: lonRef.current,
      });
    };
    dispatch();
    const timer = setInterval(dispatch, 5000);
    return () => clearInterval(timer);
  }, [tles, lat, lon]);

  // Fly to user location whenever it changes
  useEffect(() => {
    if (!globeRef.current || lat === null || lon === null) return;
    globeRef.current.pointOfView({ lat, lng: lon, altitude: 1.5 }, 1200);
  }, [lat, lon]);

  // Night mode: blue marble is far more legible than the near-black city-lights texture
  const globeImg = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  const satColorBelow = theme === "night" ? "#84d68f" : "#1dbb5e";
  const satColorAbove = "#ffa040"; // orange = above horizon, matches radar

  const userMarker: UserMarker[] =
    lat !== null && lon !== null
      ? [{ lat, lng: lon, name: location.name }]
      : [];

  return (
    <div className="starlink-globe-card">
      <div className="card-title">Global Starlink Network</div>
      {isExpanded ? (
        <button className="globe-expand-btn" onClick={onCollapse}>
          ← Back to Dashboard
        </button>
      ) : (
        onExpand && (
          <button className="globe-expand-btn" onClick={onExpand}>
            Expand
          </button>
        )
      )}
      <div className="globe-meta">
        <span className="globe-count">
          {satPoints.length > 0 ? `${satPoints.length} satellites tracked` : "Propagating orbits…"}
        </span>
      </div>
      <div className={isExpanded ? "globe-stage" : "globe-stage-inline"}>
        {isExpanded && (
          <div className="globe-facts-panel">
            {leftFacts.map((fact, i) => (
              <p key={i} className="globe-fact">{fact}</p>
            ))}
          </div>
        )}
        <div ref={containerRef} className="globe-container">
        {dimensions.width > 0 && (
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl={globeImg}
            onGlobeReady={() => {
              if (globeRef.current && lat !== null && lon !== null) {
                globeRef.current.pointOfView({ lat, lng: lon, altitude: 1.5 }, 0);
              }
            }}
            showAtmosphere
            atmosphereColor={
              theme === "night"
                ? "rgba(30, 80, 180, 0.45)"
                : "rgba(100, 200, 255, 0.35)"
            }
            atmosphereAltitude={0.18}
            backgroundColor="rgba(0,0,0,0)"
            // ── Satellite dots (flat stubs just above surface) ──
            pointsData={satPoints}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={0.03}
            pointColor={(d: object) =>
              (d as SatPoint).aboveHorizon ? satColorAbove : satColorBelow
            }
            pointRadius={0.15}
            pointsMerge={false}
            pointsTransitionDuration={0}
            pointLabel={(d: object) => (d as SatPoint).name}
            // ── User location label (fixed 14px DOM element — never scales with zoom) ──
            htmlElementsData={userMarker}
            htmlLat={(d: object) => (d as UserMarker).lat}
            htmlLng={(d: object) => (d as UserMarker).lng}
            htmlAltitude={0.01}
            htmlElement={(d: object) => {
              const marker = d as UserMarker;
              // Wrapper: react-globe.gl positions this at the coordinate (0×0, no visual)
              const wrapper = document.createElement('div');
              wrapper.style.cssText = 'position:relative;width:0;height:0;overflow:visible;';
              // Label above the coordinate
              const el = document.createElement('div');
              el.textContent = marker.name;
              el.style.cssText = [
                'position: absolute',
                'bottom: 10px',
                'left: 0',
                'transform: translateX(-50%)',
                'color: #ff6b35',
                'font-family: Oxanium, sans-serif',
                'font-size: 14px',
                'font-weight: 600',
                'white-space: nowrap',
                'pointer-events: none',
                'text-shadow: 0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
              ].join(';');
              // Static dot — fixed pixel size, never scales with zoom
              const dot = document.createElement('div');
              dot.style.cssText = [
                'position: absolute',
                'width: 8px',
                'height: 8px',
                'background: #ff6b35',
                'border-radius: 50%',
                'top: 0',
                'left: 0',
                'transform: translate(-50%, -50%)',
                'pointer-events: none',
                'box-shadow: 0 0 6px rgba(255,107,53,0.8)',
              ].join(';');
              wrapper.appendChild(el);
              wrapper.appendChild(dot);
              return wrapper;
            }}
          />
        )}
        </div>
        {isExpanded && (
          <div className="globe-facts-panel">
            {rightFacts.map((fact, i) => (
              <p key={i} className="globe-fact">{fact}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default StarlinkGlobe;
