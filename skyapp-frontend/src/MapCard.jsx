import React, { useState, useEffect } from "react"; // Added hooks
import "./MapCard.css";
import SolarCycle from "./SolarCycle";

const MapCard = ({ lat, lon, theme, skyData, location }) => {
  // console.log("PROPS CHECK:", { location, skyData }); // Debugging line to check received props
  // 1. Pass skyData in as a prop
  const MAPBOX_TOKEN =
    "pk.eyJ1IjoiZGF2aWRiNTY3OCIsImEiOiJjbGxncHFqcWoweHV3M3JxaGxna2FqNHZmIn0.A4Yc2EE-9W2yKvn1C6S9TQ";

  const zoom = 12;
  const darkStyle = "dark-v11";
  const lightStyle = "light-v11";
  const currentStyle = theme === "night" ? darkStyle : lightStyle;

  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/${currentStyle}/static/pin-s+ff4444(${lon},${lat})/${lon},${lat},${zoom},0/600x400@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    
      <div>
        <h1 className="map-card-title"> {location?.name}</h1>

        <SolarCycle sun={skyData?.sun} />

        <img
          src={mapUrl}
          alt="Regional Telemetry Map"
          key={currentStyle}
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
