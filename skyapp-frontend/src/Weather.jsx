import "./Weather.css";
import React, { useState, useEffect } from "react";

const Weather = ({ lat, lon, onDataReceived }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setWeather(null);
    setError(false);

    fetch(`http://127.0.0.1:8000/weather?lat=${lat}&lon=${lon}`)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(true);
        } else {
          setWeather(data);
          if (onDataReceived) {
            onDataReceived(data);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [lat, lon, onDataReceived]);

  const getWeatherEmoji = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes("thunderstorm")) return "⛈️";
    if (desc.includes("drizzle") || desc.includes("rain")) return "🌧️";
    if (desc.includes("snow")) return "❄️";
    if (desc.includes("clear")) return "☀️";
    if (desc.includes("clouds")) {
      if (desc.includes("few") || desc.includes("scattered")) return "🌤️";
      return "☁️";
    }
    if (desc.includes("mist") || desc.includes("fog") || desc.includes("haze"))
      return "🌫️";
    return "🌡️"; 
  };

  // Immediate placeholder based on current hour to prevent visual pop-in
  const placeholderEmoji = new Date().getHours() > 18 || new Date().getHours() < 6 ? "🌙" : "☀️";

  if (error)
    return (
      <div className="weather-card" style={{ color: "#992323ff" }}>
        Weather currently unavailable
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2
        style={{
          fontSize: "1.2rem",
          textTransform: "uppercase",
          letterSpacing: "3px",
          color: "var(--text-main)",
          fontWeight: "600",
          margin: "20px 0 10px"
        }}
      >
        {weather ? "Current Weather" : "Live Weather"}
      </h2>
      <div 
        className={!weather ? "weather-loading-pulse" : ""} 
        style={{ fontSize: "6rem", lineHeight: "1", margin: "20px 10px 10px 10px" }}
      >
        {weather ? getWeatherEmoji(weather.description) : placeholderEmoji}
      </div>

      <h4 style={{ fontSize: "1.8rem", fontWeight: "400", margin: "16px" }}>
        {weather ? `${weather.temp}°F` : "--°F"}
      </h4>
      <p
        style={{
          fontSize: "1.2rem",
          fontWeight: "500",
          color: "var(--text-sub)",
          margin: "5px 0"
        }}
      >
        {weather ? weather.description : "Synchronizing..."}
      </p>

      <div
        style={{
          marginTop: "1.2rem",
          fontSize: "1.5rem",
          color: "var(--text-main)"
        }}
      >
        Wind: {weather ? `${weather.windspeed} mph` : "-- mph"}
      </div>
    </div>
  );
};

export default Weather;
