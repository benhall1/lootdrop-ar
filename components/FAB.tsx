import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../hooks/useTheme";
import { Layout, Shadows } from "../constants/theme";

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
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        Shadows.fab,
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
