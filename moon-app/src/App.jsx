import { useState, useEffect } from "react"; // Added useEffect
import "./App.css";
import MoonTracker from "./MoonTracker.jsx";
import Weather from "./Weather.jsx";
import SkyDetails from "./SkyDetails.jsx";

function App() {
  const [skyData, setSkyData] = useState(null);

  const locationName = "Franklin, TN"; // Hardcoded for now
  const coordinates = { lat: 35.9251, lon: -86.8689 }; // Hardcoded for now

  useEffect(() => {
    console.log("Attempting to fetch sky data..."); // DEBUG
    fetch("http://127.0.0.1:8000/sky-summary")
      .then((response) => {
        console.log("Response received:", response.status); // DEBUG
        return response.json();
      })
      .then((data) => {
        console.log("Sky Data state being set to:", data); // DEBUG
        setSkyData(data);
      })
      .catch((err) => console.error("FETCH ERROR:", err));
  }, []);

  return (
    <div
      style={{
        display: "flexbox",
        flexDirection: "row",
        alignItems: "stretch", // Makes all cards the same height
        justifyContent: "center",
        gap: "20px",
        flexWrap: "nowrap", // CRITICAL: Prevents stacking on mobile
        width: "100%", // Takes up full width
        maxWidth: "1400px", // Keeps it from getting TOO wide on giant monitors
        overflowX: "auto", // Adds a scrollbar ONLY if the screen is tiny
        paddingBottom: "10px" // Space for the scrollbar if it appears
      }}
    >
      <h1 style={{ textAlign: "center", width: "100%", marginBottom: "20px", letterSpacing: "4px" }}
      >
        SKY DASHBOARD 
      </h1>
      <p>for {locationName} ({coordinates.lat}° N, {coordinates.lon}° W)</p>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "start", // Changed to start so they align at the top
          justifyContent: "center",
          gap: "50px",
          flexWrap: "wrap",
          padding: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: "20px",
          boxShadow: "0 0 20px rgba(169, 107, 66, 0.36)"
        }}
      >
        <MoonTracker />
        <Weather />

        {/* 3. Only show SkyDetails once the data has loaded */}
        {/* {skyData && <SkyDetails skyData={skyData} />} */}
        {/* Replace the SkyDetails line with this temporarily */}
        {skyData ? (
          <SkyDetails skyData={skyData} />
        ) : (
          <div
            style={{
              color: "white",
              padding: "10px",
              background: "#333",
              borderRadius: "10px"
            }}
          >
            Connecting to Sky Station...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
