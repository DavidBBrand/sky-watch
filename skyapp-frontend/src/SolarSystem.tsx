import React, { useState, useEffect, memo } from "react";
import "./SolarSystem.css";
import { PLANET_ICONS, MoonIcon } from "./PlanetIcons";

interface BodyPos {
  x_au: number;
  y_au: number;
  dist_au: number;
}
type SolarData = Record<string, BodyPos>;

interface SolarRange {
  dates: string[];
  days: SolarData[];
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

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
const STYLE: Record<string, { color: string; r: number }> = {
  Mercury: { color: "#a09888", r: 4 },
  Venus:   { color: "#e8c050", r: 7 },
  Earth:   { color: "#4a90d9", r: 7 },
  Mars:    { color: "#c0442a", r: 5 },
  Jupiter: { color: "#d4956a", r: 14 },
  Saturn:  { color: "#c8a850", r: 11 },
  Uranus:  { color: "#7fb8c0", r: 8 },
  Neptune: { color: "#3a60c8", r: 8 },
  Moon:    { color: "#b8b8b8", r: 3 },
};

// Piecewise scale: inner planets spread across 0–INNER_PX px, outer planets
// fill the remaining INNER_PX–OUTER_MAX_PX px. A lower INNER_POW and larger
// INNER_PX (vs. a flatter default) give Mercury/Venus/Earth more breathing
// room near the Sun instead of clustering right against its glow.
// In the expanded fullscreen view, INNER_PX/OUTER_MAX_PX get a modest bump
// (safely within the label margin reserved by the fixed 400-unit viewBox)
// so the whole diagram fills more of the available space.
const INNER_AU  = 2.0;
const INNER_POW = 0.45;
const OUTER_POW = 0.45;

function makeScaleR(innerPx: number, outerMaxPx: number) {
  const outerScale =
    (outerMaxPx - innerPx) /
    (Math.pow(30.07, OUTER_POW) - Math.pow(INNER_AU, OUTER_POW));
  return function scaleR(au: number): number {
    const d = Math.max(au, 0.001);
    if (d <= INNER_AU) {
      return Math.pow(d / INNER_AU, INNER_POW) * innerPx;
    }
    return innerPx + (Math.pow(d, OUTER_POW) - Math.pow(INNER_AU, OUTER_POW)) * outerScale;
  };
}

/** Heliocentric AU → SVG coords (Sun at centre, y-axis flipped) */
function makeToXY(scaleR: (au: number) => number) {
  return function toXY(x_au: number, y_au: number): [number, number] {
    const d = Math.sqrt(x_au * x_au + y_au * y_au);
    if (d < 1e-9) return [0, 0];
    const r = scaleR(d);
    const a = Math.atan2(y_au, x_au);
    return [r * Math.cos(a), -r * Math.sin(a)];
  };
}

// ── Label collision helpers ──────────────────────────────────────────────────

const LABEL_PAD  = 4; // extra clearance around each label box

interface Box { x: number; y: number; w: number; h: number }

function labelBox(cx: number, cy: number, name: string, fontSize: number): Box {
  const charW = fontSize * 0.56; // approx character width for Oxanium
  const w = name.length * charW;
  return { x: cx - w / 2, y: cy - fontSize, w, h: fontSize + 2 };
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
  baseAngles: number[],
  fontSize: number
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
      const box = labelBox(lx, ly, name, fontSize);

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

    placed.push({ box: labelBox(bestX, bestY, name, fontSize), x: bestX, y: bestY });
    result.push({ x: bestX, y: bestY });
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────────────

interface SolarSystemProps {
  theme?: "day" | "night";
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

const SolarSystem: React.FC<SolarSystemProps> = memo(({ theme = "night", isExpanded = false, onExpand, onCollapse }) => {
  const [range, setRange] = useState<SolarRange | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  // 0 = paused, 1 = playing forward, -1 = playing backward
  const [playDirection, setPlayDirection] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    const BASE = (import.meta.env.VITE_API_URL as string) || "http://127.0.0.1:8000";
    fetch(`${BASE}/solar-system/range`)
      .then(r => {
        if (!r.ok) throw new Error(`Backend returned ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d && typeof d === "object" && Array.isArray(d.days) && d.days.length > 0) {
          setRange(d as SolarRange);
        } else {
          throw new Error("Unexpected response shape from /solar-system/range");
        }
      })
      .catch(e => {
        console.error("SolarSystem fetch:", e);
        setError(e.message);
      });
  }, []);

  // Auto-advance the day index while playing, pausing at either end
  useEffect(() => {
    if (playDirection === 0 || !range) return;
    const timer = setInterval(() => {
      setDayIndex(prev => {
        const next = prev + playDirection;
        if (next < 0 || next >= range.days.length) {
          setPlayDirection(0);
          return prev;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [playDirection, range]);

  const data = range?.days[dayIndex] ?? null;

  const ringStroke = theme === "night"
    ? "rgba(255,255,255,0.07)"
    : "rgba(60,60,100,0.10)";

  // The expanded fullscreen view gets bigger planet/Sun/Moon bodies, bigger
  // labels, and a bit more orbital spread — all safely within the fixed
  // 400-unit viewBox margin reserved for the outermost label.
  const BODY_ZOOM = isExpanded ? 1.6 : 1;
  const FONT_SIZE = isExpanded ? 14 : 10;
  const INNER_PX = isExpanded ? 185 : 170;
  const OUTER_MAX_PX = isExpanded ? 340 : 320;
  const scaleR = makeScaleR(INNER_PX, OUTER_MAX_PX);
  const toXY = makeToXY(scaleR);
  const styleFor = (name: string) => {
    const base = STYLE[name];
    return { color: base.color, r: base.r * BODY_ZOOM };
  };

  const earthXY = data?.Earth ? toXY(data.Earth.x_au, data.Earth.y_au) : null;

  // Build planet list (excludes Moon — handled separately)
  const planetEntries: PlanetEntry[] = data
    ? Object.entries(data)
        .filter(([name]) => name !== "Moon" && STYLE[name])
        .map(([name, pos]) => {
          const [sx, sy] = toXY(pos.x_au, pos.y_au);
          return { name, sx, sy, cfg: styleFor(name), pos };
        })
    : [];

  const baseAngles = planetEntries.map(({ pos }) =>
    Math.atan2(pos.y_au, pos.x_au)
  );

  const labelPositions = data ? resolveLabelPositions(planetEntries, baseAngles, FONT_SIZE) : [];

  const strokeColor = theme === "night" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.95)";

  const sunR = 38 * BODY_ZOOM;
  const sunCoreR = 16 * BODY_ZOOM;
  const moonOrbitR = 16 * BODY_ZOOM;

  return (
    <div className="solar-system-card">
      <div className="card-title">Solar System — Live Orbital Positions</div>
      {isExpanded ? (
        <button className="solar-expand-btn" onClick={onCollapse}>
          ← Back to Dashboard
        </button>
      ) : (
        onExpand && (
          <button className="solar-expand-btn" onClick={onExpand}>
            Expand
          </button>
        )
      )}
      <div className="solar-disclaimer">* Distances compressed for visibility — not to scale</div>
      <div className="solar-svg-wrapper">
        <svg
          viewBox="-400 -400 800 800"
          width="100%"
          height="100%"
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
              cx={earthXY[0]} cy={earthXY[1]} r={moonOrbitR}
              fill="none" stroke={ringStroke} strokeWidth={0.6}
            />
          )}

          {/* Sun */}
          <circle cx={0} cy={0} r={sunR} fill="url(#sun-grad)" />
          <circle cx={0} cy={0} r={sunCoreR} fill="#ffd700" filter="url(#body-glow)">
            <title>Sun</title>
          </circle>
          <text
            x={0} y={-24 * BODY_ZOOM}
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
            const mx = earthXY[0] + moonOrbitR * ux;
            const my = earthXY[1] - moonOrbitR * uy;
            const lx = earthXY[0] + (moonOrbitR + 30 * BODY_ZOOM) * ux;
            const ly = earthXY[1] - (moonOrbitR + 30 * BODY_ZOOM) * uy;
            const arrowEndX = mx + 5 * BODY_ZOOM * ux;
            const arrowEndY = my - 5 * BODY_ZOOM * uy;

            const moonFill  = theme === "night" ? "#d0d0d0" : "#6e6e88";
            const moonLabel = theme === "night" ? "#c8c8c8" : "#5a5a76";
            const moonLine  = theme === "night" ? "#b8b8b8" : "#707088";

            return (
              <g>
                {/* Subtle glow halo */}
                <circle cx={mx} cy={my} r={8 * BODY_ZOOM} fill={moonFill} opacity={0.15} />
                <title>Moon — {data.Moon.dist_au.toFixed(5)} AU from Earth</title>
                <MoonIcon cx={mx} cy={my} r={4 * BODY_ZOOM} />
                <line
                  x1={lx} y1={ly} x2={arrowEndX} y2={arrowEndY}
                  stroke={moonLine} strokeWidth={0.8} opacity={0.6}
                  markerEnd="url(#moon-arrow)"
                />
                <text
                  x={lx} y={ly - 5}
                  textAnchor="middle" fontSize={FONT_SIZE}
                  fontFamily="Oxanium, sans-serif"
                  fill={moonLabel}
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
            const Icon = PLANET_ICONS[name];

            return (
              <g key={name}>
                {/* Soft glow halo */}
                <circle cx={sx} cy={sy} r={cfg.r + 6} fill={cfg.color} opacity={0.12} />
                <title>{name} — {pos.dist_au.toFixed(3)} AU from Sun</title>
                {/* Planet body */}
                {Icon ? (
                  <Icon cx={sx} cy={sy} r={cfg.r} />
                ) : (
                  <circle cx={sx} cy={sy} r={cfg.r} fill={cfg.color} filter="url(#body-glow)" />
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
        {range && (
          <div className={`solar-date-display${isExpanded ? " solar-date-display--large" : ""}`}>
            {formatDayLabel(range.dates[dayIndex])}
          </div>
        )}
      </div>

      {range && (
        <div className="solar-time-controls">
          <div className="solar-time-buttons">
            <button
              type="button"
              className="solar-time-btn"
              aria-label="Rewind"
              onClick={() => setPlayDirection(prev => (prev === -1 ? 0 : -1))}
            >
              {playDirection === -1 ? "❚❚" : "◀◀"}
            </button>
            <button
              type="button"
              className="solar-time-btn"
              aria-label="Reset to today"
              onClick={() => { setDayIndex(0); setPlayDirection(0); }}
            >
              Today
            </button>
            <button
              type="button"
              className="solar-time-btn"
              aria-label="Play forward"
              onClick={() => setPlayDirection(prev => (prev === 1 ? 0 : 1))}
            >
              {playDirection === 1 ? "❚❚" : "▶▶"}
            </button>
          </div>
          <input
            type="range"
            className="solar-time-slider"
            min={0}
            max={range.days.length - 1}
            value={dayIndex}
            onChange={e => {
              setPlayDirection(0);
              setDayIndex(Number(e.target.value));
            }}
          />
        </div>
      )}
    </div>
  );
});

export default SolarSystem;
