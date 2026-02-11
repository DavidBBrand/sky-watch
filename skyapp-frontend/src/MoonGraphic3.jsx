import React, { useState, useEffect, useRef } from "react";
import "./MoonTracker.css";

const MoonGraphic3 = ({ lat, lon }) => {
  const [moonData, setMoonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState(null); // 'rising', 'setting', or null
  const prevAlt = useRef(null);

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    const fetchMoonData = () => {
      fetch(`http://127.0.0.1:8000/moon-details?lat=${lat}&lon=${lon}`)
        .then((response) => response.json())
        .then((data) => {
          if (isMounted) {
            // Calculate trend based on previous altitude
            if (prevAlt.current !== null) {
              setTrend(data.altitude > prevAlt.current ? "rising" : "setting");
            }
            prevAlt.current = data.altitude;
            setMoonData(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error("Error fetching moon data:", err);
            setLoading(false);
          }
        });
    };

    fetchMoonData();
    const interval = setInterval(fetchMoonData, 30000); // Update every 30s for trend accuracy

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [lat, lon]);

  const getCompassDirection = (az) => {
    if (az === undefined) return "--";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(az / 45) % 8;
    return directions[index];
  };
  const LunarVisual = ({ percentage }) => {
    // 0-50% is Crescent, 50-100% is Gibbous
    const isGibbous = percentage > 50;
    
    // Calculate the width of the middle "terminator" oval.
    // At 50% (Quarter), scale is 0 (straight line).
    // At 0% or 100%, scale is 1 (full circle).
    const scale = Math.abs(50 - percentage) / 50;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", width: "100%" }}>
        <div
          style={{
            width: "140px",
            height: "140px",
            backgroundColor: "#1a1a1a", // The "Space" background
            borderRadius: "50%",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 0 30px rgba(254, 252, 215, 0.15)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          {/* Base Layer: The lit half of the moon */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "50%",
              height: "100%",
              backgroundColor: "#fefcd7",
              zIndex: 1
            }}
          />

          {/* The Terminator: This oval creates the crescent or gibbous curve */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: isGibbous ? "0%" : "25%", // Shift based on phase
              width: isGibbous ? "100%" : "50%",
              height: "100%",
              backgroundColor: isGibbous ? "#fefcd7" : "#1a1a1a",
              borderRadius: "50%",
              transform: `scaleX(${scale})`,
              zIndex: 2,
              transition: "transform 1s ease-in-out, background-color 0.5s"
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-main)" }}>
            {percentage}%
          </h2>
          <p style={{ color: "var(--text-sub)", textTransform: "uppercase", letterSpacing: "1.6px", fontSize: "1rem", margin: 0 }}>
            Lunar Illumination
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div>
        <h2
          style={{
            fontSize: "1.2rem",
            textTransform: "uppercase",
            letterSpacing: "3px",
            color: "var(--text-main)",
            marginBottom: "40px",
            textAlign: "center",
            fontWeight: "600"
          }}
        >
          LUNAR OBSERVATION
        </h2>

        {loading ? (
          <div
            style={{
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <p
              style={{
                color: "var(--text-main)",
                fontSize: "0.8rem",
                opacity: 0.6
              }}
            >
              UPDATING TELEMETRY...
            </p>
          </div>
        ) : moonData ? (
          <>
            <LunarVisual percentage={moonData.illumination} />

            <div
              style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                padding: "15px 5px 0 5px",
                borderTop: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    color: "var(--text-sub)",
                    fontSize: "0.6rem",
                    margin: 0,
                    textTransform: "uppercase"
                  }}
                >
                  Altitude{" "}
                  {trend === "rising" ? "↑" : trend === "setting" ? "↓" : ""}
                </p>
                <p
                  style={{
                    color:
                      moonData.altitude > 0
                        ? "#4ade80"
                        : "var(--accent-color2)",
                    fontFamily: "monospace",
                    margin: 0,
                    fontSize: "1.2rem",
                    fontWeight: "bold"
                  }}
                >
                  {moonData.altitude?.toFixed(1)}°
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    color: "var(--text-sub)",
                    fontSize: "0.6rem",
                    margin: 0,
                    textTransform: "uppercase"
                  }}
                >
                  Azimuth
                </p>
                <p
                  style={{
                    color: "var(--text-main)",
                    fontFamily: "monospace",
                    margin: 0,
                    fontSize: "1.2rem"
                  }}
                >
                  {moonData.azimuth?.toFixed(1)}°
                  <span
                    style={{
                      color: "var(--accent-color)",
                      marginLeft: "5px",
                      fontSize: "0.9rem"
                    }}
                  >
                    ({getCompassDirection(moonData.azimuth)})
                  </span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <p
            style={{
              color: "var(--accent-color2)",
              fontSize: "0.8rem",
              textAlign: "center"
            }}
          >
            SIGNAL LOST
          </p>
        )}
      </div>
    </div>
  );
};

export default MoonGraphic3;
