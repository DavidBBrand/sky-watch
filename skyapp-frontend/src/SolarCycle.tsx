import React, { memo } from "react";
import "./SolarCycle.css";
import SolarCompass from "./SolarCompass";

// 1. define shape of the Sun telemetry data
interface SunData {
  sunrise: string;
  sunset: string;
  zenith: string;
  zenith_alt: number | string;
  zenith_az: number | string;
  current_altitude: number; // required by SolarCompass
  phase: string; // required by Solar Compass
}
// legacy javascript logic:
// const SolarCycle = memo(({ sun, timezone }) => {
//   const formatTime = (isoString) => {
// 1. Handle empty data
//     if (!isoString || !sun) return "--:--";

// 2. Handle Polar Edge Cases (Midnight Sun / Polar Night)
// If the string contains "Polar", return it as-is (e.g., "Polar Day")
//     if (typeof isoString === 'string' && isoString.includes("Polar")) {
//       return isoString;
//     }

interface SolarCycleProps {
  sun: SunData;
  timezone: string | null;
  date: string;
}

const SolarCycle: React.FC<SolarCycleProps> = memo(({ sun, timezone, date }) => {
  const formatTime = (isoString: string): string => {
    if (!isoString || !sun) return "--:--";
    // handle polar edge cases (e.g., "Polar Day", "Polar Night")
    if (typeof isoString === 'string' && isoString.includes("Polar")) {
      return isoString;
    }
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        // Fallback to UTC if timezone is missing to prevent crashing
        timeZone: timezone || "UTC"
      });
    } catch (error) {
      console.warn("Invalid date or timezone in SolarCycle:", isoString, timezone);
      
      // Final fallback: try a standard local format if the timezone object specifically failed
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
  };

  if (!sun) return null;

  return (
    <div className="solar-cycle-container">
      <div className="solar-flex">
        <div className="solar-item" style={{ flex: 1 }}>
          <div className="sub-title">Sunrise</div>
          <span style={{ fontSize: "3.0rem" }} role="img" aria-label="sunrise">
            🌅
          </span>
          <div className="solar-time">{formatTime(sun.sunrise)}</div>
        </div>
        
        {/* MIDDLE: Live Altitude & Zenith Time */}
        <div className="solar-item" style={{ flex: 1 }}>
          <div className="sub-title">Current Altitude</div>
          <SolarCompass sunData={sun} />

          <div className="zenith-container" style={{ marginTop: "10px" }}>
            <div
              className="sub-title"
            >
              Zenith
            </div>

            <div
              className="zenith-time"
              style={{
                fontSize: "1.2rem",
                color: "var(--accent-color2)",
    
              }}
            >
              {formatTime(sun.zenith)}
            </div>

            <div
              className="zenith-coords"
              style={{ fontSize: "1.0rem", marginTop: "8px" }}
            >
              <span style={{ color: "var(--accent-color2)" }}>
                <div className="zenith-label sub-title">Peak</div> {sun.zenith_alt}°
              </span>
              <span style={{ margin: "0 10px", opacity: 0.3 }}></span>
              <span style={{ color: "var(--accent-color2)" }}>
                <div className="zenith-label sub-title">Az</div> {sun.zenith_az}°
              </span>
            </div>
          </div>
        </div>
        <div className="solar-item" style={{ flex: 1 }}>
          <div className="sub-title">Sunset</div>
          <span style={{ fontSize: "3.0rem" }} role="img" aria-label="sunset">
            🌇
          </span>
          <div className="solar-time">{formatTime(sun.sunset)}</div>
        </div>
      </div>
    </div>
  );
});

export default SolarCycle;
