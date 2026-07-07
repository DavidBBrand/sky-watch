import React, { useState, useEffect, memo } from "react";
import "./SolarSystem.css";

interface BodyPos {
  x_au: number;
  y_au: number;
  dist_au: number;
}
type SolarData = Record<string, BodyPos>;

// Mean semi-major axes for orbit rings (AU)
const ORBIT_AU: [string, number][] = [
  ["Mercury", 0.387],
  ["Venus",   0.723],
  ["Earth",   1.000],
  ["Mars",    1.524],
  ["Jupiter", 5.203],
  ["Saturn",  9.537],
  ["Uranus",  19.19],
  ["Neptune", 30.07],
];

// Visual style per body
const STYLE: Record<string, { color: string; r: number; rings?: boolean }> = {
  Mercury: { color: "#a09888", r: 4 },
  Venus:   { color: "#e8c050", r: 7 },
  Earth:   { color: "#4a90d9", r: 7 },
  Mars:    { color: "#c0442a", r: 5 },
  Jupiter: { color: "#d4956a", r: 14 },
  Saturn:  { color: "#c8a850", r: 11, rings: true },
  Uranus:  { color: "#7fb8c0", r: 8 },
  Neptune: { color: "#3a60c8", r: 8 },
  Moon:    { color: "#b8b8b8", r: 3 },
};

// Piecewise scale: inner planets (0–2 AU) spread across 0–130 px,
// outer planets (2–30 AU) fill the remaining 130–320 px.
const INNER_AU   = 2.0;
const INNER_PX   = 130;
const INNER_POW  = 0.55;
const OUTER_POW  = 0.45;
const OUTER_SCALE =
  (320 - INNER_PX) /
  (Math.pow(30.07, OUTER_POW) - Math.pow(INNER_AU, OUTER_POW));

function scaleR(au: number): number {
  const d = Math.max(au, 0.001);
  if (d <= INNER_AU) {
    return Math.pow(d / INNER_AU, INNER_POW) * INNER_PX;
  }
  return INNER_PX + (Math.pow(d, OUTER_POW) - Math.pow(INNER_AU, OUTER_POW)) * OUTER_SCALE;
}

/** Heliocentric AU → SVG coords (Sun at centre, y-axis flipped) */
function toXY(x_au: number, y_au: number): [number, number] {
  const d = Math.sqrt(x_au * x_au + y_au * y_au);
  if (d < 1e-9) return [0, 0];
  const r = scaleR(d);
  const a = Math.atan2(y_au, x_au);
  return [r * Math.cos(a), -r * Math.sin(a)];
}

// ── Label collision helpers ──────────────────────────────────────────────────

const FONT_SIZE  = 10;
const CHAR_W     = FONT_SIZE * 0.56; // approx character width for Oxanium
const LABEL_PAD  = 4;                // extra clearance around each label box

interface Box { x: number; y: number; w: number; h: number }

function labelBox(cx: number, cy: number, name: string): Box {
  const w = name.length * CHAR_W;
  return { x: cx - w / 2, y: cy - FONT_SIZE, w, h: FONT_SIZE + 2 };
}

function boxesOverlap(a: Box, b: Box, pad = LABEL_PAD): boolean {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  );
}

function circleOverlapsBox(cx: number, cy: number, cr: number, b: Box, pad = 3): boolean {
  const nx = Math.max(b.x - pad, Math.min(cx, b.x + b.w + pad));
  const ny = Math.max(b.y - pad, Math.min(cy, b.y + b.h + pad));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < cr * cr;
}

// 8 candidate angles to try for each label (starting radial-outward)
const CANDIDATE_OFFSETS = [0, 1, -1, 2, -2, 4, -4, 3, -3].map(
  n => (n * Math.PI) / 8
);

interface PlanetEntry {
  name: string;
  sx: number;
  sy: number;
  cfg: (typeof STYLE)[string];
  pos: BodyPos;
}

