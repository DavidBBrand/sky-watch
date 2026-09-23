import React, { memo } from "react";
import "./StargazingWindow.css";

interface SunInfo {
  sunrise?: string;
  sunset?: string;
  [key: string]: any;
}

interface StargazingWindowProps {
  skyData: {
    sun?: SunInfo;
    moon?: { illumination?: number };
    [key: string]: any;
  } | null;
  weatherData: {
    cloudcover?: number;
    visibility?: number;
    timezone?: string;
    error?: boolean;
    [key: string]: any;
  } | null;
}

interface Verdict {
  label: string;
  className: string;
}

// Cloud cover dominates (it's binary — clouds block everything), moon glow
// washes out fainter objects, visibility is a smaller tiebreaker signal.
const WEIGHTS = { cloud: 0.5, moon: 0.35, visibility: 0.15 };

function getVerdict(score: number): Verdict {
  if (score >= 75) return { label: "Excellent", className: "verdict-excellent" };
  if (score >= 55) return { label: "Good", className: "verdict-good" };
  if (score >= 35) return { label: "Fair", className: "verdict-fair" };
  return { label: "Poor", className: "verdict-poor" };
}

function formatTime(iso: string | undefined, tz: string | undefined): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz || undefined,
  });
}

const StargazingWindow: React.FC<StargazingWindowProps> = memo(({ skyData, weatherData }) => {
  const cloudCover = typeof weatherData?.cloudcover === "number" ? weatherData.cloudcover : null;
  const moonIllumination = typeof skyData?.moon?.illumination === "number" ? skyData.moon.illumination : null;
  const visibility = typeof weatherData?.visibility === "number" ? weatherData.visibility : null;

  const factors: { weight: number; score: number }[] = [];
  if (cloudCover !== null) factors.push({ weight: WEIGHTS.cloud, score: 100 - cloudCover });
  if (moonIllumination !== null) factors.push({ weight: WEIGHTS.moon, score: 100 - moonIllumination });
  // 10mi+ visibility is effectively "as good as it gets" for naked-eye/binocular viewing
  if (visibility !== null) factors.push({ weight: WEIGHTS.visibility, score: Math.min(visibility / 10, 1) * 100 });

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = totalWeight > 0
    ? Math.round(factors.reduce((sum, f) => sum + f.weight * f.score, 0) / totalWeight)
    : null;
  const verdict = score !== null ? getVerdict(score) : null;

  const sunset = formatTime(skyData?.sun?.sunset, weatherData?.timezone);
  const sunrise = formatTime(skyData?.sun?.sunrise, weatherData?.timezone);

  if (!skyData && !weatherData) {
    return (
      <div className="stargazing-container">
        <div className="card-title">Stargazing Window</div>
        <div className="stargazing-loading glow-sub">Reading sky conditions…</div>
      </div>
    );
  }

  return (
    <div className="stargazing-container">
      <div className="card-title">Stargazing Window</div>

      <div className="stargazing-window-range glow-sub2">
        {sunset} <span className="stargazing-arrow">→</span> {sunrise}
      </div>

      {verdict ? (
        <div className={`stargazing-verdict ${verdict.className}`}>
          <span className="stargazing-verdict-label">{verdict.label}</span>
          <span className="stargazing-verdict-score">{score}/100</span>
        </div>
      ) : (
        <div className="stargazing-verdict verdict-unknown">
          <span className="stargazing-verdict-label">Gathering Data…</span>
        </div>
      )}

      <div className="stargazing-factors">
        <div className="stargazing-factor">
          <span className="stargazing-factor-label">Cloud Cover</span>
          <span className="glow-sub2 stargazing-factor-value">
            {cloudCover !== null ? `${Math.round(cloudCover)}%` : "--"}
          </span>
        </div>
        <div className="stargazing-factor">
          <span className="stargazing-factor-label">Moon Glow</span>
          <span className="glow-sub2 stargazing-factor-value">
            {moonIllumination !== null ? `${Math.round(moonIllumination)}%` : "--"}
          </span>
        </div>
        <div className="stargazing-factor">
          <span className="stargazing-factor-label">Visibility</span>
          <span className="glow-sub2 stargazing-factor-value">
            {visibility !== null ? `${visibility} mi` : "--"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default StargazingWindow;
