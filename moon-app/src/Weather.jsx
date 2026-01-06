import "./Weather.css";
import React, { useState, useEffect } from "react";

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/weather")
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(true);
        } else {
          setWeather(data);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  // Error State - kept simple but themed
  if (error)
    return <div className="weather-card" style={{ color: "#992323ff" }}>Weather currently unavailable</div>;

  // Loading State - uses theme colors
  if (!weather) 
    return <div className="weather-card" style={{ color: "var(--text-sub)" }}>Loading sky data...</div>;

  return (
    <div className="weather-card">
      <p
        style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--text-sub)" // Dynamic color
        }}
      >
        Current Weather
      </p>
      
      <h2 style={{ 
        fontSize: "5rem", 
        margin: "10px 0", 
        color: "var(--text-main)", 
        fontWeight: "200" 
      }}>
        {weather.temp}°F
      </h2>
      
      <p style={{ 
        fontSize: "1.1rem", 
        fontWeight: "500", 
        color: "var(--text-main)" 
      }}>
        {weather.description}
      </p>
      
      <div style={{ 
        marginTop: "15px", 
        fontSize: "0.9rem", 
        color: "var(--text-sub)" 
      }}>
        Wind: {weather.windspeed} mph
      </div>
    </div>
  );
};

export default Weather;