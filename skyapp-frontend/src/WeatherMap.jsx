import React from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherMap.css";

const RecenterMap = ({ lat, lon }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);
  return null;
};

const WeatherMap = ({ lat, lon, theme }) => {
  const OPENWEATHER_API_KEY = import.meta.env.VITE_WIND_MAP_KEY;
  const isNight = theme === "night";

const baseTileUrl = isNight 
  ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png" 
  : "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";; 

  const cloudsUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;

  return (
    <div className={`weather-map-wrapper ${isNight ? "mode-night" : "mode-day"}`}>
      <MapContainer
        key={`${theme}-${lat}-${lon}`} 
        center={[lat, lon]}
        zoom={4}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}      
      >
        {/* Land */}
        <TileLayer url={baseTileUrl} />        
        {/* Clouds */}
        <TileLayer 
          url={cloudsUrl} 
        />
        <RecenterMap lat={lat} lon={lon} />
      </MapContainer>
      <div className="map-overlay-scan" />
    </div>
  );
};

export default WeatherMap;