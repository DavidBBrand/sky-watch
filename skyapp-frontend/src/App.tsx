import React, { useState, useEffect } from "react";
import { useLocation } from "./LocationContext";
import "./App.css";
import Weather from "./Weather";
import Planets from "./Planets";
import LocationSearch from "./LocationSearch";
import GoldenHour from "./GoldenHour";
import MapCard from "./MapCard";
import ISSWatcher from "./ISSWatcher";
import Starlink from "./Starlink";
import Moon from "./Moon";
import logoDay from "./assets/skywatchday.png";
import logoNight from "./assets/skywatch.png";

// 1. Define flexible interfaces for your API payloads
export interface SunData {
  sunrise?: string;
  sunset?: string;
  phase?: number | string;
  [key: string]: any; 
}

export interface SkyData {
  sun?: SunData;
  timezone?: string;
  planets?: Record<string, unknown>;
  [key: string]: any; // Allows Planets/MapCard to access other fields safely
}

export interface WeatherData {
  timezone?: string;
  [key: string]: any;
}

const App: React.FC = () => {
  const { location, updateLocation } = useLocation();
  const hour = new Date().getHours();
  
  // 2. Strongly type your state variables
  const [isNight, setIsNight] = useState<boolean>(hour < 6 || hour >= 20);
  const [skyData, setSkyData] = useState<SkyData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [issDistance, setIssDistance] = useState<number | null>(null);
  const [locationDate, setLocationDate] = useState<string>("");

  const currentLogo = isNight ? logoNight : logoDay;

  const getLocalSolarTime = () => {
    // TS enforces this check because location.lon can be null
    if (!location || location.lon === null) return { solar24: "--:--", solar12: "--:--" };
    
    const now = new Date();
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const solarOffset = location.lon / 15;
    let localSolarHours = (utcHours + solarOffset + 24) % 24;
    const h = Math.floor(localSolarHours);
    const m = Math.floor((localSolarHours - h) * 60);
    const minutes = m.toString().padStart(2, "0");

    const solar24 = `${h.toString().padStart(2, "0")}:${minutes}`;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const solar12 = `${h12}:${minutes} ${period}`;

    return { solar24, solar12 };
  };

  const getLiveLocalTime = () => {
    if (!weatherData || !weatherData.timezone) return "--:--";

    try {
      return new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: weatherData.timezone
      });
    } catch (e) {
      console.error("Local Time Error:", e);
      return "--:--";
    }
  };

  useEffect(() => {
    const targetTimeZone = weatherData?.timezone || "America/Chicago";
    try {
      const dateString = new Date()
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: targetTimeZone
        })
        .replace(/(\w+)/, "$1");
      setLocationDate(dateString);
    } catch (e) {
      console.error("Timezone Error:", e);
    }
  }, [location.lat, location.lon, weatherData?.timezone]);

  useEffect(() => {
    if (location.isInitial && skyData?.sun?.sunrise && skyData?.sun?.sunset) {
      const now = new Date();
      const sunrise = new Date(skyData.sun.sunrise);
      const sunset = new Date(skyData.sun.sunset);

      const nowMins = now.getHours() * 60 + now.getMinutes();
      const sunriseMins = sunrise.getHours() * 60 + sunrise.getMinutes();
      const sunsetMins = sunset.getHours() * 60 + sunset.getMinutes();

      const shouldBeNight = nowMins < sunriseMins || nowMins > sunsetMins;
      setIsNight(shouldBeNight);

      updateLocation({ ...location, isInitial: false } as typeof location);
    }
  }, [skyData, location, updateLocation]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isNight ? "night" : "day"
    );
  }, [isNight]);

  useEffect(() => {
    if (location.lat === null) return;

    const controller = new AbortController();
    const fetchSkyData = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(
          `${API_BASE_URL}/sky-summary?lat=${location.lat}&lon=${location.lon}`,
          { signal: controller.signal }
        );
        
        const data: SkyData = await response.json();
        setSkyData(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("FETCH ERROR:", err);
        }
      }
    };

    fetchSkyData();
    return () => controller.abort();
  }, [location.lat, location.lon]);

  // 3. Early Return Type Narrowing
  if (location.lat === null || location.lon === null) {
    return (
      <div className="loading-screen card-title">
        <div className="scanner"></div>
        <div>Loading...</div>
        <div>
          Please click <strong>'Allow'</strong> for location access
        </div>
      </div>
    );
  }

  // Below this line, TypeScript mathematically guarantees location.lat and location.lon are numbers!
  const { solar24, solar12 } = getLocalSolarTime();

  return (
    <div className="app-container">
      {location.isInitial && (
        <div className="system-status-bar">
          <span className="blink">●</span> Loading...
        </div>
      )}
      <button
        onClick={() => setIsNight(!isNight)}
        className="theme-toggle-btn"
        aria-label="Toggle day/night mode"
      >
        {isNight ? "🌙 Night Mode" : "☀️ Day Mode"}
      </button>

      <header className="header-section">
        <h1 className="main-title">SKY WATCH</h1>
        <h2 className="sub-title">Telemetry Dashboard</h2>

        <div
          className="logo-container"
          style={{ backgroundImage: `url(${currentLogo})` }}
        ></div>
        <div className="search-wrapper">
          <LocationSearch onLocationChange={updateLocation} />
        </div>

        <div className="telemetry-info">
          <span className="glow-sub"><span style={{ fontWeight: 600 }}>{location.name}</span>&nbsp;&nbsp;&nbsp;{locationDate}</span>
          <span className="glow-sub">
            {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"} /{" "}
            {Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? "E" : "W"}
          </span>
          <span className="time-display">
            Solar Time: {solar12}
          </span>
          <span className="glow-sub">
            UTC Offset: {location.lon >= 0 ? "+" : ""}
            {(location.lon / 15).toFixed(1)} HRS
          </span>
          <span className="time-display">
            Local Standard Time: {weatherData ? getLiveLocalTime() : "--:--"}
          </span>
          {skyData?.sun?.phase && <GoldenHour sunData={skyData.sun} />}
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="glass-card">
          <Moon date={locationDate} />
        </div>
        <div className="glass-card">
          <Weather
            onDataReceived={setWeatherData}
            theme={isNight ? "night" : "day"}
          />
        </div>
        <div
          className={`glass-card ${
            issDistance !== null && issDistance < 500 ? "proximity-alert-active" : ""
          }`}
        >
          <ISSWatcher onDistanceUpdate={setIssDistance} />
        </div>
        <div className="glass-card">
          <Starlink theme={isNight ? "night" : "day"} />
        </div>
        <div className="glass-card">
          <MapCard
            theme={isNight ? "night" : "day"}
            skyData={skyData}
            date={locationDate}
          />
        </div>
        <div className="glass-card">
          {skyData ? (
            <Planets skyData={skyData} />
          ) : (
            <div className="loading-card glow-sub2">
              <div>Syncing with {location.name}...</div>
            </div>
          )}
        </div>
      </div>
      <p className="copyright glow-sub2"> © 2026 David Brand</p>
    </div>
  );
};

export default App;


