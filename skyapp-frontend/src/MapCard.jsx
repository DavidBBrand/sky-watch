import React, { useState, useEffect } from "react"; // Added hooks
import "./MapCard.css";
import SolarCycle from "./SolarCycle";

const MapCard = ({ lat, lon, theme, skyData, location, date }) => {
  // console.log("PROPS CHECK:", { location, skyData }); // Debugging line to check received props
  // 1. Pass skyData in as a prop
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  const zoom = 12;
  const darkStyle = "dark-v11";
  const lightStyle = "light-v11";
  const currentStyle = theme === "night" ? darkStyle : lightStyle;
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/${currentStyle}/static/pin-s+ff4444(${lon},${lat})/${lon},${lat},${zoom},0/600x400@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <div>
      <h2 className="card-title"> {location?.name || "Initializing..."}</h2>
      {/* 1. Reserve the space for SolarCycle */}
      <div
        style={{
          minHeight: "120px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {skyData?.sun ? (
          <SolarCycle sun={skyData.sun} date={date} />
        ) : (
          <div className="solar-loader">
            <div className="scanning-line"></div>
            <p
              style={{
                fontSize: "0.7rem",
                letterSpacing: "3px",
                color: "var(--text-sub)",
                opacity: 0.5
              }}
            >
              CALCULATING SOLAR ARC...
            </p>
          </div>
        )}
      </div>
      

      <img
        src={mapUrl}
        alt="Regional Telemetry Map"
        key={currentStyle}
        style={{
          width: "100%",
          borderRadius: "12px",
          display: "block",
          transition: "opacity 0.5s ease",
          marginTop: "20px"
        }}
      />
    </div>
  );
};

export default MapCard;
