import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { LocationProvider } from "./LocationContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocationProvider>
      <App />
    </LocationProvider>
  </StrictMode>
);
