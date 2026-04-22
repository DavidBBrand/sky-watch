import React, { createContext, useState, useContext, useEffect } from "react";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    lat: null,
    lon: null,
    name: "Locating...",
    timezone: null,
    isInitial: true
  });
  // Helper to fetch timezone from coordinates
  const fetchTimezone = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://timeapi.io/api/Timezone/coordinate?latitude=${lat}&longitude=${lon}`
      );
      const data = await response.json();
      return data.timeZone || "UTC";
    } catch (error) {
      console.error("Timezone fetch failed:", error);
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  };

  // Restored the missing updateLocation function
  const updateLocation = async (newLoc) => {
    // If the new location doesn't have a timezone, fetch it
    const tz = await fetchTimezone(newLoc.lat, newLoc.lon);
    setLocation({
      ...newLoc,
      timezone: tz,
      isInitial: false // User manually searched, so we aren't "initial" anymore
    });
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Fetch both Name and Timezone in parallel for speed
            const [geoRes, tz] = await Promise.all([
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              ),
              fetchTimezone(latitude, longitude)
            ]);

            const geoData = await geoRes.json();
            const cityName =
              geoData.address.city ||
              geoData.address.town ||
              geoData.address.village ||
              "Current Location";
            const stateName =
              geoData.address.state || geoData.address.country || "";

            setLocation({
              lat: latitude,
              lon: longitude,
              name: `${cityName}${stateName ? ", " + stateName : ""}`,
              timezone: tz,
              isInitial: false // Acquisition complete
            });
          } catch (error) {
            console.error("Location initialization failed:", error);
            setLocation((prev) => ({ ...prev, isInitial: false }));
          }
        },
        (error) => {
          console.warn("Geolocation denied. Reverting to Default Telemetry.");
          setLocation({
            lat: 35.9251,
            lon: -86.8689,
            name: "Franklin, TN", // Or call it "Base Station"
            timezone: "America/Chicago",
            isInitial: false // This tells the UI to stop showing the "Locating..." message
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // Geolocation not supported by browser
      setLocation((prev) => ({ ...prev, isInitial: false }));
    }
  }, []);

  return (
    // This value object MUST contain the functions defined above
    <LocationContext.Provider value={{ location, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
