import React, { useState, useEffect, useRef, memo } from "react";
import { flushSync } from "react-dom";
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
// fill the remaining INNER_PX–OUTER_MAX_PX px. INNER_POW close to 1 (nearly
// linear) keeps Venus/Earth/Mars from bunching up in the middle of that
// range — a lower exponent stretches Mercury out but squeezes everything
// above it together, which is what made Venus/Earth look too close.
// In the expanded fullscreen view, INNER_PX/OUTER_MAX_PX get a bump (safely
// within the label margin reserved by the fixed 400-unit viewBox) so the
// whole diagram fills more of the available space.
const INNER_AU  = 2.0;
const INNER_POW = 0.85;
const OUTER_POW = 0.45;

function makeScaleR(
  innerPx: number,
  outerMaxPx: number,
  innerPow = INNER_POW,
  outerPow = OUTER_POW,
) {
  const outerScale =
    (outerMaxPx - innerPx) /
    (Math.pow(30.07, outerPow) - Math.pow(INNER_AU, outerPow));
  return function scaleR(au: number): number {
    const d = Math.max(au, 0.001);
    if (d <= INNER_AU) {
      return Math.pow(d / INNER_AU, innerPow) * innerPx;
    }
    return innerPx + (Math.pow(d, outerPow) - Math.pow(INNER_AU, outerPow)) * outerScale;
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

interface PlanetEntry {
  name: string;
  sx: number;
  sy: number;
  cfg: (typeof STYLE)[string];
  pos: BodyPos;
}

// ────────────────────────────────────────────────────────────────────────────

// Linearly interpolate planet positions between two consecutive days so the
// animation is continuous rather than jumping one day at a time.
function interpolateSolarData(days: SolarData[], frac: number): SolarData {
  const i = Math.floor(frac);
  const t = frac - i;
  if (t < 1e-9 || i >= days.length - 1) return days[Math.min(i, days.length - 1)];
  const a = days[i];
  const b = days[i + 1];
  const result: SolarData = {};
  for (const name of Object.keys(a)) {
    if (b[name]) {
      result[name] = {
        x_au:    a[name].x_au    + (b[name].x_au    - a[name].x_au)    * t,
        y_au:    a[name].y_au    + (b[name].y_au    - a[name].y_au)    * t,
        dist_au: a[name].dist_au + (b[name].dist_au - a[name].dist_au) * t,
      };
    }
  }
  return result;
}

interface SolarSystemProps {
  theme?: "day" | "night";
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

const SolarSystem: React.FC<SolarSystemProps> = memo(({ theme = "night", isExpanded = false, onExpand, onCollapse }) => {
  const [range, setRange] = useState<SolarRange | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fractional day position — lets us interpolate between days for smooth motion
  const [dayFrac, setDayFrac] = useState(0);
  const dayFracRef = useRef(0); // mirror kept in sync so RAF closure always reads current value
  // 0 = paused, 1 = playing forward, -1 = playing backward
  const [playDirection, setPlayDirection] = useState<0 | 1 | -1>(0);
  const rafRef    = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

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

  // requestAnimationFrame loop — advances dayFrac at a fixed real-time speed.
  // flushSync forces React to commit each frame synchronously before the next
  // RAF fires, so every 60fps frame produces a visible render. Without it,
  // React 18 may batch/defer the state update and skip frames, causing chop.
  const DAYS_PER_SECOND = 8;

  useEffect(() => {
    if (playDirection === 0 || !range) return;
    lastTsRef.current = null;

    const step = (timestamp: number) => {
      if (lastTsRef.current === null) lastTsRef.current = timestamp;
      const dt = Math.min((timestamp - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = timestamp;

      const next = dayFracRef.current + playDirection * DAYS_PER_SECOND * dt;

      if (next < 0 || next >= range.days.length - 1) {
        const clamped = Math.max(0, Math.min(range.days.length - 1, next));
        dayFracRef.current = clamped;
        flushSync(() => { setDayFrac(clamped); setPlayDirection(0); });
        return;
      }

      dayFracRef.current = next;
      flushSync(() => setDayFrac(next));

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [playDirection, range]);

  // Integer index for the slider and date label; interpolated data for rendering
  const dayIndex = Math.min(Math.round(dayFrac), (range?.days.length ?? 1) - 1);
  const data = range ? interpolateSolarData(range.days, dayFrac) : null;

  const ringStroke = theme === "night"
    ? "rgba(255,255,255,0.07)"
    : "rgba(40,40,90,0.28)";

  // The expanded fullscreen view gets bigger planet/Sun/Moon bodies, bigger
  // labels, and a much bigger orbital spread — the outer ring now reaches to
  // within a few px of the fixed 400-unit viewBox edge. The label collision
  // system (labelBoxOutOfBounds/clampToBounds) keeps names from clipping
  // even this close to the boundary.
  const BODY_ZOOM = isExpanded ? 2.0 : 1;
  const INNER_PX = isExpanded ? 200 : 230;
  const OUTER_MAX_PX = isExpanded ? 390 : 320;
  // Expanded view uses a tighter inner zone (200px vs 310px) so outer planets
  // get more of the display space, and a higher outer exponent (0.65 vs 0.45)
  // so Jupiter–Neptune spread more linearly — closer to true relative distances.
  const scaleR = isExpanded
    ? makeScaleR(200, 390, 0.75, 0.65)
    : makeScaleR(230, 320);
  const toXY = makeToXY(scaleR);

  // In expanded view, give inner planets sizes proportional to their real
  // radii relative to Earth (Mercury 0.38×, Venus 0.95×, Mars 0.53×).
  // Outer planets keep the normal BODY_ZOOM doubling — they're already
  // much larger and less crowded.
  const EXPANDED_R: Partial<Record<string, number>> = {
    Mercury: 3,   // real: 0.38 × Earth
    Venus:   8,   // real: 0.95 × Earth
    Earth:   9,
    Mars:    5,   // real: 0.53 × Earth
  };

  const styleFor = (name: string) => {
    const base = STYLE[name];
    const r = isExpanded && EXPANDED_R[name] != null
      ? EXPANDED_R[name]!
      : base.r * BODY_ZOOM;
    return { color: base.color, r };
  };

  const sunR = 38 * BODY_ZOOM;
  const sunCoreR = 16 * BODY_ZOOM;

  const earthXY = data?.Earth ? toXY(data.Earth.x_au, data.Earth.y_au) : null;

  // Build planet list (excludes Moon — handled separately). Mercury's orbit
  // is floored so it never sinks into the Sun's glow — the inner power
  // curve alone can't guarantee that once the Sun grows with BODY_ZOOM.
  const planetEntries: PlanetEntry[] = data
    ? Object.entries(data)
        .filter(([name]) => name !== "Moon" && STYLE[name])
        .map(([name, pos]) => {
          let [sx, sy] = toXY(pos.x_au, pos.y_au);
          // Only prevent Mercury from overlapping the Sun's hard core circle
          // (sunCoreR stays proportional to BODY_ZOOM but doesn't grow nearly
          // as fast as sunR did, so this floor no longer pushes Mercury off
          // its orbit ring in the expanded view).
          if (name === "Mercury") {
            const cfg = styleFor(name);
            const minD = sunCoreR + cfg.r + 4;
            const d = Math.hypot(sx, sy) || 1;
            if (d < minD) {
              const scale = minD / d;
              sx *= scale;
              sy *= scale;
            }
          }
          return { name, sx, sy, cfg: styleFor(name), pos };
        })
    : [];


  const moonOrbitR = 16 * BODY_ZOOM;
  // Moon proportional to Earth: real ratio ≈ 0.27×. Earth is 9px in expanded,
  // so Moon ≈ 2.5px. Normal view keeps the original 4px.
  const moonR = isExpanded ? 2.5 : 4;
  // Label standoff past the orbit ring. Reduced ~80% in expanded so the
  // arrow is short and doesn't crowd the diagram.

  return (
    <div className={`solar-system-card${isExpanded ? " solar-system-card--expanded" : ""}`}>
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
          </defs>

          {/* Orbit rings — drawn at each planet's mean semi-major axis so they
               stay fixed. Planets may sit slightly off the ring at times
               due to orbital eccentricity; that's physically accurate. */}
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
            const moonFill = theme === "night" ? "#d0d0d0" : "#6e6e88";

            return (
              <g transform={`translate(${mx}, ${my})`}>
                <circle cx={0} cy={0} r={moonR * 2} fill={moonFill} opacity={0.15} />
                <title>Moon — {data.Moon.dist_au.toFixed(5)} AU from Earth</title>
                <MoonIcon cx={0} cy={0} r={moonR} />
              </g>
            );
          })()}

          {/* Planets — group translate keeps cx/cy constant inside each icon so
               React can skip reconciling their many SVG child elements each frame */}
          {planetEntries.map(({ name, sx, sy, cfg, pos }) => {
            const Icon = PLANET_ICONS[name];

            return (
              <g key={name} transform={`translate(${sx}, ${sy})`}>
                <title>{name} — {pos.dist_au.toFixed(3)} AU from Sun</title>
                {Icon ? (
                  <Icon cx={0} cy={0} r={cfg.r} />
                ) : (
                  <circle cx={0} cy={0} r={cfg.r} fill={cfg.color} filter="url(#body-glow)" />
                )}
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
              onClick={() => { dayFracRef.current = 0; setDayFrac(0); setPlayDirection(0); }}
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
              const v = Number(e.target.value);
              dayFracRef.current = v;
              setPlayDirection(0);
              setDayFrac(v);
            }}
          />
        </div>
      )}
    </div>
  );
});

export default SolarSystem;
