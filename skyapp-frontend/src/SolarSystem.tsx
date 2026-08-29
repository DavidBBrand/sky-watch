import React, { useState, useEffect, useRef, useCallback, memo } from "react";
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

// Proportional inner planet sizes in expanded view
const EXPANDED_R: Partial<Record<string, number>> = {
  Mercury: 3,
  Venus:   8,
  Earth:   9,
  Mars:    5,
};

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

function makeToXY(scaleR: (au: number) => number) {
  return function toXY(x_au: number, y_au: number): [number, number] {
    const d = Math.sqrt(x_au * x_au + y_au * y_au);
    if (d < 1e-9) return [0, 0];
    const r = scaleR(d);
    const a = Math.atan2(y_au, x_au);
    return [r * Math.cos(a), -r * Math.sin(a)];
  };
}

// Linearly interpolate planet positions between consecutive days for smooth motion.
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
  // dayFrac state only drives the slider and date label — not planet positions.
  // Planet positions are updated imperatively via DOM refs in the RAF loop.
  const [dayFrac, setDayFrac] = useState(0);
  const dayFracRef = useRef(0);
  const [playDirection, setPlayDirection] = useState<0 | 1 | -1>(0);
  const rafRef    = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  // DOM refs for imperative position updates — bypasses React reconciliation per frame
  const planetGroupsRef  = useRef<Map<string, SVGGElement>>(new Map());
  const moonGroupRef     = useRef<SVGGElement | null>(null);
  const moonOrbitRingRef = useRef<SVGCircleElement | null>(null);

  // "Live" refs — updated synchronously in the render body so the RAF closure
  // always reads the latest scale function and layout params without stale captures.
  const rangeRef      = useRef<SolarRange | null>(null);
  const toXYRef       = useRef<(x: number, y: number) => [number, number]>((_x, _y) => [0, 0]);
  const isExpandedRef = useRef(isExpanded);
  const sunCoreRRef   = useRef(0);
  const moonOrbitRRef = useRef(0);

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

  // ─── Per-render live-ref sync ─────────────────────────────────────────────
  // These run synchronously during render so the RAF closure reads current values
  // on its very next tick — no useEffect delay needed.
  const BODY_ZOOM = isExpanded ? 2.0 : 1;
  const scaleR = isExpanded
    ? makeScaleR(200, 390, 0.75, 0.65)
    : makeScaleR(230, 320);
  const toXY = makeToXY(scaleR);
  const sunCoreR   = 16 * BODY_ZOOM;
  const moonOrbitR = 16 * BODY_ZOOM;

  toXYRef.current       = toXY;
  isExpandedRef.current = isExpanded;
  sunCoreRRef.current   = sunCoreR;
  moonOrbitRRef.current = moonOrbitR;
  rangeRef.current      = range;
  // ─────────────────────────────────────────────────────────────────────────

  // Helper: compute and imperatively apply all planet + Moon transforms.
  // Called from the RAF loop (every frame during playback) and also from the
  // slider onChange and an initial useEffect so positions are always correct
  // even when the animation is paused.
  const applyPositions = useCallback((frac: number) => {
    const currentRange = rangeRef.current;
    if (!currentRange) return;

    const frameData = interpolateSolarData(currentRange.days, frac);
    const toXYcur       = toXYRef.current;
    const sunCoreCur    = sunCoreRRef.current;
    const moonOrbitCur  = moonOrbitRRef.current;
    const isExpandedCur = isExpandedRef.current;
    const BODY_ZOOM_cur = isExpandedCur ? 2.0 : 1;

    const getR = (name: string) => {
      const base = STYLE[name];
      if (!base) return 4;
      const expanded = EXPANDED_R[name];
      return isExpandedCur && expanded != null ? expanded : base.r * BODY_ZOOM_cur;
    };

    // Planet positions
    for (const [name, pos] of Object.entries(frameData)) {
      if (name === "Moon") continue;
      const el = planetGroupsRef.current.get(name);
      if (!el || !STYLE[name]) continue;

      let [sx, sy] = toXYcur(pos.x_au, pos.y_au);
      if (name === "Mercury") {
        const r = getR("Mercury");
        const minD = sunCoreCur + r + 4;
        const d = Math.hypot(sx, sy) || 1;
        if (d < minD) { const s = minD / d; sx *= s; sy *= s; }
      }
      el.setAttribute("transform", `translate(${sx}, ${sy})`);
    }

    // Moon orbit ring + Moon position — both derived from Earth's current position
    const earthPos = frameData["Earth"];
    const moonPos  = frameData["Moon"];
    if (earthPos) {
      const [ex, ey] = toXYcur(earthPos.x_au, earthPos.y_au);

      // Keep the orbit ring centred on Earth imperatively so it never lags
      if (moonOrbitRingRef.current) {
        moonOrbitRingRef.current.setAttribute("cx", String(ex));
        moonOrbitRingRef.current.setAttribute("cy", String(ey));
      }

      if (moonPos && moonGroupRef.current) {
        const dx   = moonPos.x_au - earthPos.x_au;
        const dy   = moonPos.y_au - earthPos.y_au;
        const dLen = Math.sqrt(dx * dx + dy * dy) || 1;
        const mx   = ex + moonOrbitCur * (dx / dLen);
        const my   = ey - moonOrbitCur * (dy / dLen);
        moonGroupRef.current.setAttribute("transform", `translate(${mx}, ${my})`);
      }
    }
  }, []); // stable — reads everything through refs

  // Apply correct positions when data first arrives or view mode changes.
  useEffect(() => {
    if (!range) return;
    applyPositions(dayFracRef.current);
  }, [range, isExpanded, applyPositions]);

  // ─── Animation loop ───────────────────────────────────────────────────────
  // Key design: planet positions are updated imperatively via applyPositions()
  // — zero React state updates per frame. React state (dayFrac) is updated
  // only every 3rd frame to keep the slider and date label in sync, without
  // any flushSync blocking the main thread.
  const DAYS_PER_SECOND = 8;

  useEffect(() => {
    if (playDirection === 0 || !range) return;
    lastTsRef.current = null;
    frameCountRef.current = 0;

    const step = (timestamp: number) => {
      if (lastTsRef.current === null) lastTsRef.current = timestamp;
      const dt = Math.min((timestamp - lastTsRef.current) / 1000, 0.1);
      lastTsRef.current = timestamp;

      const next = dayFracRef.current + playDirection * DAYS_PER_SECOND * dt;

      if (next < 0 || next >= range.days.length - 1) {
        const clamped = Math.max(0, Math.min(range.days.length - 1, next));
        dayFracRef.current = clamped;
        applyPositions(clamped);
        setDayFrac(clamped);
        setPlayDirection(0);
        return;
      }

      dayFracRef.current = next;

      // Imperative DOM update — no React overhead at all
      applyPositions(next);

      // Throttled React state update for slider/date label only
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0) {
        setDayFrac(next);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [playDirection, range, applyPositions]);

  const dayIndex = Math.min(Math.round(dayFrac), (range?.days.length ?? 1) - 1);

  const ringStroke = theme === "night"
    ? "rgba(255,255,255,0.07)"
    : "rgba(40,40,90,0.28)";

  const sunR = 38 * BODY_ZOOM;

  const styleFor = (name: string) => {
    const base = STYLE[name];
    const r = isExpanded && EXPANDED_R[name] != null
      ? EXPANDED_R[name]!
      : base.r * BODY_ZOOM;
    return { color: base.color, r };
  };

  // Earth position for Moon orbit ring (React-rendered, static ring position)
  // We still need to track Earth in React-land for the orbit ring circle.
  // Use the current dayFrac (which lags by up to 3 frames — imperceptible for a ring).
  const data = range ? interpolateSolarData(range.days, dayFrac) : null;
  const earthXY = data?.Earth ? toXY(data.Earth.x_au, data.Earth.y_au) : null;

  // Planet entries for the initial static render (icons + titles).
  // Transforms are applied imperatively — NOT via the `transform` JSX prop.
  const planetNames = data
    ? Object.keys(data).filter(name => name !== "Moon" && STYLE[name])
    : [];

  const moonFill = theme === "night" ? "#d0d0d0" : "#6e6e88";
  const moonR    = isExpanded ? 2.5 : 4;

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

          {/* Orbit rings — fixed at mean semi-major axes */}
          {ORBIT_AU.map(([name, au]) => (
            <circle
              key={name}
              cx={0} cy={0} r={scaleR(au)}
              fill="none" stroke={ringStroke} strokeWidth={0.8}
            />
          ))}

          {/* Moon orbit ring — cx/cy are set imperatively by applyPositions so they
               stay perfectly in sync with Earth every frame. No cx/cy JSX props so
               React never overwrites the imperatively-set values on reconciliation. */}
          {earthXY && (
            <circle
              ref={(el) => { moonOrbitRingRef.current = el; }}
              r={moonOrbitR}
              fill="none" stroke={ringStroke} strokeWidth={0.6}
            />
          )}

          {/* Sun */}
          <circle cx={0} cy={0} r={sunR} fill="url(#sun-grad)" />
          <circle cx={0} cy={0} r={sunCoreR} fill="#ffd700" filter="url(#body-glow)">
            <title>Sun</title>
          </circle>

          {/* Moon — no transform prop; position set imperatively by applyPositions() */}
          {data?.Moon && earthXY && (
            <g ref={(el) => { moonGroupRef.current = el; }}>
              <circle cx={0} cy={0} r={moonR * 2} fill={moonFill} opacity={0.15} />
              <title>Moon — {data.Moon.dist_au.toFixed(5)} AU from Earth</title>
              <MoonIcon cx={0} cy={0} r={moonR} />
            </g>
          )}

          {/* Planets — no transform prop; positions set imperatively by applyPositions().
               React manages icon content (cx/cy/r props); the RAF loop manages position.
               Because `transform` is never in the JSX, React's reconciler never touches
               it — direct setAttribute calls survive re-renders. */}
          {planetNames.map((name) => {
            const Icon = PLANET_ICONS[name];
            const cfg  = styleFor(name);
            const pos  = data![name];

            return (
              <g
                key={name}
                ref={(el) => {
                  if (el) planetGroupsRef.current.set(name, el);
                  else planetGroupsRef.current.delete(name);
                }}
              >
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
              disabled={dayIndex === 0 && playDirection !== -1}
              onClick={() => setPlayDirection(prev => (prev === -1 ? 0 : -1))}
            >
              {playDirection === -1 ? "❚❚" : "◀◀"}
            </button>
            <button
              type="button"
              className="solar-time-btn"
              aria-label="Reset to today"
              onClick={() => {
                dayFracRef.current = 0;
                applyPositions(0);
                setDayFrac(0);
                setPlayDirection(0);
              }}
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
              applyPositions(v);  // immediate imperative update
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
