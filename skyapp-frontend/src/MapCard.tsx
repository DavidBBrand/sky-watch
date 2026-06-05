import React, { memo } from "react";
import { useLocation } from "./LocationContext"; // Use context
import "./MapCard.css";
import SolarCycle from "./SolarCycle";

interface MapCardProps {
  theme: "day" | "night";
  skyData: {
    sun?: {
      sunrise?: string;
      sunset?: string;
      zenith?: string;
      zenith_alt?: number | string;
      zenith_az?: number | string;
      current_altitude?: number;
      phase?: string | number;
    };
    timezone?: string;
  } | null;
  date: string;
}

// const MapCard = memo(({ theme, skyData, date }) => {
const MapCard: React.FC<MapCardProps> = memo(({ theme, skyData, date }) => {
  // Pull location from Context
  const { location } = useLocation();
  const { lat, lon } = location;

  const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || "";

  const zoom = 12;
  const darkStyle = "dark-v11";
  const lightStyle = "light-v11";
  const currentStyle = theme === "night" ? darkStyle : lightStyle;

  
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/${currentStyle}/static/pin-s+ff4444(${lon},${lat})/${lon},${lat},${zoom},0/600x400@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <div className="map-card-content">  
      <div
        style={{
          minHeight: "120px",
          display: "grid",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div className="card-title">Solar Arc {date}</div>
        {skyData?.sun ? (
          <SolarCycle sun={skyData.sun} timezone={location.timezone} />
        ) : (
          <div className="solar-loader">
            <div className="scanning-line"></div>
            <div
              style={{
                fontSize: "1.4rem",
                fontFamily: "Times New Roman"

              }}
            >
              Calculating Solar Arc...
            </div>
          </div>
        )}
      </div>
      <div className="map-holder">

        <img
          src={mapUrl}
          alt="Regional Telemetry Map"
          key={currentStyle} 
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "2rem",
            display: "block",
            transition: "opacity 0.5s ease",
            border: "0px solid var(--separator-glow2)",
            }}
          // loading="eager"
        />
      </div>
    </div>
  );
});

export default MapCard;
