import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Layout } from "../constants/theme";
import { LocationCategory } from "../types";

interface CategoryChipProps {
  category: LocationCategory;
  selected: boolean;
  onPress: () => void;
}

const categoryIcons: Record<LocationCategory, string> = {
  restaurant: "coffee",
  retail: "shopping-bag",
  entertainment: "film",
  services: "tool",
};

const categoryLabels: Record<LocationCategory, string> = {
  restaurant: "Food",
  retail: "Retail",
  entertainment: "Fun",
  services: "Services",
};

export function CategoryChip({ category, selected, onPress }: CategoryChipProps) {
  const { theme } = useTheme();

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
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Feather
        name={categoryIcons[category] as any}
        size={Layout.categoryIconSize}
        color={selected ? "#FFF" : theme.textSecondary}
        style={styles.icon}
      />
      <ThemedText
        style={[
          styles.label,
          {
            color: selected ? "#FFF" : theme.textSecondary,
          },
        ]}
      >
        {categoryLabels[category]}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Layout.categoryChipHeight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
