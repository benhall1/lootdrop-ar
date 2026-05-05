import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chest3D, ChestRarity } from "./Chest3D.web";
import { LootBox, UserLocation } from "../types";
import { calculateDistance, formatDistance } from "../services/geolocation";
import { GamificationState } from "../services/gamificationService";

interface ARHudProps {
  lootBoxes: LootBox[];
  userLocation: UserLocation | null;
  gamification: GamificationState | null;
  onLootBoxTap: (box: LootBox) => void;
  onMapPress: () => void;
  onSearchPress?: () => void;
}

const RARITY_BY_INDEX: ChestRarity[] = ["gold", "epic", "silver", "bronze"];

const CHEST_POSITIONS = [
  { x: "22%", y: "35%", size: 70, delay: 0 },
  { x: "68%", y: "42%", size: 90, delay: 0.5 },
  { x: "50%", y: "62%", size: 60, delay: 1 },
  { x: "82%", y: "30%", size: 55, delay: 1.5 },
  { x: "14%", y: "58%", size: 65, delay: 2 },
];

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  const id = "lda-arhud-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @keyframes lda-arhud-scan {
      0% { top: 0%; opacity: 0; }
      10% { opacity: 0.7; }
      90% { opacity: 0.7; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes lda-arhud-twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

function StarsLayer() {
  const stars = useMemo(
    () =>
      Array.from({ length: 40 }).map(() => ({
        top: Math.random() * 50,
        left: Math.random() * 100,
        opacity: 0.3 + Math.random() * 0.7,
        delay: Math.random() * 4,
      })),
    []
  );
  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: "#fff",
            opacity: s.opacity,
            boxShadow: "0 0 4px #fff",
            animation: `lda-arhud-twinkle 3s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function MiniRadar({ boxes, user }: { boxes: LootBox[]; user: UserLocation | null }) {
  // Map up to 5 closest boxes onto a 110x110 minimap; user at center.
  const dots = useMemo(() => {
    if (!user) return [];
    const maxKm = 2;
    return boxes.slice(0, 5).map((b, i) => {
      const dKm = calculateDistance(user, { latitude: b.latitude, longitude: b.longitude });
      const r = Math.min(45, (dKm / maxKm) * 45); // pixel radius from center (max 45 of 55)
      const dLon = b.longitude - user.longitude;
      const dLat = b.latitude - user.latitude;
      const angle = Math.atan2(dLon, dLat); // 0 = north
      const x = 50 + (r / 55) * 50 * Math.sin(angle);
      const y = 50 - (r / 55) * 50 * Math.cos(angle);
      const rarity: ChestRarity = RARITY_BY_INDEX[i % RARITY_BY_INDEX.length];
      const color =
        rarity === "gold"
          ? "#FFD54F"
          : rarity === "epic"
          ? "#C77DFF"
          : rarity === "silver"
          ? "#C0CAE0"
          : "#E89B5E";
      return { x, y, color };
    });
  }, [boxes, user]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 14,
        width: 110,
        height: 110,
        borderRadius: 16,
        overflow: "hidden",
        zIndex: 30,
        border: "1.5px solid rgba(0,229,255,0.5)",
        boxShadow: "0 0 24px rgba(0,229,255,0.3), inset 0 0 24px rgba(0,229,255,0.1)",
        background:
          "radial-gradient(circle at center, rgba(0,229,255,0.08) 0%, rgba(7,9,26,0.95) 70%)",
      }}
    >
      {/* concentric rings */}
      <svg viewBox="0 0 110 110" width="110" height="110" style={{ position: "absolute", inset: 0 }}>
        <circle cx="55" cy="55" r="50" fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
        <circle cx="55" cy="55" r="33" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" />
        <circle cx="55" cy="55" r="16" fill="none" stroke="rgba(0,229,255,0.12)" strokeWidth="1" />
        <line x1="55" y1="5" x2="55" y2="105" stroke="rgba(0,229,255,0.1)" strokeWidth="1" />
        <line x1="5" y1="55" x2="105" y2="55" stroke="rgba(0,229,255,0.1)" strokeWidth="1" />
      </svg>
      {/* sweep */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(0,229,255,0.45) 350deg, transparent 360deg)",
          animation: "lda-radar-sweep 3s linear infinite",
        }}
      />
      {/* user dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 10,
          height: 10,
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          background: "#00E5FF",
          boxShadow: "0 0 12px #00E5FF, 0 0 24px #00E5FF",
        }}
      />
      {/* loot dots */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `${d.y}%`,
            left: `${d.x}%`,
            width: 8,
            height: 8,
            borderRadius: "50%",
            transform: "translate(-50%,-50%)",
            background: d.color,
            boxShadow: `0 0 10px ${d.color}`,
            animation: "lda-pulse-glow 1.5s ease-in-out infinite",
          }}
        />
      ))}
      {/* label */}
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 6,
          fontFamily: "'Nunito', system-ui, sans-serif",
          fontSize: 9,
          fontWeight: 900,
          color: "#00E5FF",
          letterSpacing: 1,
        }}
      >
        RADAR
      </div>
    </div>
  );
}

function HudPill({
  label,
  value,
  color,
  glow,
}: {
  label: string;
  value: string;
  color: string;
  glow: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(15,19,38,0.8)",
        backdropFilter: "blur(10px)",
        border: `1.5px solid ${color}55`,
        boxShadow: `0 0 12px ${glow}`,
        fontFamily: "'Nunito', sans-serif",
        fontSize: 12,
        fontWeight: 900,
        color: "#fff",
        letterSpacing: 0.5,
      }}
    >
      <span style={{ color, fontSize: 11, letterSpacing: 1 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ARHud({
  lootBoxes,
  userLocation,
  gamification,
  onLootBoxTap,
  onMapPress,
  onSearchPress,
}: ARHudProps) {
  ensureKeyframes();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const closest = useMemo(() => {
    if (!userLocation) return lootBoxes.slice(0, 3);
    return [...lootBoxes]
      .sort((a, b) => {
        const dA = calculateDistance(userLocation, { latitude: a.latitude, longitude: a.longitude });
        const dB = calculateDistance(userLocation, { latitude: b.latitude, longitude: b.longitude });
        return dA - dB;
      })
      .slice(0, 3);
  }, [lootBoxes, userLocation, now]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#0a0d1c",
        userSelect: "none",
      }}
    >
      {/* Sky / camera-feed simulation */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #1a2150 0%, #2d1b4e 35%, #4a1f3d 65%, #1a0f2e 100%)",
        }}
      >
        <StarsLayer />
        {/* city skyline */}
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: "35%",
            left: 0,
            right: 0,
            height: "25%",
            width: "100%",
          }}
        >
          <path
            d="M0 200 L0 140 L20 140 L20 100 L40 100 L40 130 L60 130 L60 80 L75 80 L75 110 L95 110 L95 90 L115 90 L115 120 L135 120 L135 70 L155 70 L155 100 L175 100 L175 130 L195 130 L195 95 L215 95 L215 75 L235 75 L235 110 L255 110 L255 130 L275 130 L275 90 L295 90 L295 115 L315 115 L315 85 L335 85 L335 125 L355 125 L355 100 L375 100 L375 140 L400 140 L400 200 Z"
            fill="#0a0d1c"
            opacity="0.85"
          />
        </svg>
        {/* ground */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "35%",
            background: "linear-gradient(180deg, #1a0f2e 0%, #07091A 100%)",
          }}
        />
      </div>

      {/* scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, #00E5FF, transparent)",
          boxShadow: "0 0 12px #00E5FF, 0 0 32px #00E5FF",
          zIndex: 5,
          animation: "lda-arhud-scan 5s linear infinite",
        }}
      />

      {/* center crosshair */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 60,
          height: 60,
          zIndex: 6,
          pointerEvents: "none",
        }}
      >
        <svg viewBox="0 0 60 60" width="60" height="60">
          <circle
            cx="30"
            cy="30"
            r="28"
            fill="none"
            stroke="rgba(0,229,255,0.6)"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
          <path
            d="M30 5v15M30 40v15M5 30h15M40 30h15"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="30" cy="30" r="3" fill="#00E5FF" />
        </svg>
      </div>

      {/* Floating chests */}
      {closest.map((box, i) => {
        const pos = CHEST_POSITIONS[i] || CHEST_POSITIONS[0];
        const rarity: ChestRarity = RARITY_BY_INDEX[i % RARITY_BY_INDEX.length];
        const distance = userLocation
          ? calculateDistance(userLocation, {
              latitude: box.latitude,
              longitude: box.longitude,
            })
          : 0;
        return (
          <div
            key={box.id}
            onClick={() => onLootBoxTap(box)}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              cursor: "pointer",
              opacity: box.isActive ? 1 : 0.5,
            }}
          >
            <Chest3D size={pos.size} rarity={rarity} floating />
            {/* distance pill */}
            <div
              style={{
                position: "absolute",
                top: -28,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "3px 10px",
                background: "rgba(7,9,26,0.85)",
                border: "1.5px solid #00E5FF",
                borderRadius: 999,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 900,
                fontSize: 11,
                color: "#00E5FF",
                whiteSpace: "nowrap",
                boxShadow: "0 0 12px rgba(0,229,255,0.4)",
                letterSpacing: 0.5,
              }}
            >
              {formatDistance(distance)}
            </div>
            {/* name tag */}
            <div
              style={{
                position: "absolute",
                top: pos.size + 4,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "2px 8px",
                background: "rgba(7,9,26,0.7)",
                borderRadius: 6,
                fontFamily: "'Nunito', sans-serif",
                fontSize: 10,
                fontWeight: 800,
                color: "#fff",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {box.businessName}
            </div>
          </div>
        );
      })}

      {/* Top HUD pills */}
      {gamification && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 14,
            right: 14,
            display: "flex",
            gap: 8,
            justifyContent: "flex-start",
            flexWrap: "wrap",
            zIndex: 30,
          }}
        >
          <HudPill
            label="🔥"
            value={`${gamification.streak}d`}
            color="#FF6D3A"
            glow="rgba(255,109,58,0.45)"
          />
          <HudPill
            label="LV"
            value={`${gamification.level}`}
            color="#FFD54F"
            glow="rgba(255,213,79,0.45)"
          />
          <HudPill
            label="XP"
            value={`${gamification.xp}`}
            color="#00E5FF"
            glow="rgba(0,229,255,0.45)"
          />
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {onSearchPress && (
              <button
                onClick={onSearchPress}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(15,19,38,0.8)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
                aria-label="Search"
              >
                🔍
              </button>
            )}
          </div>
        </div>
      )}

      {/* Center prompt */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 25,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 11,
            fontWeight: 900,
            color: "#00E5FF",
            letterSpacing: 2,
            textShadow: "0 0 12px rgba(0,229,255,0.45)",
          }}
        >
          SCANNING NEARBY
        </div>
        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 26,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 0.5,
            textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,229,255,0.45)",
            marginTop: 2,
          }}
        >
          {lootBoxes.length} LOOT {lootBoxes.length === 1 ? "DROP" : "DROPS"}
        </div>
      </div>

      {/* Mini radar */}
      <MiniRadar boxes={closest} user={userLocation} />

      {/* Map button bottom-right */}
      <button
        onClick={onMapPress}
        style={{
          position: "absolute",
          bottom: 24,
          right: 14,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #00E5FF 0%, #00B8D4 100%)",
          border: "1.5px solid rgba(255,255,255,0.4)",
          color: "#07091A",
          cursor: "pointer",
          boxShadow: "0 4px 0 #006978, 0 0 24px rgba(0,229,255,0.55)",
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 30,
          fontWeight: 900,
        }}
        aria-label="Open map"
      >
        🗺️
      </button>
    </div>
  );
}

export default ARHud;
