import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Layout, Fonts, WebShadows } from "../constants/theme";
import { LocationCategory } from "../types";

interface CategoryChipProps {
  category: LocationCategory;
  selected: boolean;
  onPress: () => void;
}

const categoryConfig: Record<LocationCategory, { icon: string; label: string; emoji: string }> = {
  restaurant: { icon: "coffee", label: "Food", emoji: "🍕" },
  retail: { icon: "shopping-bag", label: "Retail", emoji: "🛍" },
  entertainment: { icon: "film", label: "Fun", emoji: "🎮" },
  services: { icon: "tool", label: "Services", emoji: "⚡" },
};

export function CategoryChip({ category, selected, onPress }: CategoryChipProps) {
  const { theme } = useTheme();
  const config = categoryConfig[category];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1.5,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          ...Platform.select({
            web: selected ? { boxShadow: WebShadows.neonOrange } : {},
            default: {},
          }),
        },
      ]}
    >
      <ThemedText style={styles.emoji}>{config.emoji}</ThemedText>
      <ThemedText
        style={[
          styles.label,
          {
            color: selected ? "#FFF" : theme.text,
            fontFamily: Fonts?.sans,
          },
        ]}
      >
        {config.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Layout.categoryChipHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
