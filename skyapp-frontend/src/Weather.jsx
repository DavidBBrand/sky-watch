import "./Weather.css";
import React, { useState, useEffect, useRef } from "react";
import WindMap from "./WindMap";

const Weather = ({ lat, lon, sun, onDataReceived }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);
  const onDataReceivedRef = useRef(onDataReceived);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  useEffect(() => {
    let isMounted = true;
    setWeather(null);
    setError(false);

    fetch(`http://127.0.0.1:8000/weather?lat=${lat}&lon=${lon}`)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((weatherData) => {
        if (!isMounted) return;
        if (weatherData.error) {
          setError(true);
        } else {
          setWeather(weatherData);
          if (onDataReceivedRef.current) onDataReceivedRef.current(weatherData);
        }
      })
      .catch((err) => {
        if (isMounted) setError(true);
      });
      
    return () => { isMounted = false; };
  }, [lat, lon]);

  const getWeatherIcon = (description) => {
    if (!description) return "🌡️";
    const desc = description.toLowerCase();
    const now = new Date();
    const sunriseTime = sun?.sunrise ? new Date(sun.sunrise) : null;
    const sunsetTime = sun?.sunset ? new Date(sun.sunset) : null;

    let isDaylight = (sunriseTime && sunsetTime) 
      ? (now >= sunriseTime && now <= sunsetTime) 
      : (now.getHours() >= 6 && now.getHours() < 18);

    if (desc.includes("clear")) return isDaylight ? "☀️" : "🌙";
    if (desc.includes("thunderstorm")) return "⛈️";
    if (desc.includes("drizzle") || desc.includes("rain")) return "🌧️";
    if (desc.includes("snow")) return "❄️";
    if (desc.includes("clouds")) return desc.includes("few") || desc.includes("scattered") ? "🌤️" : "☁️";
    return "🌡️";
  };

  if (error) return (
    <div className="glass-card error-msg">
      Weather currently unavailable
    </div>
  );

  return (
    <div className="weather-container">
      <h2 className="weather-header">
        {weather ? "Current Weather" : "Live Weather"}
      </h2>

      <div className={`weather-icon ${!weather ? "weather-loading-pulse" : ""}`}>
        {weather ? getWeatherIcon(weather.description) : "☀️"}
      </div>

      <h4 className="weather-temp">
        {weather ? `${Math.round(weather.temp)}°F` : "--°F"}
      </h4>
      
      <p className="weather-desc">
        {weather ? weather.description : "Synchronizing..."}
      </p>
      <div className="separator-line" />
      {weather && (
        <>
        <div className="weather-details-grid">
          <div className="detail-item">
            <span className="label">Humidity</span>
            <span className="value">{weather.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="label">Pressure</span>
            <span className="value">{weather.pressure} hPa</span>
          </div>
          <div className="detail-item">
            <span className="label">Visibility</span>
            <span className="value">{(weather.visibility / 1000).toFixed(1)} km</span>
          </div>
          <div className="detail-item">
            <span className="label">Wind</span>
            <span className="value">{weather.windspeed} mph</span>
          </div>
        </div>
        
        <div className="separator-line" />
          <WindMap lat={lat} lon={lon} />
    
        </>
      )}
    </div>
  );
};

export default Weather;
