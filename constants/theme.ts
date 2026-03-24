import { Platform } from "react-native";

/**
 * LootDrop AR Design System — "Neon Treasure Arcade"
 *
 * Dark-first, game-inspired palette with hot orange primary,
 * electric gold accents, and glowing neon shadows.
 * Backgrounds use deep navy tones for depth.
 */

export const Colors = {
  light: {
    primary: "#FF5722",
    primaryDark: "#E64A19",
    primaryGlow: "rgba(255, 87, 34, 0.25)",
    secondary: "#FFCA28",
    secondaryGlow: "rgba(255, 202, 40, 0.20)",
    accent: "#00E5FF",
    accentGlow: "rgba(0, 229, 255, 0.15)",
    text: "#1A1A2E",
    textSecondary: "#6B7280",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#FF5722",
    link: "#FF5722",
    backgroundRoot: "#FAFBFF",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#F0F2F8",
    backgroundTertiary: "#E4E7F0",
    border: "#E0E4EF",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    arOverlay: "rgba(250, 251, 255, 0.7)",
    markerActive: "#FF5722",
    markerInactive: "#9CA3AF",
    cardGlow: "rgba(255, 87, 34, 0.08)",
    xpBar: "#FFCA28",
    streak: "#FF5722",
  },
  dark: {
    primary: "#FF6D3A",
    primaryDark: "#FF5722",
    primaryGlow: "rgba(255, 109, 58, 0.35)",
    secondary: "#FFD54F",
    secondaryGlow: "rgba(255, 213, 79, 0.25)",
    accent: "#00E5FF",
    accentGlow: "rgba(0, 229, 255, 0.20)",
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748B",
    tabIconSelected: "#FF6D3A",
    link: "#FF6D3A",
    backgroundRoot: "#0C0F1A",
    backgroundDefault: "#141827",
    backgroundSecondary: "#1C2035",
    backgroundTertiary: "#252940",
    border: "#2A2E45",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#60A5FA",
    arOverlay: "rgba(12, 15, 26, 0.7)",
    markerActive: "#FF6D3A",
    markerInactive: "#64748B",
    cardGlow: "rgba(255, 109, 58, 0.12)",
    xpBar: "#FFD54F",
    streak: "#FF6D3A",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 50,
  buttonHeight: 54,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  "2xl": 36,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 36,
    fontWeight: "800" as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: "400" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
  small: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 15,
    fontWeight: "700" as const,
  },
  timer: {
    fontSize: 26,
    fontWeight: "800" as const,
    letterSpacing: 1,
  },
  tag: {
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    display: "ui-rounded",
    sans: "ui-rounded",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    display: "normal",
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    display: "'Lilita One', 'Baloo 2', 'Fredoka', cursive",
    sans: "'Nunito', 'Quicksand', 'Poppins', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Nunito', 'Quicksand', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
  },
});

export const Shadows = {
  card: {
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardGlow: {
    shadowColor: "#FF6D3A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  mapMarker: {
    shadowColor: "#FF6D3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fab: {
    shadowColor: "#FF5722",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: "#FF6D3A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  accentGlow: {
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  goldGlow: {
    shadowColor: "#FFD54F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
};

/**
 * Web-specific box-shadow strings for richer glow effects.
 * Use via Platform.select({ web: { boxShadow: WebShadows.card }, default: Shadows.card })
 */
export const WebShadows = {
  card: "0 4px 24px rgba(255, 109, 58, 0.12), 0 1px 4px rgba(0, 0, 0, 0.2)",
  cardHover: "0 8px 32px rgba(255, 109, 58, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3)",
  cardGlow: "0 0 32px rgba(255, 109, 58, 0.25), 0 4px 16px rgba(0, 0, 0, 0.2)",
  fab: "0 6px 24px rgba(255, 87, 34, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)",
  neonOrange: "0 0 12px rgba(255, 109, 58, 0.4), 0 0 40px rgba(255, 109, 58, 0.15)",
  neonGold: "0 0 12px rgba(255, 213, 79, 0.4), 0 0 40px rgba(255, 213, 79, 0.15)",
  neonCyan: "0 0 12px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.15)",
  insetGlow: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 16px rgba(0, 0, 0, 0.3)",
  sectionCard: "0 2px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
};

export const Layout = {
  fabSize: 60,
  iconSize: 24,
  minimapSize: 120,
  avatarSize: 48,
  categoryIconSize: 18,
  categoryChipHeight: 40,
  minTouchSize: 44,
};

/**
 * Gradient presets for LinearGradient components.
 * Use these to add depth and game-feel to backgrounds.
 */
export const Gradients = {
  primaryButton: ["#FF6D3A", "#FF5722", "#E64A19"],
  goldReward: ["#FFD54F", "#FFCA28", "#FFB300"],
  cardSheen: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0)"],
  darkBackground: ["#0C0F1A", "#141827", "#1C2035"],
  heroGlow: ["rgba(255, 109, 58, 0.15)", "rgba(255, 109, 58, 0)"],
  /** Web-only CSS gradient strings */
  web: {
    heroMesh:
      "radial-gradient(ellipse at 20% 0%, rgba(255, 109, 58, 0.12) 0%, transparent 50%), " +
      "radial-gradient(ellipse at 80% 20%, rgba(0, 229, 255, 0.08) 0%, transparent 40%), " +
      "radial-gradient(ellipse at 50% 100%, rgba(255, 213, 79, 0.06) 0%, transparent 50%)",
    cardSheen:
      "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 60%)",
    sectionBg:
      "linear-gradient(180deg, rgba(20, 24, 39, 0.6) 0%, rgba(20, 24, 39, 0.95) 100%)",
    neonBorder:
      "linear-gradient(135deg, rgba(255, 109, 58, 0.5), rgba(255, 213, 79, 0.3), rgba(0, 229, 255, 0.3))",
  },
};
