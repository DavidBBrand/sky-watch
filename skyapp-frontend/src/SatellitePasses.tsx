import React, { useState, useEffect, memo } from "react";
import { useLocation } from "./LocationContext";
import "./SatellitePasses.css";

interface SatellitePass {
  satellite: string;
  rise_time: string;
  culminate_time: string;
  set_time: string;
  max_altitude: number;
  rise_azimuth: number;
  set_azimuth: number;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const getCompassDirection = (az: number): string => COMPASS[Math.round(az / 45) % 8];

function formatPassTime(iso: string, tz: string | null): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--";
  return d.toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz || undefined,
  });
}

const SatellitePasses: React.FC = memo(() => {
  const { location } = useLocation();
  const { lat, lon, timezone } = location;

  const [passes, setPasses] = useState<SatellitePass[] | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (lat === null || lon === null) return;
    let isMounted = true;

    const fetchPasses = () => {
      const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";

      fetch(`${API_BASE_URL}/satellite-passes?lat=${lat}&lon=${lon}`)
        .then((res) => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
        })
        .then((data: { passes: SatellitePass[] }) => {
          if (!isMounted) return;
          setPasses(data.passes || []);
          setError(false);
        })
        .catch(() => {
          if (isMounted) setError(true);
        });
    };

    setPasses(null);
    setError(false);
    fetchPasses();
    // Passes don't shift meaningfully minute to minute — the backend itself
    // caches for 30 min, so poll a little less eagerly than the live cards.
    const interval = setInterval(fetchPasses, 300000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lat, lon]);

  return (
    <div className="satpasses-container">
      <div className="card-title">Satellite Passes</div>

      {error ? (
        <p className="satpasses-signal-lost">SIGNAL LOST</p>
      ) : passes === null ? (
        <div className="satpasses-loading glow-sub">Scanning for passes…</div>
      ) : passes.length === 0 ? (
        <div className="satpasses-empty glow-sub">
          No visible passes in the next 3 days
        </div>
      ) : (
        <div className="satpasses-list">
          {passes.map((p, i) => {
            const durationMin = Math.round(
              (new Date(p.set_time).getTime() - new Date(p.rise_time).getTime()) / 60000
            );
            return (
              <div key={i} className="satpasses-item">
                <div className="satpasses-item-header">
                  <span className="satpasses-name glow-sub2">{p.satellite}</span>
                  <span className="satpasses-time">{formatPassTime(p.rise_time, timezone)}</span>
                </div>
                <div className="satpasses-detail">
                  {getCompassDirection(p.rise_azimuth)} → {getCompassDirection(p.set_azimuth)}
                  {" · "}peaks {p.max_altitude.toFixed(0)}°{" · "}{durationMin} min
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default SatellitePasses;
