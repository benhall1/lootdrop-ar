import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Injects Google Fonts into <head> on web.
 * Uses Lilita One (display headings), Nunito (body), JetBrains Mono (codes/timers).
 * No-op on native platforms.
 */
export function WebFontLoader() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const FONT_ID = "lootdrop-fonts";
    if (document.getElementById(FONT_ID)) return;

    // Preconnect for speed
    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect);

    const preconnectStatic = document.createElement("link");
    preconnectStatic.rel = "preconnect";
    preconnectStatic.href = "https://fonts.gstatic.com";
    preconnectStatic.crossOrigin = "anonymous";
    document.head.appendChild(preconnectStatic);

    // Load fonts
    const link = document.createElement("link");
    link.id = FONT_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap";
    document.head.appendChild(link);

    // Add global styles for the game-like feel
    const style = document.createElement("style");
    style.textContent = `
      * { -webkit-tap-highlight-color: transparent; }
      body { overflow: hidden; }

      @keyframes lootdrop-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
      }

      @keyframes lootdrop-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }

      @keyframes lootdrop-shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      @keyframes lootdrop-glow {
        0%, 100% { box-shadow: 0 0 8px rgba(255, 109, 58, 0.3); }
        50% { box-shadow: 0 0 20px rgba(255, 109, 58, 0.6); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
