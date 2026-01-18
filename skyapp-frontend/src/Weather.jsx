import "./Weather.css";
import React, { useState, useEffect } from "react";

// 1. Accept onDataReceived from App.jsx
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
          // 2. Send the data back up to App.jsx so the header can see it
          if (onDataReceived) {
            onDataReceived(data);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });
    // 3. Add onDataReceived to the dependency array
  }, [lat, lon, onDataReceived]);

  if (error)
    return (
      <div className="weather-card" style={{ color: "#992323ff" }}>
        Weather currently unavailable
      </div>
    );

  // Find this part in your file:
  if (!weather)
    return (
      <div
        className="weather-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div className="weather-loader"></div>
        <p className="loading-text">Synchronizing Weather...</p>
      </div>
    );

  return (
    <div className="weather-card">
      <p
        style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--text-sub)"
        }}
      >
        Current Weather
      </p>

      <h2
        style={{
          fontSize: "4rem",
          margin: "10px 0",
          color: "var(--text-main)",
          fontWeight: "200"
        }}
      >
        {weather.temp}°F
      </h2>

      <p
        style={{
          fontSize: "1.2rem",
          fontWeight: "500",
          color: "var(--text-main)"
        }}
      >
        {weather.description}
      </p>

      <div
        style={{
          marginTop: "15px",
          fontSize: "1.0rem",
          color: "var(--text-sub)"
        }}
      >
        Wind: {weather.windspeed} mph
      </div>
    </div>
  );
};

export default Weather;
