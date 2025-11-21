import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { LogoService } from "../services/logoService";

interface BusinessLogoProps {
  businessName: string;
  logoUrl?: string;
  size?: number;
  style?: any;
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

    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.primary,
          },
          style,
        ]}
      >
        <View style={styles.fallbackContent}>
          <Feather name="briefcase" size={size * 0.3} color="#FFF" style={styles.fallbackIcon} />
          <ThemedText
            style={{
              color: "#FFFFFF",
              fontSize: size * 0.35,
              fontWeight: "700",
            }}
          >
            {initials}
          </ThemedText>
        </View>
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
          borderRadius: size / 2,
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
    position: "relative",
  },
  fallbackContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackIcon: {
    position: "absolute",
    opacity: 0.2,
  },
});
