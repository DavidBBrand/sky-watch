import React from "react";

const GoldenHour = ({ sunData }) => {
  // 1. If data hasn't loaded yet, or it's just standard daylight/night, show nothing
  if (!sunData || !sunData.phase || sunData.phase === "Standard" || sunData.phase === "Daylight") {
    return null; 
  }

  const isGolden = sunData.phase === "Golden Hour";

  // 2. Component-specific styles to ensure it doesn't "mess up" the header
  const badgeStyle = {
    backgroundColor: isGolden ? "#ffb347" : "#5b63b7",
    color: "#fff",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
  };

  return (
    <div className="status-badge-container" style={{ textAlign: "center", width: "100%" }}>
      <div className="status-badge" style={badgeStyle}>
        <span style={{ fontSize: "1rem" }}>{isGolden ? "🌅" : "🌌"}</span>
        <span>{sunData.phase.toUpperCase()} ACTIVE</span>
      </div>
    </div>
  );
};

export default GoldenHour;