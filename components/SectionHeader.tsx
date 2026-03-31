import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string; // Feather icon name
  count?: number;
}

export function SectionHeader({ title, subtitle, icon, count }: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {icon && (
          <Feather name={icon as any} size={20} color={theme.primary} />
        )}
        <ThemedText style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>
        {count !== undefined && (
          <View style={[styles.countPill, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText style={[styles.countText, { color: theme.primary }]}>
              {count}
            </ThemedText>
          </View>
        )}
      </View>
      <LinearGradient
        colors={[theme.primary, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentLine}
      />
      {subtitle && (
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  countPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
  },
  accentLine: {
    height: 2,
    width: 60,
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
