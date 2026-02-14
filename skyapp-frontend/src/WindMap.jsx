import React from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// This helper component handles auto-panning when you search for a new city
const RecenterMap = ({ lat, lon }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);
  return null;
};

const WindMap = ({ lat, lon }) => {
  // Use your OpenWeather API Key here
  const OPENWEATHER_API_KEY = import.meta.env.VITE_WIND_MAP_KEY;

  const windUrl = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;
  // Replace the darkBaseUrl with this:
  const baseMapUrl =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png";

  return (
    <div className="wind-map-wrapper">
      <MapContainer
        center={[lat, lon]}
        zoom={4}
        scrollWheelZoom={false}
        zoomControl={false} // Keeps the UI clean and "telemetry-like"
        attributionControl={false} // Removes the clunky bottom-right text
        style={{ height: "100%", width: "100%" }}
      >
        {/* Dark Base Map */}
        <TileLayer url={baseMapUrl} />

        {/* Wind Layer - Matches the Blue/Teal accent of a dashboard */}
        <TileLayer url={windUrl} opacity={0.7} />

        {/* Syncs map center when location changes */}
        <RecenterMap lat={lat} lon={lon} />

        {/* Custom Radar Scan Effect overlay (CSS handled) */}
        <div className="map-overlay-scan" />
      </MapContainer>
    </div>
  );
};

export default WindMap;
