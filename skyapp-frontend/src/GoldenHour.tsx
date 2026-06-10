import React from "react";

// 1. Define the specific phases allowed by your telemetry system
type SunPhase = 
  | "Golden Hour" 
  | "Blue Hour" 
  | "Standard" 
  | "Daylight" 
  | "Twilight" 
  | "Astronomical Twilight";

interface GoldenHourProps {
  sunData: {
    phase?: SunPhase | string | number;
  } | null;
}

const GoldenHour: React.FC<GoldenHourProps> = ({ sunData }) => {
  // 2. Handle null or non-active phases
  if (
    !sunData ||
    !sunData.phase ||
    typeof sunData.phase !== "string" ||
    sunData.phase === "Standard" ||
    sunData.phase === "Daylight"
  ) {
    return null;
  }

  // phase is now narrowed to string
  const isGolden = sunData.phase === "Golden Hour";

  // 3. React.CSSProperties ensures the style object keys are valid CSS properties
  const badgeStyle: React.CSSProperties = {
    backgroundColor: isGolden ? "#FFC107cc" : "#3a44b7",
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
        <span style={{ fontSize: "1rem", fontFamily: "Roboto Condensed, sans-serif", fontWeight: 600 }}>
          {sunData.phase.toUpperCase()} ACTIVE
        </span>
      </div>
    </div>
  );
};

export default GoldenHour;