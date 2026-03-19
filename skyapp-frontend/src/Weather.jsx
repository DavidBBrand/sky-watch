import "./Weather.css";
import React, { useState, useEffect, useRef, memo } from "react";
import { useLocation } from "./LocationContext.jsx";
import WeatherMap from "./WeatherMap.jsx";

const Weather = memo(({ sun, onDataReceived, theme }) => {
  // 1. Grab location from Context
  const { location } = useLocation();
  const { lat, lon } = location;

  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);
  const onDataReceivedRef = useRef(onDataReceived);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = () => {
      // 1. Establish the API base URL
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

      // 2. Use the dynamic URL
      fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`)
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
            setError(false);
            if (onDataReceivedRef.current)
              onDataReceivedRef.current(weatherData);
          }
        })
        .catch((err) => {
          if (isMounted) setError(true);
        });
    };

    setWeather(null);
    setError(false);
    fetchWeather();

    const weatherInterval = setInterval(fetchWeather, 120000);

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

    let isDaylight =
      sunriseTime && sunsetTime
        ? now >= sunriseTime && now <= sunsetTime
        : now.getHours() >= 6 && now.getHours() < 18;

    if (desc.includes("clear")) return isDaylight ? "☀️" : "🌙";
    if (desc.includes("thunderstorm")) return "⛈️";
    if (desc.includes("drizzle") || desc.includes("rain")) return "🌧️";
    if (desc.includes("snow")) return "❄️";
    if (desc.includes("clouds"))
      return desc.includes("few") || desc.includes("scattered") ? "🌤️" : "☁️";
    return "🌡️";
  };

  if (error)
    return (
      <div className=" glow-sub2 error-msg">Weather currently unavailable</div>
    );

  return (
    <div className="weather-container">
      <h2 className="card-title">
        {location.name ? `${location.name} Weather` : "Live Weather"}
      </h2>

      <div
        className={`weather-icon ${!weather ? "weather-loading-pulse" : ""}`}
      >
        {weather ? getWeatherIcon(weather.description) : "☀️"}
      </div>

      <h4 className="weather-temp glow-sub">
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
              <span className="value glow-sub2">{weather.pressure} inHg</span>
            </div>
            <div className="detail-item">
              <span className="label">Visibility</span>
              <span className="value glow-sub2">
                {/* If using US units from Visual Crossing, visibility is already in Miles */}
                {weather.visibility} mi
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Wind</span>
              <span className="value glow-sub2">{weather.windspeed}mph</span>
            </div>
          </div>

          <div className="separator-line" />
          {/* Note: WeatherMap still needs coords and theme to redraw properly */}
          <WeatherMap lat={lat} lon={lon} theme={theme} />
        </>
      )}
    </div>
  );
});

export default Weather;
