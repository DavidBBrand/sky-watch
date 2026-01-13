import "./Weather.css";
import React, { useState, useEffect } from "react";

const Weather = ({ lat, lon }) => {
  // 1. Accept props from App.jsx
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 2. Set weather to null to trigger a "Loading" state when coordinates change
    setWeather(null);
    setError(false);

    // 3. Dynamic URL using template literals
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
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [lat, lon]); // 4. This is the "Listener" that triggers the update

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
          fontSize: "5rem",
          margin: "10px 0",
          color: "var(--text-main)",
          fontWeight: "200"
        }}
      >
        {weather.temp}°F
      </h2>

      <p
        style={{
          fontSize: "1.1rem",
          fontWeight: "500",
          color: "var(--text-main)"
        }}
      >
        {weather.description}
      </p>

      <div
        style={{
          marginTop: "15px",
          fontSize: "0.9rem",
          color: "var(--text-sub)"
        }}
      >
        Wind: {weather.windspeed} mph
      </div>
    </div>
  );
};

export default Weather;
