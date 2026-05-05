import React from "react";

export type ChestRarity = "gold" | "silver" | "bronze" | "epic";

interface Chest3DProps {
  size?: number;
  rarity?: ChestRarity;
  floating?: boolean;
  opening?: boolean;
}

const COLORS: Record<
  ChestRarity,
  { top: string; mid: string; dark: string; strap: string; glow: string }
> = {
  gold: {
    top: "#FFD54F",
    mid: "#FFB300",
    dark: "#8B6500",
    strap: "#5A3F00",
    glow: "#FFD54F",
  },
  silver: {
    top: "#E8EDF7",
    mid: "#9CA8C0",
    dark: "#5A6378",
    strap: "#2D3540",
    glow: "#C0CAE0",
  },
  bronze: {
    top: "#E89B5E",
    mid: "#B86F30",
    dark: "#6B3D14",
    strap: "#3D2208",
    glow: "#E89B5E",
  },
  epic: {
    top: "#E0AAFF",
    mid: "#9D4EDD",
    dark: "#5A189A",
    strap: "#240046",
    glow: "#C77DFF",
  },
};

const KEYFRAMES_ID = "lda-chest-keyframes";

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes lda-float {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-12px) rotate(2deg); }
    }
    @keyframes lda-pulse-glow {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes lda-particle-rise {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-80px) scale(0.3); opacity: 0; }
    }
    @keyframes lda-radar-sweep {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes lda-bounce-in {
      0% { transform: scale(0.3); opacity: 0; }
      60% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes lda-spin-y {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export function Chest3D({
  size = 80,
  rarity = "gold",
  floating = true,
  opening = false,
}: Chest3DProps) {
  ensureKeyframes();
  const c = COLORS[rarity];
  const gradId = `chest-${rarity}-${size}`;
  const wrapStyle: React.CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    display: "inline-block",
    animation: floating ? "lda-float 3.5s ease-in-out infinite" : undefined,
  };

  return (
    <div style={wrapStyle}>
      {/* glow halo */}
      <div
        style={{
          position: "absolute",
          inset: -size * 0.3,
          background: `radial-gradient(circle, ${c.glow}99 0%, ${c.glow}00 60%)`,
          filter: "blur(8px)",
          animation: "lda-pulse-glow 2.5s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          position: "relative",
          filter: `drop-shadow(0 6px 0 rgba(0,0,0,0.4)) drop-shadow(0 0 16px ${c.glow}aa)`,
        }}
      >
        <defs>
          <linearGradient id={`${gradId}-top`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.top} />
            <stop offset="1" stopColor={c.mid} />
          </linearGradient>
          <linearGradient id={`${gradId}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.mid} />
            <stop offset="1" stopColor={c.dark} />
          </linearGradient>
        </defs>
        <rect
          x="14"
          y="44"
          width="72"
          height="40"
          rx="4"
          fill={`url(#${gradId}-body)`}
          stroke={c.dark}
          strokeWidth="2"
        />
        <g
          style={{
            transformOrigin: "50px 44px",
            transform: opening ? "rotate(-35deg)" : "rotate(0)",
            transition: "transform 0.6s",
          }}
        >
          <path
            d="M14 44 Q14 22 50 22 Q86 22 86 44 Z"
            fill={`url(#${gradId}-top)`}
            stroke={c.dark}
            strokeWidth="2"
          />
          <path
            d="M22 36 Q26 28 50 28 Q74 28 78 36"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <rect x="46" y="22" width="8" height="62" fill={c.strap} />
        <rect x="14" y="56" width="72" height="6" fill={c.strap} />
        <rect
          x="44"
          y="50"
          width="12"
          height="14"
          rx="2"
          fill={c.top}
          stroke={c.dark}
          strokeWidth="1.5"
        />
        <circle cx="50" cy="56" r="2" fill={c.dark} />
        {[
          [18, 48],
          [78, 48],
          [18, 78],
          [78, 78],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill={c.top}
            stroke={c.dark}
            strokeWidth="1"
          />
        ))}
        {opening && (
          <g>
            <circle cx="50" cy="40" r="3" fill="#fff" opacity="0.9" />
            <circle cx="35" cy="35" r="2" fill="#FFE082" opacity="0.8" />
            <circle cx="65" cy="38" r="2.5" fill="#FFE082" opacity="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
}

export default Chest3D;
