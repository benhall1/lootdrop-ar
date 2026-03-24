import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Fonts } from "../constants/theme";

interface BusinessLogoProps {
  businessName: string;
  logoUrl?: string;
  size?: number;
  style?: any;
}

const LOGO_COLORS = [
  "#FF5722", "#E91E63", "#9C27B0", "#673AB7",
  "#3F51B5", "#2196F3", "#00BCD4", "#009688",
  "#4CAF50", "#FF9800", "#795548", "#607D8B",
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function BusinessLogo({
  businessName,
  logoUrl,
  size = 40,
  style,
}: BusinessLogoProps) {
  const { theme } = useTheme();
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoFailed || !logoUrl) {
    const initials = getInitials(businessName);
    const bgColor = getColorForName(businessName);

    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size * 0.3,
            backgroundColor: bgColor,
          },
          style,
        ]}
      >
        <ThemedText
          style={{
            color: "#FFFFFF",
            fontSize: size * 0.38,
            fontWeight: "800",
            fontFamily: Fonts?.sans,
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </ThemedText>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
        },
        style,
      ]}
      contentFit="cover"
      onError={() => setLogoFailed(true)}
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    backgroundColor: "#FFF",
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
});
