import React, { useId } from "react";

// Detailed planet artwork shared between the Planets card and the Solar System
// orbital map. Each icon is authored around a native center/radius and
// repositioned/rescaled via an SVG transform, so it drops in at any (cx, cy, r).
// Gradient/filter/clip-path ids are namespaced per-instance via useId() so
// multiple copies of the same planet can render on the same page without
// colliding (e.g. Planets card + Solar System card mounted simultaneously).

interface IconProps {
  cx: number;
  cy: number;
  r: number;
}

// Tycho's ray system is the Moon's most recognizable naked-eye feature —
// a young, bright crater in the southern highlands with rays streaking out
// across a third of the visible disc.
const TYCHO_RAY_ANGLES = [10, 35, 58, 80, 105, 130, 158, 190, 215, 245, 275, 305, 330, 350];

export const MoonIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  const tychoX = 46;
  const tychoY = 78;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        {/* Same pale-cream hue family as the Moon card's phase graphic (#fefcd7) */}
        <radialGradient id={`${uid}-g`} cx="36%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#fffbe4" />
          <stop offset="35%"  stopColor="#fefcd7" />
          <stop offset="70%"  stopColor="#d8cfa0" />
          <stop offset="100%" stopColor="#a89860" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          {/* Maria — the large dark "seas" that form the Moon's naked-eye pattern */}
          <ellipse cx="35" cy="32" rx="14" ry="11" fill="rgba(90,80,58,0.38)" />
          <ellipse cx="52" cy="29" rx="9"  ry="8"  fill="rgba(90,80,58,0.34)" />
          <ellipse cx="58" cy="43" rx="10" ry="8"  fill="rgba(90,80,58,0.36)" />
          <ellipse cx="60" cy="55" rx="5"  ry="4"  fill="rgba(90,80,58,0.30)" />
          <ellipse cx="25" cy="50" rx="12" ry="16" fill="rgba(90,80,58,0.32)" />
          <ellipse cx="70" cy="36" rx="6"  ry="5"  fill="rgba(90,80,58,0.34)" />
          <ellipse cx="29" cy="63" rx="6"  ry="5"  fill="rgba(90,80,58,0.28)" />
          <ellipse cx="39" cy="61" rx="7"  ry="5.5" fill="rgba(90,80,58,0.26)" />

          {/* Copernicus — bright rayed crater in the northern mid-latitudes */}
          <circle cx="38" cy="52" r="3" fill="rgba(120,108,78,0.55)" />
          <circle cx="37.3" cy="51.3" r="1.6" fill="rgba(255,250,225,0.5)" />
          {[20, 65, 110, 160, 200, 250, 300, 340].map(a => {
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={38 + Math.cos(rad) * 3.5}
                y1={52 + Math.sin(rad) * 3.5}
                x2={38 + Math.cos(rad) * 11}
                y2={52 + Math.sin(rad) * 11}
                stroke="rgba(255,250,225,0.28)"
                strokeWidth={0.6}
              />
            );
          })}

          {/* Small plain craters for surface texture */}
          <circle cx="55" cy="65" r="2" fill="rgba(120,108,78,0.4)" />
          <circle cx="42" cy="25" r="1.6" fill="rgba(120,108,78,0.4)" />
          <circle cx="65" cy="60" r="2.2" fill="rgba(120,108,78,0.4)" />
          <circle cx="48" cy="38" r="1.4" fill="rgba(120,108,78,0.4)" />
          <circle cx="22" cy="34" r="1.8" fill="rgba(120,108,78,0.35)" />

          {/* Tycho — bright young crater with a prominent radiating ray system */}
          {TYCHO_RAY_ANGLES.map(a => {
            const rad = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={tychoX + Math.cos(rad) * 3}
                y1={tychoY + Math.sin(rad) * 3}
                x2={tychoX + Math.cos(rad) * 30}
                y2={tychoY + Math.sin(rad) * 30}
                stroke="rgba(255,252,235,0.4)"
                strokeWidth={0.5}
              />
            );
          })}
          <circle cx={tychoX} cy={tychoY} r="4" fill="rgba(255,252,235,0.55)" />
          <circle cx={tychoX - 0.6} cy={tychoY - 0.6} r="2.2" fill="rgba(130,116,84,0.5)" />
        </g>
      </g>
    </g>
  );
};

