import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#FF6B35",
    primaryDark: "#E84A1F",
    secondary: "#FFD23F",
    accent: "#4ECDC4",
    text: "#11181C",
    textSecondary: "#687076",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#FF6B35",
    link: "#FF6B35",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F2F2F2",
    backgroundSecondary: "#E6E6E6",
    backgroundTertiary: "#D9D9D9",
    border: "#D9D9D9",
    success: "#06D6A0",
    warning: "#FFB627",
    error: "#EF476F",
    info: "#118AB2",
    arOverlay: "rgba(255, 255, 255, 0.6)",
    markerActive: "#FF6B35",
    markerInactive: "#687076",
  },
  dark: {
    primary: "#FF6B35",
    primaryDark: "#E84A1F",
    secondary: "#FFD23F",
    accent: "#4ECDC4",
    text: "#FFFFFF",
    textSecondary: "#9BA4B5",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA4B5",
    tabIconSelected: "#FF6B35",
    link: "#FF6B35",
    backgroundRoot: "#0F1419",
    backgroundDefault: "#1A1F26",
    backgroundSecondary: "#252C35",
    backgroundTertiary: "#2D3540",
    border: "#2D3540",
    success: "#06D6A0",
    warning: "#FFB627",
    error: "#EF476F",
    info: "#118AB2",
    arOverlay: "rgba(15, 20, 25, 0.6)",
    markerActive: "#FF6B35",
    markerInactive: "#9BA4B5",
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
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 22,
    fontWeight: "600" as const,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: "400" as const,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400" as const,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  timer: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapMarker: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
};

export const Layout = {
  fabSize: 56,
  iconSize: 24,
  minimapSize: 120,
  avatarSize: 40,
  categoryIconSize: 16,
  categoryChipHeight: 36,
  minTouchSize: 44,
};
