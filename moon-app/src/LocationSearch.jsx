import React, { useState } from 'react';

const LocationSearch = ({ onLocationChange }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) - No API Key Required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'SkyDashboard/1.0' // Identifies your app to OSM
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        //split the address into an array of parts
        const parts = display_name.split(',');
        const shortName = parts.length > 2 
          ? `${parts[0].trim()}, ${parts[parts.length - 3].trim()}, ${parts[parts.length - 1].trim()}`
          : display_name;
        onLocationChange({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          name: shortName // Just the city name
        });
        setQuery(''); // Clear search after success
      } else {
        alert("Location not found. Please try a different city.");
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const useGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      onLocationChange({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        name: "Current Location"
      });
    });
  };

  return (
    <div className="location-container" style={{ 
      display: 'flex', 
      gap: '10px', 
      justifyContent: 'center', 
      marginBottom: '30px' 
    }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search City..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="theme-toggle-btn" // Reusing your existing glass styles
          style={{
            width: '200px',
            padding: '10px 15px',
            textAlign: 'left',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
        <button 
          type="submit" 
          className="theme-toggle-btn"
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? "..." : "🔍"}
        </button>
      </form>

      <button 
        onClick={useGPS} 
        className="theme-toggle-btn"
        title="Use GPS"
        style={{ padding: '10px 15px' }}
      >
        📍
      </button>
    </div>
  );
};

export default LocationSearch;