export const MercuryIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="36%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#d8d2c8" />
          <stop offset="35%" stopColor="#aca290" />
          <stop offset="70%" stopColor="#7c7264" />
          <stop offset="100%" stopColor="#463f34" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <circle cx="34" cy="40" r="7" fill="rgba(50,44,36,0.3)" />
          <circle cx="60" cy="30" r="4.5" fill="rgba(50,44,36,0.25)" />
          <circle cx="65" cy="60" r="9" fill="rgba(50,44,36,0.28)" />
          <circle cx="40" cy="66" r="5" fill="rgba(50,44,36,0.22)" />
        </g>
      </g>
    </g>
  );
};

export const VenusIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#fffde8" />
          <stop offset="30%" stopColor="#f5e098" />
          <stop offset="65%" stopColor="#d4a832" />
          <stop offset="100%" stopColor="#8a6015" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} filter={`url(#${uid}-glow)`} />
      <ellipse cx="50" cy="36" rx="40" ry="5" fill="rgba(255,255,255,0.12)" />
      <ellipse cx="50" cy="52" rx="38" ry="4" fill="rgba(255,255,255,0.08)" />
      <ellipse cx="50" cy="67" rx="32" ry="3.5" fill="rgba(255,255,255,0.09)" />
    </g>
  );
};

export const EarthIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#bfe8ff" />
          <stop offset="35%" stopColor="#4fa8e0" />
          <stop offset="72%" stopColor="#1a5f9e" />
          <stop offset="100%" stopColor="#0a2f52" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <ellipse cx="32" cy="38" rx="14" ry="9" fill="rgba(60,140,60,0.75)" />
          <ellipse cx="62" cy="30" rx="9" ry="6" fill="rgba(70,150,65,0.65)" />
          <ellipse cx="60" cy="66" rx="16" ry="10" fill="rgba(60,140,60,0.7)" />
          <ellipse cx="50" cy="24" rx="30" ry="5" fill="rgba(255,255,255,0.35)" />
          <ellipse cx="42" cy="58" rx="26" ry="4.5" fill="rgba(255,255,255,0.25)" />
        </g>
      </g>
    </g>
  );
};

export const MarsIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="36%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#e07248" />
          <stop offset="30%"  stopColor="#c1440e" />
          <stop offset="70%"  stopColor="#8a2a06" />
          <stop offset="100%" stopColor="#541602" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <ellipse cx="34" cy="38" rx="15" ry="11" fill="rgba(36,7,1,0.42)" />
          <ellipse cx="65" cy="56" rx="13" ry="9"  fill="rgba(33,6,1,0.38)" />
          <ellipse cx="60" cy="72" rx="11" ry="8"  fill="rgba(28,5,1,0.35)" />
          <ellipse cx="50" cy="44" rx="13" ry="9"  fill="rgba(220,115,58,0.13)" />
          <ellipse cx="28" cy="50" rx="9"  ry="7"  fill="rgba(215,110,55,0.10)" />
          <ellipse cx="50" cy="10"   rx="15" ry="5.8" fill="rgba(245,250,255,0.84)" />
          <ellipse cx="50" cy="10"   rx="11" ry="4"   fill="rgba(210,230,250,0.72)" />
          <ellipse cx="48" cy="11.5" rx="7"  ry="2.6" fill="rgba(175,210,242,0.48)" />
        </g>
      </g>
    </g>
  );
};

