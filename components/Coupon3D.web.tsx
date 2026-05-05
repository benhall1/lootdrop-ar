import React, { useEffect, useRef, useState } from "react";

export interface Coupon3DData {
  business: string;
  deal: string;
  sub?: string;
  code: string;
  expires: string;
  logo?: string;
  color?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

interface Coupon3DProps {
  data: Coupon3DData;
  width?: number;
  height?: number;
  autoSpin?: boolean;
}

const RARITY_LABEL: Record<NonNullable<Coupon3DData["rarity"]>, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "★ EPIC",
  legendary: "★ LEGENDARY",
};

export function Coupon3D({
  data,
  width = 280,
  height = 380,
  autoSpin = false,
}: Coupon3DProps) {
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const [spinning, setSpinning] = useState(autoSpin);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ x: number; y: number; rotY: number; rotX: number } | null>(null);

  useEffect(() => {
    if (!spinning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      setRotY((y) => y + 0.7);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spinning]);

  const onPointerDown = (e: React.PointerEvent) => {
    setSpinning(false);
    dragRef.current = { x: e.clientX, y: e.clientY, rotY, rotX };
    const onMove = (ev: PointerEvent) => {
      const start = dragRef.current;
      if (!start) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      setRotY(start.rotY + dx * 0.6);
      setRotX(Math.max(-25, Math.min(25, start.rotX - dy * 0.4)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const color = data.color || "#FF6D3A";
  const rarity = data.rarity || "legendary";

  return (
    <div
      style={{
        perspective: "1200px",
        width,
        height,
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: spinning ? "none" : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* FRONT */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            borderRadius: 22,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${color} 0%, #E64A19 100%)`,
            border: "2px solid rgba(255,255,255,0.3)",
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 60px ${color}55, inset 0 2px 0 rgba(255,255,255,0.3)`,
            padding: 22,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* shine */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.15) 100%)",
              pointerEvents: "none",
            }}
          />
          {/* perforation */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "70%",
              borderTop: "2px dashed rgba(255,255,255,0.4)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: -10,
              top: "70%",
              transform: "translateY(-50%)",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#0C0F1A",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -10,
              top: "70%",
              transform: "translateY(-50%)",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#0C0F1A",
            }}
          />
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Lilita One', cursive",
                fontSize: 18,
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}
            >
              {data.logo || data.business.slice(0, 2).toUpperCase()}
            </div>
            <div
              style={{
                padding: "4px 8px",
                background: "rgba(0,0,0,0.3)",
                backdropFilter: "blur(10px)",
                borderRadius: 999,
                fontFamily: "'Nunito', sans-serif",
                fontSize: 9,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {RARITY_LABEL[rarity]}
            </div>
          </div>
          {/* Business name */}
          <div
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11,
              fontWeight: 800,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: "auto",
            }}
          >
            {data.business}
          </div>
          {/* Big deal */}
          <div
            style={{
              fontFamily: "'Lilita One', cursive",
              fontSize: 64,
              color: "#fff",
              letterSpacing: -2,
              lineHeight: 0.9,
              textShadow:
                "0 4px 0 rgba(0,0,0,0.25), 0 0 24px rgba(255,255,255,0.3)",
              marginTop: 4,
            }}
          >
            {data.deal}
          </div>
          {data.sub && (
            <div
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                marginTop: 2,
              }}
            >
              {data.sub}
            </div>
          )}
          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "auto",
              paddingTop: 26,
              position: "relative",
              zIndex: 2,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Expires
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {data.expires}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Code
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {data.code}
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 22,
            overflow: "hidden",
            background: "linear-gradient(135deg, #181D38 0%, #0F1326 100%)",
            border: "2px solid rgba(255,213,79,0.3)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6), 0 0 60px rgba(255,213,79,0.3), inset 0 2px 0 rgba(255,255,255,0.1)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Lilita One', cursive",
              fontSize: 16,
              color: "#FFD54F",
              letterSpacing: 1,
              textShadow: "0 0 16px rgba(255,213,79,0.55)",
            }}
          >
            HOW TO REDEEM
          </div>
          <div style={{ borderTop: "1px solid rgba(255,213,79,0.2)" }} />
          {[
            ["1", `Visit ${data.business}`],
            ["2", "Show this coupon at checkout"],
            ["3", "Have cashier scan QR"],
          ].map(([n, t]) => (
            <div
              key={n}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "rgba(255,213,79,0.15)",
                  border: "1px solid rgba(255,213,79,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Lilita One', cursive",
                  color: "#FFD54F",
                  fontSize: 12,
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#8E96C8",
                }}
              >
                {t}
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 110,
                height: 110,
                background: "#fff",
                borderRadius: 12,
                padding: 8,
                display: "grid",
                gridTemplateColumns: "repeat(11, 1fr)",
                gap: 1,
              }}
            >
              {Array.from({ length: 121 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background:
                      ((i * 31 + 7) % 100) > 50 ? "#000" : "#fff",
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: "#8E96C8",
              letterSpacing: 0.5,
            }}
          >
            {data.code}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Coupon3D;
