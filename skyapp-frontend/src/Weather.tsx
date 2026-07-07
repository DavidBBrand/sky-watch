import "./Weather.css";
import React, { useState, useEffect, useRef, memo } from "react";
import { useLocation } from "./LocationContext"; 
import WeatherMap from "./WeatherMap";

// 1. Define the shape of the Weather data from your API
interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  pressure: number;
  visibility: number;
  windspeed: number;
  timezone?: string;
  error?: boolean;
}

// 2. Define the Component Props
interface WeatherProps {
  onDataReceived: (data: WeatherData) => void;
  theme: "day" | "night";
}

const Weather: React.FC<WeatherProps> = memo(({ onDataReceived, theme }) => {
  const { location } = useLocation();
  const { lat, lon } = location;

  // 3. State is now strictly typed
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<boolean>(false);
  
  // Type the ref to match the onDataReceived function signature
  const onDataReceivedRef = useRef<(data: WeatherData) => void>(onDataReceived);

  useEffect(() => {
    onDataReceivedRef.current = onDataReceived;
  }, [onDataReceived]);

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = () => {
      const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";

      fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`)
        .then((res) => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
        })
        .then((weatherData: WeatherData) => {
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
        .catch(() => {
          if (isMounted) setError(true);
        });
    };

    setWeather(null);
    setError(false);
    fetchWeather();

    const weatherInterval = setInterval(fetchWeather, 120000); // 2-minute polling

    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
    };
  }, [lat, lon]);

  const getWeatherIcon = (description: string): string => {
    if (!description) return "🌡️";
    const desc = description.toLowerCase();
    
    const isDaylight =
      theme === "day" ||
      (new Date().getHours() >= 6 && new Date().getHours() < 19);

    if (desc.includes("clear") || desc.includes("sunny")) {
      return isDaylight ? "☀️" : "🌙";
    }

    if (
      desc.includes("clouds") ||
      desc.includes("partly") ||
      desc.includes("overcast")
    ) {
      if (
        isDaylight &&
        (desc.includes("few") ||
          desc.includes("scattered") ||
          desc.includes("partly"))
      ) {
        return "🌤️";
      }
      return "☁️";
    }

    if (desc.includes("thunderstorm") || desc.includes("storm")) return "⛈️";
    if (desc.includes("drizzle") || desc.includes("rain")) return "🌧️";
    if (desc.includes("snow")) return "❄️";

    if (desc.includes("mist") || desc.includes("fog") || desc.includes("haze"))
      return "🌫️";

    return isDaylight ? "☀️" : "🌙";
  };

  if (error)
    return (
      <div className="glow-sub2 error-msg">Weather currently unavailable</div>
    );

  return (
    <div className="weather-container">
      <div className="card-header-block">
        <div className="card-title">Weather</div>
        <div className="glow-sub card-subtitle">
          {location.name || "Live Weather"}
        </div>
      </div>

      <div
        className={`weather-icon ${!weather ? "weather-loading-pulse" : ""}`}
      >
        {weather ? getWeatherIcon(weather.description) : "☀️"}
      </div>

      <h4 className="weather-temp card-title">
        {weather ? `${Math.round(weather.temp)}°F` : "--°F"}
      </h4>

      <p className="weather-desc card-title">
        {weather ? weather.description : "Fetching Weather..."}
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
                {weather.visibility} mi
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Wind</span>
              <span className="value glow-sub2">{weather.windspeed}mph</span>
            </div>
          </div>

          <div className="separator-line" />
          {lat !== null && lon !== null && (
            <WeatherMap lat={lat} lon={lon} theme={theme} />
          )}
        </>
      )}
    </div>
  );
});

export default Weather;
