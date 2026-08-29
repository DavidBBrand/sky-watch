// Web Worker — propagates all Starlink TLEs to geodetic positions off the main
// thread so the 5-second update never blocks the solar system animation RAF loop.
import * as satellite from "satellite.js";

interface TLEData {
  OBJECT_NAME: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
}

interface SatPoint {
  lat: number;
  lng: number;
  name: string;
  aboveHorizon: boolean;
}

interface WorkerInput {
  tles: TLEData[];
  lat: number | null;
  lon: number | null;
}

interface WorkerOutput {
  points: SatPoint[];
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { tles, lat, lon } = e.data;

  const now  = new Date();
  const gmst = satellite.gstime(now);

  const obsLatRad = lat !== null ? (lat * Math.PI) / 180 : null;
  const obsLonRad = lon !== null ? (lon * Math.PI) / 180 : null;

  const points: SatPoint[] = [];

  for (const tle of tles) {
    try {
      const satrec = satellite.twoline2satrec(tle.TLE_LINE1, tle.TLE_LINE2);
      if (satrec.error) continue;

      const pv = satellite.propagate(satrec, now);
      if (!pv || typeof pv.position === "boolean") continue;

      const pos = pv.position as satellite.EciVec3<number>;
      const geo = satellite.eciToGeodetic(pos, gmst);

      // Skip satellites outside realistic Starlink altitude range (200–1200 km)
      if (geo.height < 200 || geo.height > 1200) continue;

      const satLatDeg = satellite.radiansToDegrees(geo.latitude);
      const satLngDeg = satellite.radiansToDegrees(geo.longitude);

      // Orange = within 300 miles ground distance (haversine) — matches radar
      let aboveHorizon = false;
      if (obsLatRad !== null && obsLonRad !== null) {
        const φ2 = (satLatDeg * Math.PI) / 180;
        const Δφ = φ2 - obsLatRad;
        const Δλ = (satLngDeg * Math.PI) / 180 - obsLonRad;
        const a =
          Math.sin(Δφ / 2) ** 2 +
          Math.cos(obsLatRad) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        aboveHorizon = 2 * 3958.8 * Math.asin(Math.sqrt(a)) <= 300;
      }

      points.push({ lat: satLatDeg, lng: satLngDeg, name: tle.OBJECT_NAME, aboveHorizon });
    } catch {
      /* skip malformed TLEs */
    }
  }

  const result: WorkerOutput = { points };
  self.postMessage(result);
};
