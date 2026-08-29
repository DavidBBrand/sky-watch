// Web Worker — runs TLE propagation off the main thread so the animation
// RAF loop is never blocked by orbital math.
import * as satellite from "satellite.js";

interface TLEData {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  error?: string;
}

interface RadarNode {
  x: number;
  y: number;
  id: string;
  name: string;
  distance: number;
}

interface WorkerInput {
  tles: TLEData[];
  lat: number;
  lon: number;
}

interface WorkerOutput {
  nodes: RadarNode[];
  isAlert: boolean;
}

const MIN_ELEVATION_DEG = 30;
const MIN_ELEVATION_RAD = MIN_ELEVATION_DEG * (Math.PI / 180);

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { tles, lat, lon } = e.data;

  const now = new Date();
  const gmst = satellite.gstime(now);

  const observerGd = {
    latitude: satellite.degreesToRadians(lat),
    longitude: satellite.degreesToRadians(lon),
    height: 0.122, // km above ground
  };

  const visiblePoints: RadarNode[] = [];
  let closeContact = false;

  for (const sat of tles) {
    try {
      if (!sat || sat.error) continue;
      const line1 = sat.TLE_LINE1;
      const line2 = sat.TLE_LINE2;
      if (!line1 || !line2) continue;

      const satrec = satellite.twoline2satrec(line1, line2);
      if (!satrec || satrec.error) continue;

      const pv = satellite.propagate(satrec, now);
      if (!pv || typeof pv.position === "boolean") continue;

      const satEcf = satellite.eciToEcf(pv.position, gmst);
      const lookAngles = satellite.ecfToLookAngles(observerGd, satEcf);

      if (lookAngles.elevation > MIN_ELEVATION_RAD) {
        const slantRangeKm = lookAngles.rangeSat;
        const slantRangeMiles = slantRangeKm
          ? Math.round(slantRangeKm * 0.621371)
          : 0;

        if (slantRangeMiles < 150) closeContact = true;

        // Remap elevation 30°–90° → display radius 48→0 (outer edge to centre)
        const elevationDeg = lookAngles.elevation * (180 / Math.PI);
        const r =
          (1 - (elevationDeg - MIN_ELEVATION_DEG) / (90 - MIN_ELEVATION_DEG)) *
          48;
        const theta = lookAngles.azimuth - Math.PI / 2;

        visiblePoints.push({
          x: 50 + r * Math.cos(theta),
          y: 50 + r * Math.sin(theta),
          id: String(sat.OBJECT_ID || sat.NORAD_CAT_ID || Math.random()),
          name: String(sat.OBJECT_NAME || "STARLINK"),
          distance: slantRangeMiles,
        });
      }
    } catch {
      // skip bad TLE records silently
    }
  }

  const result: WorkerOutput = { nodes: visiblePoints, isAlert: closeContact };
  self.postMessage(result);
};
