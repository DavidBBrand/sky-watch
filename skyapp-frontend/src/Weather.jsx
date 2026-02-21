import "./Weather.css";
import React, { useState, useEffect, useRef } from "react";
import WindMap from "./WindMap";

const Weather = ({ lat, lon, sun, onDataReceived, theme }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);
  const onDataReceivedRef = useRef(onDataReceived);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

useEffect(() => {
    let isMounted = true;

    const fetchWeather = () => {
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
            setError(false); // Clear error if fetch succeeds
            if (onDataReceivedRef.current) onDataReceivedRef.current(weatherData);
          }
        })
        .catch((err) => {
          if (isMounted) setError(true);
        });
    };

    // 1. Initial Reset & Fetch
    setWeather(null);
    setError(false);
    fetchWeather();

    // 2. Set Interval (120,000ms = 2 minutes)
    const weatherInterval = setInterval(fetchWeather, 120000);

    // 3. Cleanup
    return () => { 
      isMounted = false; 
      clearInterval(weatherInterval); 
    };
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
      <h2 className="card-title">
        {weather ? "Current Weather" : "Live Weather"}
      </h2>

      <div className={`weather-icon ${!weather ? "weather-loading-pulse" : ""}`}>
        {weather ? getWeatherIcon(weather.description) : "☀️"}
      </div>

      <h4 className="weather-temp glow-sub2">
        {weather ? `${Math.round(weather.temp)}°F` : "--°F"}
      </h4>
      
      <p className="weather-desc glow-sub">
        {weather ? weather.description : "Synchronizing..."}
      </p>
      <div className="separator-line" />
      {weather && (
        <>
        <div className="weather-details-grid">
          <div className="detail-item">
            <span className="label">Humidity</span>
            <span className="value glow-sub2">{weather.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="label">Pressure</span>
            <span className="value glow-sub2">{weather.pressure} hPa</span>
          </div>
          <div className="detail-item">
            <span className="label">Visibility</span>
            <span className="value glow-sub2">{(weather.visibility / 1000).toFixed(1)} km</span>
          </div>
          <div className="detail-item">
            <span className="label">Wind</span>
            <span className="value glow-sub2">{weather.windspeed} mph</span>
          </div>
        </div>
        
        <div className="separator-line" />
          <WindMap lat={lat} lon={lon} theme={theme} />
    
        </>
      )}
    </div>
  );
};

export default Weather;
