import React, { memo } from "react";
import "./SolarCycle.css";
import SolarCompass from "./SolarCompass";

//  define shape of the Sun telemetry data
interface SunData {
  sunrise?: string;
  sunset?: string;
  zenith?: string;
  zenith_alt?: number | string;
  zenith_az?: number | string;
  current_altitude?: number;
  phase?: string | number;
}


interface SolarCycleProps {
  sun: SunData;
  timezone: string | null;
}

const SolarCycle: React.FC<SolarCycleProps> = memo(({ sun, timezone }) => {
  const formatTime = (isoString: string): string => {
    if (!isoString || !sun) return "--:--";
    // handle polar edge cases (e.g., "Polar Day", "Polar Night")
    if (typeof isoString === 'string' && isoString.includes("Polar")) {
      return isoString;
    }
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        // Fallback to UTC if timezone is missing to prevent crashing
        timeZone: timezone || "UTC"
      });
    } catch (error) {
      console.warn("Invalid date or timezone in SolarCycle:", isoString, timezone);
      
      // Final fallback: try a standard local format if the timezone object specifically failed
      return new Date(isoString).toLocaleTimeString([], {
        hour: "numeric",
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
          <div className="solar sub-title">Sunrise</div>
          <svg width="6rem" height="5.5rem" viewBox="0 0 48 52" fill="none" role="img" aria-label="sunrise" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="42" x2="44" y2="42" stroke="#FFD060" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="9" fill="#FFD060"/>
            <line x1="24" y1="13" x2="24" y2="9" stroke="#FFD060" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="16" y1="16" x2="13" y2="13" stroke="#FFD060" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="32" y1="16" x2="35" y2="13" stroke="#FFD060" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="13" y1="24" x2="9" y2="24" stroke="#FFD060" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="35" y1="24" x2="39" y2="24" stroke="#FFD060" strokeWidth="2.5" strokeLinecap="round"/>
            <polyline points="17,41 24,36 31,41" stroke="#FFD060" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="solar-time">{formatTime(sun.sunrise)}</div>
        </div>
        
        {/* MIDDLE: Live Altitude & Zenith Time */}
        <div className="solar-item" style={{ flex: 1 }}>
          <div className="solar2 sub-title">Current Altitude</div>
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
                fontSize: "1.6rem",
                color: "var(--accent-color2)",
                fontWeight: "600"
    
              }}
            >
              {formatTime(sun.zenith)}
            </div>

            <div
              className="zenith-coords"
              style={{ fontSize: "1.6rem", marginTop: "8px" }}
            >
              <span style={{ color: "var(--accent-color2)", fontWeight: "600" }}>
                <div className="zenith-label sub-title">Peak</div> {sun.zenith_alt}°
              </span>
              <span style={{ margin: "0 10px", opacity: 0.3 }}></span>
              <span style={{ color: "var(--accent-color2)", fontWeight: "600" }}>
                <div className="zenith-label sub-title">Az</div> {sun.zenith_az}°
              </span>
            </div>
          </div>
        </div>
        <div className="solar-item" style={{ flex: 1 }}>
          <div className="solar sub-title">Sunset</div>
          <svg width="6rem" height="5.5rem" viewBox="0 0 48 52" fill="none" role="img" aria-label="sunset" xmlns="http://www.w3.org/2000/svg">
            <line x1="4" y1="28" x2="44" y2="28" stroke="#FF9040" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M 15 28 A 9 9 0 0 0 33 28 Z" fill="#FF9040"/>
            <line x1="24" y1="13" x2="24" y2="9" stroke="#FF9040" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="17" y1="21" x2="14" y2="18" stroke="#FF9040" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="31" y1="21" x2="34" y2="18" stroke="#FF9040" strokeWidth="2.5" strokeLinecap="round"/>
            <polyline points="17,35 24,42 31,35" stroke="#FF9040" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="solar-time">{formatTime(sun.sunset)}</div>
        </div>
      </div>
    </div>
  );
});

export default SolarCycle;