export const JupiterIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-sphere`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,240,210,0.45)" />
          <stop offset="100%" stopColor="rgba(50,20,0,0.65)" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <g clipPath={`url(#${uid}-clip)`}>
          <rect x="0" y="0" width="100" height="100" fill="#d4a860" />
          <rect x="0" y="7" width="100" height="10" fill="#e0c080" opacity="0.65" />
          <rect x="0" y="19" width="100" height="8" fill="#6b3e1e" opacity="0.85" />
          <rect x="0" y="27" width="100" height="7" fill="#f0d090" opacity="0.75" />
          <rect x="0" y="34" width="100" height="12" fill="#7a4825" opacity="0.9" />
          <rect x="0" y="46" width="100" height="10" fill="#f5e0a0" opacity="0.8" />
          <rect x="0" y="56" width="100" height="12" fill="#7a4825" opacity="0.9" />
          <rect x="0" y="68" width="100" height="7" fill="#e8c880" opacity="0.65" />
          <rect x="0" y="75" width="100" height="7" fill="#6b3a1a" opacity="0.8" />
          <rect x="0" y="82" width="100" height="11" fill="#c8a060" opacity="0.55" />
          <circle cx="50" cy="50" r="43" fill={`url(#${uid}-sphere)`} />
          <ellipse cx="65" cy="62" rx="12" ry="6.5" fill="#c03820" opacity="0.88" />
          <ellipse cx="65" cy="62" rx="8" ry="4" fill="#d84830" opacity="0.55" />
        </g>
      </g>
    </g>
  );
};

export const SaturnIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 34;
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(26.73) scale(${scale}) translate(-80, -46)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="38%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#fdf6dc" />
          <stop offset="15%"  stopColor="#f5e4a8" />
          <stop offset="40%"  stopColor="#e8c870" />
          <stop offset="68%"  stopColor="#c49a38" />
          <stop offset="88%"  stopColor="#9a7020" />
          <stop offset="100%" stopColor="#6a4c10" />
        </radialGradient>
        <radialGradient id={`${uid}-limb`} cx="80" cy="46" r="34" gradientUnits="userSpaceOnUse">
          <stop offset="65%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-sphere-clip`}>
          <circle cx="80" cy="46" r="34" />
        </clipPath>
        <clipPath id={`${uid}-back-ring-clip`}>
          <path clipRule="evenodd" d="M -10,-10 H 170 V 110 H -10 Z M 80,12 A 34,34 0 0 1 114,46 A 34,34 0 0 1 80,80 A 34,34 0 0 1 46,46 A 34,34 0 0 1 80,12 Z" />
        </clipPath>
        <clipPath id={`${uid}-front-ring-clip`}>
          <rect x="0" y="48" width="160" height="52" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <ellipse cx="80" cy="54" rx="46.4" ry="9.77"  fill="none" stroke="rgba(180,162,118,0.26)" strokeWidth="9.7"  clipPath={`url(#${uid}-back-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="58.3" ry="12.27" fill="none" stroke="rgba(242,225,165,0.84)" strokeWidth="14.1" clipPath={`url(#${uid}-back-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="52"   ry="10.95" fill="none" stroke="rgba(255,245,195,0.32)" strokeWidth="2"    clipPath={`url(#${uid}-back-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="66.5" ry="14.0"  fill="none" stroke="rgba(4,2,0,0.92)"       strokeWidth="2.3"  clipPath={`url(#${uid}-back-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="71.9" ry="15.13" fill="none" stroke="rgba(218,196,136,0.68)" strokeWidth="8.4"  clipPath={`url(#${uid}-back-ring-clip)`} />
        <circle cx="80" cy="46" r="34" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-sphere-clip)`}>
          <ellipse cx="80" cy="58" rx="34"  ry="5.5" fill="rgba(0,0,0,0.24)" />
          <ellipse cx="80" cy="30" rx="32"  ry="3"   fill="rgba(255,238,165,0.15)" />
          <ellipse cx="80" cy="38" rx="33"  ry="2.5" fill="rgba(185,145,55,0.2)" />
          <ellipse cx="80" cy="46" rx="33"  ry="3"   fill="rgba(228,185,85,0.13)" />
          <ellipse cx="80" cy="53" rx="32"  ry="2.2" fill="rgba(160,120,34,0.18)" />
          <circle  cx="80" cy="46" r="34"            fill={`url(#${uid}-limb)`} />
        </g>
        <ellipse cx="80" cy="54" rx="46.4" ry="9.77"  fill="none" stroke="rgba(180,162,118,0.28)" strokeWidth="9.7"  clipPath={`url(#${uid}-front-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="58.3" ry="12.27" fill="none" stroke="rgba(248,230,170,0.90)" strokeWidth="14.1" clipPath={`url(#${uid}-front-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="52"   ry="10.95" fill="none" stroke="rgba(255,245,195,0.35)" strokeWidth="2"    clipPath={`url(#${uid}-front-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="66.5" ry="14.0"  fill="none" stroke="rgba(4,2,0,0.92)"       strokeWidth="2.3"  clipPath={`url(#${uid}-front-ring-clip)`} />
        <ellipse cx="80" cy="54" rx="71.9" ry="15.13" fill="none" stroke="rgba(220,198,138,0.72)" strokeWidth="8.4"  clipPath={`url(#${uid}-front-ring-clip)`} />
      </g>
    </g>
  );
};

export const UranusIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="36%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#d8f8f8" />
          <stop offset="30%" stopColor="#82e0e8" />
          <stop offset="70%" stopColor="#3ab0ba" />
          <stop offset="100%" stopColor="#1a6870" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      {/* Uranus is tipped ~98° on its side, so its rings and cloud bands
          appear near-vertical rather than horizontal like other planets. */}
      <g filter={`url(#${uid}-glow)`} transform="rotate(98, 50, 50)">
        <ellipse cx="50" cy="50" rx="49" ry="7" fill="none" stroke="rgba(180,240,240,0.45)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <ellipse cx="50" cy="33" rx="40" ry="4" fill="rgba(255,255,255,0.1)" />
          <ellipse cx="50" cy="50" rx="39" ry="3.5" fill="rgba(255,255,255,0.07)" />
          <ellipse cx="50" cy="66" rx="36" ry="3" fill="rgba(255,255,255,0.06)" />
        </g>
      </g>
    </g>
  );
};

