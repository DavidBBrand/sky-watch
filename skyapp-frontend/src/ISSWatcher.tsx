import React, { useState, useEffect, memo } from "react";
import "./ISSWatcher.css";
import { useLocation } from "./LocationContext";

// 1. Define Props Interface
interface ISSWatcherProps {
  onDistanceUpdate?: (distance: number) => void;
}

// 2. Define State Interfaces
interface ISSPosition {
  lat: number;
  lon: number;
}

const ISSWatcher: React.FC<ISSWatcherProps> = memo(({ onDistanceUpdate }) => {
  const [issPos, setIssPos] = useState<ISSPosition>({ lat: 0, lon: 0 });
  const [distance, setDistance] = useState<number | null>(null);

  const { location } = useLocation();
  const { lat, lon, name } = location;

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchISS = async () => {
      try {
        const res = await fetch(
          "https://api.wheretheiss.at/v1/satellites/25544",
          { signal }
        );
        const data = await res.json();

        const issLat = data.latitude;
        const issLon = data.longitude;

        setIssPos({ lat: issLat, lon: issLon });

        // 3. Haversine Formula for Distance Tracking
        if (lat === null || lon === null) return;
        const R = 3958.8; // Earth's radius in miles
        const dLat = (issLat - lat) * (Math.PI / 180);
        const dLon = (issLon - lon) * (Math.PI / 180);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) *
          Math.cos(issLat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const currentDistance = R * c;

        setDistance(currentDistance);
        if (onDistanceUpdate) onDistanceUpdate(currentDistance);

      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") console.error("ISS Tracking Offline");
      }
    };

    fetchISS();
    const interval = setInterval(fetchISS, 10000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [lat, lon, onDistanceUpdate]);

  const isNearby = distance !== null && distance < 500;

  return (
    <div className={`iss-card-internal ${isNearby ? "nearby" : ""}`}>
      <h2 className="card-title">International Space Station</h2>

      <div className="svg-container">
        <svg
          className="iss-favicon-small"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="10" y="8" width="4" height="8" rx="1" />
          <rect x="7" y="11" width="10" height="2" rx="0.5" />
          <rect x="2" y="5" width="4" height="14" rx="1" opacity="0.8" />
          <rect x="18" y="5" width="4" height="14" rx="1" opacity="0.8" />
          <rect x="6" y="11.5" width="12" height="1" />
        </svg>
      </div>

      <div className="indicator-wrapper">
        <div className="ping-indicator"></div>
      </div>

      <div className="distance-display-group">
        <div className="card-title iss-distance-text distance-value">
          {distance
            ? `${Math.round(distance).toLocaleString()} miles`
            : "Scanning..."}
        </div>
        <div className="location-subtext glow-sub" >from {name}</div>
      </div>

      <div className="telemetry-coords">
        <div style={{ letterSpacing: "1px" }}>
          Latitude: <span className="glow-sub2">
            {/* Use optional chaining ?. and provide a fallback "0.00" */}
            {issPos.lat?.toFixed?.(2) ?? "0.00"}
          </span>
        </div>
        <div>
          Longitude: <span className="glow-sub2">
            {issPos.lon?.toFixed?.(2) ?? "0.00"}
          </span>
        </div>
      </div>

      <iframe
        className="iss-map-frame"
        title="ISS Map"
        src="https://isstracker.pl/en/widget/map?disableInfoBox=1&lang=en"
        loading="lazy"
      ></iframe>

      {isNearby && (
        <div className="proximity-alert">ISS NEARBY</div>
      )}
    </div>
  );
});

export default ISSWatcher;


