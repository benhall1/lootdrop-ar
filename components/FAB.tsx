import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../hooks/useTheme";
import { Layout, Shadows, WebShadows } from "../constants/theme";
import { Platform } from "react-native";

interface FABProps {
  icon: string;
  onPress: () => void;
  style?: any;
}

export function FAB({ icon, onPress, style }: FABProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.primary,
          transform: [{ scale: pressed ? 0.9 : 1 }],
          ...Platform.select({
            web: {
              boxShadow: pressed ? WebShadows.card : WebShadows.fab,
              transition: "transform 0.15s ease, box-shadow 0.2s ease",
            },
            default: {},
          }),
        },
        Platform.OS !== "web" ? Shadows.fab : {},
        style,
      ]}
    >
      <Feather name={icon as any} size={Layout.iconSize} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
