import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherMap.css";

// 1. Interface for the Recenter helper
interface MapCoords {
  lat: number;
  lon: number;
}

const RecenterMap: React.FC<MapCoords> = ({ lat, lon }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);
  
  return null;
};

// 2. Interface for the Main WeatherMap
interface WeatherMapProps {
  lat: number;
  lon: number;
  theme: "day" | "night";
}

const WeatherMap: React.FC<WeatherMapProps> = ({ lat, lon, theme }) => {
  // 3. Type-safe access to your OpenWeather Wind/Map key
  const OPENWEATHER_API_KEY = (import.meta.env.VITE_WIND_MAP_KEY as string) || "";
  const isNight = theme === "night";

  // Refined Tile URLs: Light Voyager for Day, Dark Matter for Night
  const baseTileUrl = isNight 
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png";

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
        {/* Base Layer */}
        <TileLayer url={baseTileUrl} />        
        
        {/* Weather/Cloud Layer */}
        <TileLayer url={cloudsUrl} />
        
        <RecenterMap lat={lat} lon={lon} />
      </MapContainer>
      
      <div className="map-overlay-scan" />
    </div>
  );
};

export default WeatherMap;