export const NeptuneIcon: React.FC<IconProps> = ({ cx, cy, r }) => {
  const uid = useId();
  const scale = r / 43;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale}) translate(-50, -50)`}>
      <defs>
        <radialGradient id={`${uid}-g`} cx="36%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#80c8f8" />
          <stop offset="30%" stopColor="#1878d8" />
          <stop offset="70%" stopColor="#0848a0" />
          <stop offset="100%" stopColor="#042060" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id={`${uid}-clip`}>
          <circle cx="50" cy="50" r="43" />
        </clipPath>
      </defs>
      <g filter={`url(#${uid}-glow)`}>
        <circle cx="50" cy="50" r="43" fill={`url(#${uid}-g)`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <ellipse cx="50" cy="30" rx="40" ry="5" fill="rgba(100,180,255,0.18)" />
          <ellipse cx="50" cy="48" rx="39" ry="4" fill="rgba(100,180,255,0.13)" />
          <ellipse cx="50" cy="64" rx="37" ry="3.5" fill="rgba(0,0,80,0.18)" />
          <ellipse cx="38" cy="46" rx="11" ry="7" fill="rgba(0,0,60,0.52)" />
          <ellipse cx="38" cy="46" rx="7" ry="4.5" fill="rgba(0,0,40,0.38)" />
          <ellipse cx="56" cy="34" rx="8" ry="2.5" fill="rgba(255,255,255,0.22)" />
          <ellipse cx="63" cy="56" rx="6" ry="2" fill="rgba(255,255,255,0.18)" />
        </g>
      </g>
    </g>
  );
};

export const PLANET_ICONS: Record<string, React.FC<IconProps>> = {
  Mercury: MercuryIcon,
  Venus: VenusIcon,
  Earth: EarthIcon,
  Mars: MarsIcon,
  Jupiter: JupiterIcon,
  Saturn: SaturnIcon,
  Uranus: UranusIcon,
  Neptune: NeptuneIcon,
};
