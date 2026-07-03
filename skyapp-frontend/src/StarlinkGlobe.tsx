import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as satellite from "satellite.js";
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
  alt: number;
  name: string;
}

interface UserMarker {
  lat: number;
  lng: number;
  name: string;
}

interface StarlinkGlobeProps {
  theme?: "day" | "night";
}

const StarlinkGlobe: React.FC<StarlinkGlobeProps> = memo(({ theme = "night" }) => {
  const { location } = useLocation();
  const { lat, lon } = location;

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tles, setTles] = useState<TLEData[]>([]);
  const [satPoints, setSatPoints] = useState<SatPoint[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  // Fetch TLEs once — backend Redis cache serves subsequent requests instantly
  useEffect(() => {
    const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";
    fetch(`${API_BASE_URL}/starlink-live`)
      .then(res => res.json())
      .then(data => setTles(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Propagate all TLEs to current geodetic positions
  const propagate = useCallback(() => {
    if (!tles.length) return;
    const now = new Date();
    const gmst = satellite.gstime(now);
    const points: SatPoint[] = [];

    for (const tle of tles) {
      try {
        const satrec = satellite.twoline2satrec(tle.TLE_LINE1, tle.TLE_LINE2);
        if (satrec.error) continue;
        const pv = satellite.propagate(satrec, now);
        if (!pv || typeof pv.position === "boolean") continue;
        const geo = satellite.eciToGeodetic(
          pv.position as satellite.EciVec3<number>,
          gmst
        );
        // Skip satellites outside realistic Starlink altitude range (200–1200 km)
        // Values outside this range indicate stale/bad TLE propagation
        if (geo.height < 200 || geo.height > 1200) continue;
        points.push({
          lat: satellite.radiansToDegrees(geo.latitude),
          lng: satellite.radiansToDegrees(geo.longitude),
          alt: geo.height / 6371, // km → fraction of Earth radius (~0.05–0.09 for Starlink)
          name: tle.OBJECT_NAME,
        });
      } catch {
        /* skip malformed TLEs */
      }
    }

    setSatPoints(points);
  }, [tles]);

  useEffect(() => {
    propagate();
    const timer = setInterval(propagate, 30_000);
    return () => clearInterval(timer);
  }, [propagate]);

  // Fly to user location whenever it changes
  useEffect(() => {
    if (!globeRef.current || lat === null || lon === null) return;
    globeRef.current.pointOfView({ lat, lng: lon, altitude: 2.0 }, 1200);
  }, [lat, lon]);

  // Night mode: blue marble is far more legible than the near-black city-lights texture
  const globeImg = "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  const satColor = theme === "night" ? "#84d68f" : "#1dbb5e";

  const userMarker: UserMarker[] =
    lat !== null && lon !== null
      ? [{ lat, lng: lon, name: location.name }]
      : [];

  return (
    <div className="starlink-globe-card">
      <div className="card-title">Global Starlink Network</div>
      <div className="globe-meta">
        <span className="globe-count">
          {satPoints.length > 0 ? `${satPoints.length} satellites tracked` : "Propagating orbits…"}
        </span>
      </div>
      <div ref={containerRef} className="globe-container">
        {dimensions.width > 0 && (
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl={globeImg}
            onGlobeReady={() => {
              if (globeRef.current && lat !== null && lon !== null) {
                globeRef.current.pointOfView({ lat, lng: lon, altitude: 2.0 }, 0);
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
            // ── Satellite dots ──
            pointsData={satPoints}
            pointLat="lat"
            pointLng="lng"
            pointAltitude="alt"
            pointColor={() => satColor}
            pointRadius={0.12}
            pointsMerge={false}
            pointLabel={(d: object) => (d as SatPoint).name}
            // ── User location label ──
            labelsData={userMarker}
            labelLat="lat"
            labelLng="lng"
            labelText="name"
            labelColor={() => "#ff6b35"}
            labelSize={1.0}
            labelDotRadius={0.5}
            labelDotOrientation={() => "bottom" as const}
            labelAltitude={0.01}
            // ── 500-mile pulsing ring ──
            ringsData={userMarker}
            ringLat="lat"
            ringLng="lng"
            ringColor={() => (t: number) => `rgba(255,107,53,${1 - t})`}
            ringMaxRadius={7.2}
            ringPropagationSpeed={2}
            ringRepeatPeriod={1800}
          />
        )}
      </div>
    </div>
  );
});

export default StarlinkGlobe;
