import React from "react";
import "./MapCard.css";
const MapCard = ({ lat, lon, theme }) => {
  const MAPBOX_TOKEN = "pk.eyJ1IjoiZGF2aWRiNTY3OCIsImEiOiJjbGxncHFqcWoweHV3M3JxaGxna2FqNHZmIn0.A4Yc2EE-9W2yKvn1C6S9TQ";

  // 1. Map Constants (Defining these FIRST is critical)
  const zoom = 12;
  const darkStyle = "dark-v11";
  const lightStyle = "light-v11";

  // 2. Logic to match your App.jsx theme strings
  // If theme is "night", use dark. Otherwise (day), use light.
  const currentStyle = theme === "night" ? darkStyle : lightStyle;

  // 3. The Static API URL
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/${currentStyle}/static/pin-s+ff4444(${lon},${lat})/${lon},${lat},${zoom},0/600x400@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <div className="map-card" style={{ 
      background: "var(--card-bg)", 
      border: "1px solid var(--card-border)",
      padding: "10px",
      borderRadius: "15px",
      backdropFilter: "blur(10px)",
      transition: "background 0.8s ease" // Matches your index.css transition speed
    }}>
      <img
        src={mapUrl}
        alt="Regional Telemetry Map"
        key={currentStyle} // FORCE React to re-render the image when the style changes
        style={{ 
          width: "100%", 
          borderRadius: "8px",
          display: "block",
          transition: "opacity 0.5s ease"
        }}
      />
    </div>
  );
};

export default MapCard;