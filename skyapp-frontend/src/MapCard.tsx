import React, { memo } from "react";
import { MapContainer, TileLayer, CircleMarker, Pane } from "react-leaflet";
import { useLocation } from "./LocationContext";
import "./MapCard.css";
import "leaflet/dist/leaflet.css";
import SolarCycle from "./SolarCycle";

interface MapCardProps {
  theme: "day" | "night";
  skyData: {
    sun?: {
      sunrise?: string;
      sunset?: string;
      zenith?: string;
      zenith_alt?: number | string;
      zenith_az?: number | string;
      current_altitude?: number;
      phase?: string | number;
    };
    timezone?: string;
  } | null;
  date: string;
}

const MapCard: React.FC<MapCardProps> = memo(({ theme, skyData, date }) => {
  const { location } = useLocation();
  const { lat, lon } = location;
  const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || "";

  const dayMapUrl =
    lat !== null && lon !== null
      ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/pin-s+ff4444(${lon},${lat})/${lon},${lat},12,0/600x400@2x?access_token=${MAPBOX_TOKEN}`
      : null;

  // Mapbox satellite tile URL for Leaflet (night mode base layer)
  const satTileUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;

  return (
    <div className="map-card-content">
      <div
        style={{
          minHeight: "120px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <div className="card-header-block">
          <div className="card-title">Solar Arc</div>
          <div className="glow-sub card-subtitle">{date}</div>
        </div>
        {skyData?.sun ? (
          <SolarCycle sun={skyData.sun} timezone={location.timezone} />
        ) : (
          <div className="solar-loader">
            <div className="scanning-line"></div>
            <div style={{ fontSize: "1.4rem", fontFamily: "Oxanium" }}>
              Calculating Solar Arc...
            </div>
          </div>
        )}
      </div>

      <div className="map-holder">
        {theme === "night" && lat !== null && lon !== null ? (
          // Night mode: Mapbox satellite tiles + CSS dark filter = city-lights-from-orbit effect
          // Urban concrete & roads are brighter in daytime aerial imagery;
          // extreme brightness/contrast reduction makes them glow against a black background.
          <MapContainer
            key={`${lat},${lon}`}
            center={[lat, lon]}
            zoom={8}
            className="night-satellite-map"
            style={{ width: "100%", height: "240px", borderRadius: "1.6rem" }}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            {/* Satellite base — CSS-filtered to city-lights look in MapCard.css */}
            <TileLayer url={satTileUrl} />

            {/* City labels in a separate pane above the filtered tile layer */}
            <Pane name="labelsPane" style={{ zIndex: 650 }}>
              <TileLayer
                pane="labelsPane"
                url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
              />
            </Pane>

            <CircleMarker
              center={[lat, lon]}
              radius={3}
              pathOptions={{
                color: "#ff4444",
                fillColor: "#ff4444",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          </MapContainer>
        ) : (
          dayMapUrl && (
            <img
              src={dayMapUrl}
              alt="Regional Telemetry Map"
              key="day-map"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "2rem",
                display: "block",
                transition: "opacity 0.5s ease",
              }}
            />
          )
        )}
        <div
          className="glow-sub"
          style={{ textAlign: "center", marginTop: "8px", fontSize: "1.4rem" }}
        >
          {location.name}
        </div>
      </div>
    </div>
  );
});

export default MapCard;
