import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { GamificationService, GamificationState } from "../services/gamificationService";

const TIER_CONFIG = {
  bronze: { label: "BRONZE", emoji: "🔥", color: "#FF8A65" },
  silver: { label: "SILVER", emoji: "⚡", color: "#B0BEC5" },
  gold: { label: "GOLD", emoji: "👑", color: "#FFD54F" },
};

interface XPBarProps {
  state: GamificationState;
  compact?: boolean;
}

export function XPBar({ state, compact = false }: XPBarProps) {
  const { theme } = useTheme();
  const tier = TIER_CONFIG[state.tier];

  const currentLevelXP = GamificationService.getXPForCurrentLevel(state.level);
  const nextLevelXP = GamificationService.getXPForNextLevel(state.level);
  const progressXP = state.xp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPct = Math.min(progressXP / neededXP, 1);

  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withSpring(progressPct, { damping: 15, stiffness: 80 });
  }, [progressPct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
  }));

  if (compact) {
    return (
      <View style={compactStyles.row}>
        <ThemedText style={[compactStyles.level, { color: tier.color, fontFamily: Fonts?.display }]}>
          {tier.emoji} Lv.{state.level}
        </ThemedText>
        <View style={[compactStyles.barBg, { backgroundColor: theme.backgroundTertiary }]}>
          <Animated.View
            style={[
              compactStyles.barFill,
              { backgroundColor: theme.xpBar },
              barStyle,
            ]}
          />
        </View>
        {state.streak > 0 && (
          <ThemedText style={[compactStyles.streak, { color: theme.streak }]}>
            🔥 {state.streak}
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: tier.color + "30",
          ...Platform.select({
            web: { boxShadow: `0 2px 16px ${tier.color}20` },
            default: {},
          }),
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.levelSection}>
          <View style={[styles.levelBadge, { backgroundColor: tier.color }]}>
            <ThemedText style={styles.levelBadgeText}>
              {tier.emoji} {state.level}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={[styles.tierLabel, { color: tier.color }]}>
              {tier.label}
            </ThemedText>
            <ThemedText style={[styles.xpText, { color: theme.textSecondary }]}>
              {state.xp.toLocaleString()} XP
            </ThemedText>
          </View>
        </View>
        <View style={styles.statsRow}>
          {state.streak > 0 && (
            <View style={[styles.statPill, { backgroundColor: theme.streak + "15" }]}>
              <ThemedText style={[styles.statPillText, { color: theme.streak }]} numberOfLines={1}>
                🔥 {state.streak}d streak
              </ThemedText>
            </View>
          )}
          <View style={[styles.statPill, { backgroundColor: theme.accent + "15" }]}>
            <ThemedText style={[styles.statPillText, { color: theme.accent }]} numberOfLines={1}>
              {state.totalClaims} claims
            </ThemedText>
          </View>
        </View>
      </View>

      {/* XP progress bar */}
      <View style={styles.barRow}>
        <View style={[styles.barBg, { backgroundColor: theme.backgroundTertiary }]}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: theme.xpBar,
                ...Platform.select({
                  web: {
                    boxShadow: `0 0 12px ${theme.xpBar}90, 0 0 24px ${theme.xpBar}40`,
                    background: `linear-gradient(90deg, ${theme.xpBar}, ${theme.xpBar}DD, ${theme.xpBar})`,
                  },
                  default: {},
                }),
              },
              barStyle,
            ]}
          />
        </View>
        <ThemedText style={[styles.barLabel, { color: theme.textSecondary }]}>
          {progressXP}/{neededXP}
        </ThemedText>
      </View>
    </View>
  );
}

const compactStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  level: {
    fontSize: 13,
    fontWeight: "800",
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  streak: {
    fontSize: 13,
    fontWeight: "700",
  },
});

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  levelSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  xpText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts?.mono,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  statPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Fonts?.mono,
    minWidth: 60,
    textAlign: "right",
  },
});
