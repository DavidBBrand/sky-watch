import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherMap.css";

// Interface for the Recenter helper
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

// Interface for the Main WeatherMap
interface WeatherMapProps {
  lat: number;
  lon: number;
  theme: "day" | "night";
}

const WeatherMap: React.FC<WeatherMapProps> = ({ lat, lon, theme }) => {
  //  Type-safe access to your OpenWeather Wind/Map key
  const OPENWEATHER_API_KEY = (import.meta.env.VITE_WIND_MAP_KEY as string) || "";
  const STADIA_API_KEY = (import.meta.env.VITE_STADIA_API_KEY as string) || "";
  const isNight = theme === "night";

  const stadiaBase = isNight
    ? "alidade_smooth_dark"
    : "alidade_smooth";
  const baseTileUrl = `https://tiles.stadiamaps.com/tiles/${stadiaBase}/{z}/{x}/{y}{r}.png?api_key=${STADIA_API_KEY}`;

  const cloudsUrl = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;

  return (
    <div className={`weather-map-wrapper ${isNight ? "mode-night" : "mode-day"}`}>
      <MapContainer
        // key={`${theme}-${lat}-${lon}`} 
        center={[lat, lon]}
        zoom={5}
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
        <TileLayer
          url={baseTileUrl}
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {/* Weather/Cloud Layer */}
        <TileLayer url={cloudsUrl} />
        
        <RecenterMap lat={lat} lon={lon} />
      </MapContainer>
      
    </div>
  );
};

export default WeatherMap;

