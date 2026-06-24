import { useState, memo, useId, FormEvent } from "react";

// 1. Define the props expected by the component
interface LocationSearchProps {
  onLocationChange: (newLoc: { lat: number; lon: number; name: string }) => void;
}

// 2. Define the expected shape of the Nominatim API responses
interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
}

// 3. Apply the Props interface to the memoized component
const LocationSearch = memo<LocationSearchProps>(({ onLocationChange }) => {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const inputId = useId();

  // 4. Type the FormEvent
  const handleSearch = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    const controller = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`,
        {
          signal: controller.signal,
          headers: {
            "User-Agent": `SkyWatch/1.0 (${import.meta.env.VITE_NOMINATIM_EMAIL || "anonymous"})`
          }
        }
      );

      if (response.status === 425 || response.status === 429) {
        alert("Search is temporarily throttled. Please wait a few seconds.");
        return;
      }

      // Tell TypeScript what shape we expect the JSON to be
      const data: NominatimSearchResult[] = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, address, display_name } = data[0];
        const city = address.city || address.town || address.village || display_name.split(",")[0];
        const isUS = address.country_code === "us";
        const qualifier = isUS
          ? (address.state || address.country || "")
          : (address.country || address.state || "");

        onLocationChange({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          name: `${city}${qualifier ? ", " + qualifier : ""}`
        });
        setQuery("");
      } else {
        alert("Location not found.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Search request cancelled.");
      } else {
        console.error("Search error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-wrapper">
      <form
        onSubmit={handleSearch}
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <label htmlFor={inputId} className="sr-only" style={{ display: 'none' }}>
          Search Location
        </label>
        <input
          id={inputId}
          name="location-search"
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
          }}
        />
      </form>
    </div>
  );
});

export default LocationSearch;

