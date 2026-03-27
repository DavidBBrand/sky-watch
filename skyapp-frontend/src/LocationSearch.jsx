import React, { useState, memo } from "react";

// Using memo so typing in the search box doesn't get interrupted
// by other dashboard updates
const LocationSearch = memo(({ onLocationChange }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Inside LocationSearch.jsx
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);

    // Create a controller for this specific search
    const controller = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
          headers: {
            // Identify yourself (Essential for CORS/Rate-limiting)
            "User-Agent": `SkyWatch/1.0 (${import.meta.env.VITE_NOMINATIM_EMAIL || "anonymous"})`
          }
        }
      );

      if (response.status === 425 || response.status === 429) {
        alert("Search is temporarily throttled. Please wait a few seconds.");
        return;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        // Success logic...
        onLocationChange({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          name: display_name.split(",")[0]
        });
        setQuery("");
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Search request cancelled.");
      } else {
        console.error("Search error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const useGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        //  start with a fallback, but don't SEND it yet
        let detectedName = "Current Location";

        try {
          //  wait for the "Reverse Geocode" fetch to finish
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                "User-Agent": `SkyWatch/1.0 (${import.meta.env.VITE_NOMINATIM_EMAIL || "anonymous"})`
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const a = data.address;
            // Check for specific name, otherwise keep "Current Location"
            detectedName =
              a.city || a.town || a.village || a.suburb || "Current Location";
          }
        } catch (err) {
          console.error("Geocoding failed, using fallback.", err);
        } finally {
          // Only call the update ONCE everything above is done
          onLocationChange({
            lat: latitude,
            lon: longitude,
            name: detectedName
          });
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    ); 
  };
  return (
    <div className="search-wrapper">
      <form
        onSubmit={handleSearch}
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <input
          type="text"
          placeholder={loading ? "LOCATING..." : "Search location..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input-field" 
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
          inputMode="search"
          style={{
            cursor: loading ? "wait" : "text",
            opacity: loading ? 0.7 : 1,
            fontFamily: 'Roboto Condensed', 
            
          }}
        />

        {/* <button
          type="button"
          onClick={useGPS}
          className="gps-action-btn" 
          disabled={loading}
          title="Use My Location"
        >
          <span style={{ fontSize: "1.1rem" }}>📍</span>
        </button> */}
      </form>
    </div>
  );
});

export default LocationSearch;
