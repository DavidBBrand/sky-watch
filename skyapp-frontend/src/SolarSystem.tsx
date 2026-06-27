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
  Mercury: { color: "#a09888", r: 3 },
  Venus:   { color: "#e8c050", r: 5 },
  Earth:   { color: "#4a90d9", r: 5 },
  Mars:    { color: "#c0442a", r: 4 },
  Jupiter: { color: "#d4956a", r: 9 },
  Saturn:  { color: "#c8a850", r: 7, rings: true },
  Uranus:  { color: "#7fb8c0", r: 6 },
  Neptune: { color: "#3a60c8", r: 6 },
  Moon:    { color: "#b8b8b8", r: 2 },
};

// Power-law scale: Neptune (30.07 AU) → 320 display px
const POWER = 0.45;
const SCALE = 320 / Math.pow(30.07, POWER);

function scaleR(au: number): number {
  return Math.pow(Math.max(au, 0.001), POWER) * SCALE;
}

/** Heliocentric AU → SVG coords (Sun at origin, y-axis flipped for SVG) */
function toXY(x_au: number, y_au: number): [number, number] {
  const d = Math.sqrt(x_au * x_au + y_au * y_au);
  if (d < 1e-9) return [0, 0];
  const r = scaleR(d);
  const a = Math.atan2(y_au, x_au);
  return [r * Math.cos(a), -r * Math.sin(a)];
}

// Hardcoded star positions [x, y, opacity]
const STARS: [number, number, number][] = [
  [-340, -320, 0.50], [-280,  260, 0.40], [ 310, -200, 0.60], [ 220,  330, 0.35],
  [-150, -280, 0.50], [ 350,  100, 0.40], [-320,   50, 0.60], [ 180, -350, 0.30],
  [-230,  310, 0.45], [ 290, -310, 0.40], [  50,  340, 0.50], [-370, -180, 0.55],
  [ 130, -170, 0.35], [ -80,  280, 0.40], [ 370,  230, 0.50], [-240,  -70, 0.60],
  [ 260,  180, 0.35], [-120,  330, 0.50], [ 340, -100, 0.40], [ -60, -360, 0.60],
  [-380,  290, 0.30], [ 375, -340, 0.50], [  95,  385, 0.40], [-295, -375, 0.30],
  [ 200,  -80, 0.30], [-170,  140, 0.35], [ 300,   60, 0.30], [ -60, -190, 0.40],
  [-200,  200, 0.25], [ 160, -260, 0.35], [-330,  170, 0.30], [ 250, -150, 0.45],
];

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
        if (!r.ok) throw new Error(`Backend returned ${r.status} — restart the server to load /solar-system`);
        return r.json();
      })
      .then(d => {
        // Validate it looks like solar system data before using it
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

  return (
    <div className="solar-system-card">
      <div className="card-title">Solar System — Live Orbital Positions</div>
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
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background stars (night only) */}
          {theme === "night" && STARS.map(([sx, sy, op], i) => (
            <circle key={i} cx={sx} cy={sy} r={0.9} fill="white" opacity={op} />
          ))}

          {/* Orbit rings */}
          {ORBIT_AU.map(([name, au]) => (
            <circle
              key={name}
              cx={0} cy={0} r={scaleR(au)}
              fill="none" stroke={ringStroke} strokeWidth={0.8}
            />
          ))}

          {/* Moon orbit (small ring around Earth) */}
          {earthXY && (
            <circle
              cx={earthXY[0]} cy={earthXY[1]} r={10}
              fill="none" stroke={ringStroke} strokeWidth={0.6}
            />
          )}

          {/* Sun corona + body */}
          <circle cx={0} cy={0} r={28} fill="url(#sun-grad)" />
          <circle cx={0} cy={0} r={12} fill="#ffd700" filter="url(#body-glow)">
            <title>Sun</title>
          </circle>
          <text
            x={0} y={-19}
            textAnchor="middle" fontSize={10}
            fontFamily="Oxanium, sans-serif"
            fill="#ffd700" opacity={0.9}
          >
            Sun
          </text>

          {/* Moon: exaggerated orbit offset from Earth, connected by a line */}
          {data?.Moon && earthXY && (() => {
            const earth = data.Earth!;
            const dx = data.Moon.x_au - earth.x_au;
            const dy = data.Moon.y_au - earth.y_au;
            const dLen = Math.sqrt(dx * dx + dy * dy) || 1;
            const mx = earthXY[0] + 10 * (dx / dLen);
            const my = earthXY[1] - 10 * (dy / dLen);
            return (
              <g>
                <line
                  x1={earthXY[0]} y1={earthXY[1]}
                  x2={mx} y2={my}
                  stroke="#999" strokeWidth={0.5} opacity={0.4}
                />
                <circle cx={mx} cy={my} r={2} fill="#b8b8b8" filter="url(#body-glow)">
                  <title>Moon — {data.Moon.dist_au.toFixed(5)} AU from Earth</title>
                </circle>
                <text
                  x={mx} y={my - 5}
                  textAnchor="middle" fontSize={7}
                  fontFamily="Oxanium, sans-serif"
                  fill="#b8b8b8" opacity={0.75}
                >
                  Moon
                </text>
              </g>
            );
          })()}

          {/* Planets */}
          {data && Object.entries(data)
            .filter(([name]) => name !== "Moon" && STYLE[name])
            .map(([name, pos]) => {
              const cfg = STYLE[name];
              const [sx, sy] = toXY(pos.x_au, pos.y_au);
              // Push label radially outward from Sun for clean placement
              const angle = Math.atan2(pos.y_au, pos.x_au);
              const lr = cfg.r + 9;
              const lx = sx + lr * Math.cos(angle);
              const ly = sy - lr * Math.sin(angle);

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
                  {/* Label */}
                  <text
                    x={lx} y={ly + 3}
                    textAnchor="middle" fontSize={9}
                    fontFamily="Oxanium, sans-serif"
                    fill={cfg.color} opacity={0.88}
                  >
                    {name}
                  </text>
                </g>
              );
            })
          }
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
