import React, { useState, useEffect, memo } from "react";
import "./ISSWatcher.css";
import { useLocation } from "./LocationContext";

const ISSWatcher = memo(({ onDistanceUpdate }) => {
  const [issPos, setIssPos] = useState({ lat: 0, lon: 0 });
  const [distance, setDistance] = useState(null);
  const [cityName, setCityName] = useState("Local Station");

  const { location } = useLocation();
  const { lat, lon, name } = location; // Pull 'name' to use as a fallback

  useEffect(() => {
    // 1. Initialize the controller
    const controller = new AbortController();
    const signal = controller.signal;

    const getLocalName = async (issLat, issLon) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${issLat}&lon=${issLon}`,
          {
            signal, // 2. Attach signal to Nominatim
            headers: {
              "User-Agent": `SkyWatch/1.0 (${import.meta.env.VITE_NOMINATIM_EMAIL || "anonymous"})`
            }
          }
        );

        if (response.status === 429 || response.status === 425) return;

        const data = await response.json();
        if (data.address) {
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "Unknown Waters";
          setCityName(city);
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error("Nominatim error:", err);
      }
    };

    const fetchISS = async () => {
      try {
        // 🛰️ Using a more reliable API that supports HTTPS properly
        const res = await fetch(
          "https://api.wheretheiss.at/v1/satellites/25544",
          { signal }
        );
        const data = await res.json();

        // Note: This API returns numbers directly, so no need for extra parsing
        const issLat = data.latitude;
        const issLon = data.longitude;

        setIssPos({ lat: issLat, lon: issLon });

        // Haversine Formula (Keep your existing math below this...)
        const R = 3958.8;
        const dLat = (issLat - lat) * (Math.PI / 180);

        // Calculate Distance (Haversine Formula)

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

        // Optional: Only geocode if it's over a new area (save your rate limit!)
        // getLocalName(issLat, issLon);
      } catch (e) {
        if (e.name !== "AbortError") console.error("ISS Tracking Offline");
      }
    };

    fetchISS();
    const interval = setInterval(fetchISS, 10000);

    return () => {
      // 3. Cleanup: Cancel all pending requests and clear interval
      controller.abort();
      clearInterval(interval);
    };
  }, [lat, lon, onDistanceUpdate]);

  const isNearby = distance !== null && distance < 500;

  return (
    <div className={`iss-card-internal ${isNearby ? "nearby" : ""}`}>
      <h2 className="card-title">INTERNATIONAL SPACE STATION</h2>

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
        <div className="iss-distance-text">
          {distance
            ? `${Math.round(distance).toLocaleString()} mi`
            : "SCANNING..."}
        </div>
        <p className="location-subtext glow-sub">from {name}</p>
      </div>

      <p className="telemetry-coords">
        LAT: {parseFloat(issPos.lat).toFixed(2)} | LON:{" "}
        {parseFloat(issPos.lon).toFixed(2)}
      </p>

      <iframe
        className="iss-map-frame"
        title="ISS Map"
        src="https://isstracker.pl/en/widget/map?disableInfoBox=1&lang=en"
        loading="lazy"
      ></iframe>

      {isNearby && (
        <div className="proximity-alert">LOW ORBIT PROXIMITY ALERT</div>
      )}
    </div>
  );
});

export default ISSWatcher;
