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

    // PWA meta tags
    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#0C0F1A";
    document.head.appendChild(themeColor);

    const appleMeta = document.createElement("meta");
    appleMeta.name = "apple-mobile-web-app-capable";
    appleMeta.content = "yes";
    document.head.appendChild(appleMeta);

    const appleStatus = document.createElement("meta");
    appleStatus.name = "apple-mobile-web-app-status-bar-style";
    appleStatus.content = "black-translucent";
    document.head.appendChild(appleStatus);

    // Global styles: game-like atmosphere, custom scrollbar, noise texture
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --ld-primary: #FF6D3A;
        --ld-gold: #FFD54F;
        --ld-cyan: #00E5FF;
        --ld-bg: #0C0F1A;
        --ld-glow: rgba(255, 109, 58, 0.35);
      }

      * {
        -webkit-tap-highlight-color: transparent;
        box-sizing: border-box;
      }

      body {
        overflow: hidden;
        background: var(--ld-bg);
      }

      /* Subtle noise texture overlay on the root */
      #root::before {
        content: '';
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        background-size: 256px 256px;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.4;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 109, 58, 0.25);
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 109, 58, 0.5);
      }

      /* Selection color */
      ::selection {
        background: rgba(255, 109, 58, 0.3);
        color: #FFD54F;
      }

      /* Smooth transitions on interactive elements */
      [role="button"], button, a {
        transition: transform 0.15s ease, opacity 0.15s ease;
      }

      /* Ambient keyframes */
      @keyframes lootdrop-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
      }

      @keyframes lootdrop-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }

      @keyframes lootdrop-shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      @keyframes lootdrop-glow {
        0%, 100% { box-shadow: 0 0 8px var(--ld-glow); }
        50% { box-shadow: 0 0 24px var(--ld-glow), 0 0 48px rgba(255, 109, 58, 0.15); }
      }

      @keyframes lootdrop-rotate-glow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }

      @keyframes lootdrop-scan {
        0% { transform: translateY(-100%); opacity: 0; }
        50% { opacity: 0.6; }
        100% { transform: translateY(100%); opacity: 0; }
      }

      @keyframes lootdrop-border-glow {
        0%, 100% { border-color: rgba(255, 109, 58, 0.2); }
        50% { border-color: rgba(255, 109, 58, 0.5); }
      }

      /* Prevent text selection on game UI elements */
      [data-game-ui] {
        user-select: none;
        -webkit-user-select: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
