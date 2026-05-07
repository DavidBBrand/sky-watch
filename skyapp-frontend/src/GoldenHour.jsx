import React from "react";

const GoldenHour = ({ sunData }) => {
  // If data hasn't loaded yet, or it's just standard daylight/night, show nothing
  if (!sunData || !sunData.phase || sunData.phase === "Standard" || sunData.phase === "Daylight") {
    return null; 
  }

  const isGolden = sunData.phase === "Golden Hour";

  // Component-specific styles to ensure it doesn't "mess up" the header
  const badgeStyle = {
    backgroundColor: isGolden ? "#e49d39a4" : "#3a44b7",
    color: "#ffffffeb",
    padding: "6px 16px",
    borderRadius: "2rem",
    fontSize: "0.75rem",
    fontWeight: "bold",
    marginTop: "4px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  };

  return (
    <div className="status-badge-container" style={{ textAlign: "center", width: "100%" }}>
      <div className="status-badge" style={badgeStyle}>
        <span style={{ fontSize: "2.2rem" }}>{isGolden ? "🌅" : "🌌"}</span>
        <span style={{ fontSize: "1rem", fontFamily: "Fredericka The Great"}}>{sunData.phase.toUpperCase()} ACTIVE</span>
      </div>
    </div>
  );
};

export default GoldenHour;