/**
 * For each planet, pick the candidate angle that overlaps the fewest
 * already-placed labels and planet bodies.
 */
function resolveLabelPositions(
  planets: PlanetEntry[],
  baseAngles: number[]
): Array<{ x: number; y: number }> {
  const placed: Array<{ box: Box; x: number; y: number }> = [];
  const result: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < planets.length; i++) {
    const { name, sx, sy, cfg } = planets[i];
    const baseAngle = baseAngles[i];
    const offset = cfg.r + 16;

    let bestX = 0, bestY = 0, bestScore = Infinity;

    for (const da of CANDIDATE_OFFSETS) {
      const angle = baseAngle + da;
      const lx = sx + offset * Math.cos(angle);
      const ly = sy - offset * Math.sin(angle);
      const box = labelBox(lx, ly, name);

      let score = Math.abs(da) * 10; // prefer angles closest to natural radial

      // Penalise overlap with already-placed labels
      for (const p of placed) {
        if (boxesOverlap(box, p.box)) score += 200;
      }

      // Penalise overlap with any planet body (including self)
      for (const planet of planets) {
        if (circleOverlapsBox(planet.sx, planet.sy, planet.cfg.r + 3, box)) {
          score += 150;
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestX = lx;
        bestY = ly;
      }
    }

    placed.push({ box: labelBox(bestX, bestY, name), x: bestX, y: bestY });
    result.push({ x: bestX, y: bestY });
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────────────

interface SolarSystemProps {
  theme?: "day" | "night";
}

const SolarSystem: React.FC<SolarSystemProps> = memo(({ theme = "night" }) => {
  const [data, setData] = useState<SolarData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const BASE = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";
    fetch(`${BASE}/solar-system`)
      .then(r => {
        if (!r.ok) throw new Error(`Backend returned ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d && typeof d === "object" && "Earth" in d) {
          setData(d as SolarData);
        } else {
          throw new Error("Unexpected response shape from /solar-system");
        }
      })
      .catch(e => {
        console.error("SolarSystem fetch:", e);
        setError(e.message);
      });
  }, []);

  const ringStroke = theme === "night"
    ? "rgba(255,255,255,0.07)"
    : "rgba(60,60,100,0.10)";

  const earthXY = data?.Earth ? toXY(data.Earth.x_au, data.Earth.y_au) : null;

  // Build planet list (excludes Moon — handled separately)
  const planetEntries: PlanetEntry[] = data
    ? Object.entries(data)
        .filter(([name]) => name !== "Moon" && STYLE[name])
        .map(([name, pos]) => {
          const [sx, sy] = toXY(pos.x_au, pos.y_au);
          return { name, sx, sy, cfg: STYLE[name], pos };
        })
    : [];

  const baseAngles = planetEntries.map(({ pos }) =>
    Math.atan2(pos.y_au, pos.x_au)
  );

  const labelPositions = data ? resolveLabelPositions(planetEntries, baseAngles) : [];

  const strokeColor = theme === "night" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.95)";

  return (
    <div className="solar-system-card">
      <div className="card-title">Solar System — Live Orbital Positions</div>
      <div className="solar-disclaimer">* Distances compressed for visibility — not to scale</div>
      <div className="solar-svg-wrapper">
        <svg
          viewBox="-400 -400 800 800"
          width="100%"
          style={{ display: "block" }}
          aria-label="Aerial view of the solar system with live planet positions"
        >
          <defs>
            <radialGradient id="sun-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#fffdc0" stopOpacity="1" />
              <stop offset="40%"  stopColor="#ffd700" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
            </radialGradient>
            <filter id="body-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker id="moon-arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <path d="M0,0 L6,2 L0,4 Z" fill="#b8b8b8" fillOpacity="0.65" />
            </marker>
          </defs>

          {/* Orbit rings */}
          {ORBIT_AU.map(([name, au]) => (
            <circle
              key={name}
              cx={0} cy={0} r={scaleR(au)}
              fill="none" stroke={ringStroke} strokeWidth={0.8}
            />
          ))}

          {/* Moon orbit ring around Earth */}
          {earthXY && (
            <circle
              cx={earthXY[0]} cy={earthXY[1]} r={10}
              fill="none" stroke={ringStroke} strokeWidth={0.6}
            />
          )}

          {/* Sun */}
          <circle cx={0} cy={0} r={38} fill="url(#sun-grad)" />
          <circle cx={0} cy={0} r={16} fill="#ffd700" filter="url(#body-glow)">
            <title>Sun</title>
          </circle>
          <text
            x={0} y={-24}
            textAnchor="middle" fontSize={FONT_SIZE}
            fontFamily="Oxanium, sans-serif"
            fill="#ffd700" opacity={0.9}
            stroke={strokeColor} strokeWidth={2.5} paintOrder="stroke"
          >
            Sun
          </text>

          {/* Moon */}
          {data?.Moon && earthXY && (() => {
            const earth = data.Earth!;
            const dx = data.Moon.x_au - earth.x_au;
            const dy = data.Moon.y_au - earth.y_au;
            const dLen = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / dLen;
            const uy = dy / dLen;
            const mx = earthXY[0] + 10 * ux;
            const my = earthXY[1] - 10 * uy;
            const lx = earthXY[0] + 44 * ux;
            const ly = earthXY[1] - 44 * uy;
            const arrowEndX = mx + 3 * ux;
            const arrowEndY = my - 3 * uy;

            return (
              <g>
                <circle cx={mx} cy={my} r={2} fill="#b8b8b8" filter="url(#body-glow)">
                  <title>Moon — {data.Moon.dist_au.toFixed(5)} AU from Earth</title>
                </circle>
                <line
                  x1={lx} y1={ly} x2={arrowEndX} y2={arrowEndY}
                  stroke="#b8b8b8" strokeWidth={0.8} opacity={0.55}
                  markerEnd="url(#moon-arrow)"
                />
                <text
                  x={lx} y={ly - 5}
                  textAnchor="middle" fontSize={FONT_SIZE}
                  fontFamily="Oxanium, sans-serif"
                  fill="#b8b8b8"
                  stroke={strokeColor} strokeWidth={2.5} paintOrder="stroke"
                >
                  Moon
                </text>
              </g>
            );
          })()}

          {/* Planets */}
          {planetEntries.map(({ name, sx, sy, cfg, pos }, i) => {
            const lp = labelPositions[i] ?? { x: sx, y: sy - cfg.r - 16 };

            return (
              <g key={name}>
                {/* Soft glow halo */}
                <circle cx={sx} cy={sy} r={cfg.r + 6} fill={cfg.color} opacity={0.12} />
                {/* Planet body */}
                <circle cx={sx} cy={sy} r={cfg.r} fill={cfg.color} filter="url(#body-glow)">
                  <title>{name} — {pos.dist_au.toFixed(3)} AU from Sun</title>
                </circle>
                {/* Saturn rings */}
                {cfg.rings && (
                  <ellipse
                    cx={sx} cy={sy}
                    rx={cfg.r + 6} ry={3}
                    fill="none"
                    stroke={cfg.color}
                    strokeOpacity={0.65}
                    strokeWidth={1.5}
                  />
                )}
                {/* Label — collision-resolved position */}
                <text
                  x={lp.x} y={lp.y}
                  textAnchor="middle" fontSize={FONT_SIZE}
                  fontFamily="Oxanium, sans-serif"
                  fill={cfg.color}
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>

        {!data && !error && (
          <div className="solar-loading">Calculating orbital positions…</div>
        )}
        {error && (
          <div className="solar-loading solar-error">{error}</div>
        )}
      </div>
    </div>
  );
});

export default SolarSystem;
