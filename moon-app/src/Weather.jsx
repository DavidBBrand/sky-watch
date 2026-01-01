import './Weather.css'

import React, { useState, useEffect } from 'react';

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/weather')
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(data => {
        if (data.error) {
          setError(true);
        } else {
          setWeather(data);
        }
      })
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, []);

  // 1. If there's an error, show this instead of crashing
  if (error) return <p style={{ color: '#ff4444' }}>Weather currently unavailable</p>;

  // 2. While waiting for Python, show nothing or a loader
  if (!weather) return <p style={{ color: '#555' }}>Loading sky data...</p>;

  // 3. Only if weather is NOT null, render the UI
  return (
    <div style={{
      padding: '20px',
      borderRadius: '20px',
      background: 'linear-gradient(145deg, #181010ff, #000)',
      border: '1px solid #bc8d17ff',
      textAlign: 'center',
      marginTop: '20px',
      minWidth: '220px'
    }}>
      <p style={{ color: '#888', fontSize: '0.7rem', letterSpacing: '2px', margin: '0' }}>LOCAL WEATHER</p>
      <h1 style={{ color: '#fff', fontSize: '3.5rem', margin: '10px 0', fontWeight: '200' }}>
        {weather.temp}°F
      </h1>
      <p style={{ color: '#fefcd7', fontSize: '1.1rem', margin: '0', fontWeight: 'bold' }}>
        {weather.description}
      </p>
      <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '10px' }}>
        Wind: {weather.windspeed} mph
      </div>
    </div>
  );
};

export default Weather;