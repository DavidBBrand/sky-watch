import type { FC } from 'react';
import "./SolarCompass.css";

interface SolarTelemetry {
  current_altitude?: number;
  phase?: string | number;
}

interface CompassProps {
  sunData: SolarTelemetry;
}

const SolarCompass: FC<CompassProps> = ({ sunData }) => {
  //  Use optional chaining and nullish coalescing to prevent undefined
  const current_altitude = sunData?.current_altitude ?? 0;
  const phase = sunData?.phase ?? "Standard";
  
  //  Now current_altitude is guaranteed to be a number (even if 0)
  const verticalPosition = 50 - (current_altitude / 90) * 45;

  const getSunColor = () => {
    if (phase === "Golden Hour") return "#ff9d00";
    if (phase === "Blue Hour") return "#5b86e5";
    if (current_altitude < 0) return "#2c3e50";
    return "#ffce00";
  };

  return (
    <div className="solar-compass-wrapper">
      <div className="solar-gauge-track">
        <div className="horizon-line" />
        <div 
          className="sun-indicator"
          style={{ 
            top: `${verticalPosition}%`,
            backgroundColor: getSunColor(),
            boxShadow: current_altitude > 0 ? `0 0 15px ${getSunColor()}` : 'none'
          }}
        />
      </div>

      <div className="altitude-readout">
        {/* 3. Safety first: check if altitude is a number before calling toFixed */}
        <span className="altitude-value">
          {typeof current_altitude === 'number' ? current_altitude.toFixed(1) : "0.0"}°
        </span>
      </div>
    </div>
  );
};

export default SolarCompass;