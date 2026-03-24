import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, WebShadows, Gradients } from "../constants/theme";

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  tier: "bronze" | "silver" | "gold";
  claims: number;
  isCurrentUser?: boolean;
}

const TIER_EMOJI = { bronze: "🔥", silver: "⚡", gold: "👑" };
const RANK_DISPLAY = ["🥇", "🥈", "🥉"];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "TreasureKing", xp: 4200, level: 12, tier: "gold", claims: 87 },
  { rank: 2, name: "LootQueen22", xp: 3800, level: 11, tier: "gold", claims: 72 },
  { rank: 3, name: "DealHunterX", xp: 3100, level: 9, tier: "silver", claims: 65 },
  { rank: 4, name: "CouponNinja", xp: 2600, level: 8, tier: "silver", claims: 51 },
  { rank: 5, name: "You", xp: 0, level: 1, tier: "bronze", claims: 0, isCurrentUser: true },
  { rank: 6, name: "SaverSam", xp: 1800, level: 7, tier: "silver", claims: 38 },
  { rank: 7, name: "BargainBoss", xp: 1200, level: 5, tier: "bronze", claims: 24 },
  { rank: 8, name: "LootLooper", xp: 900, level: 4, tier: "bronze", claims: 19 },
  { rank: 9, name: "ChestChaser", xp: 600, level: 3, tier: "bronze", claims: 12 },
  { rank: 10, name: "NewExplorer", xp: 100, level: 1, tier: "bronze", claims: 3 },
];

interface LeaderboardProps {
  userXP?: number;
  userLevel?: number;
  userTier?: "bronze" | "silver" | "gold";
  userClaims?: number;
}

export function Leaderboard({ userXP = 0, userLevel = 1, userTier = "bronze", userClaims = 0 }: LeaderboardProps) {
  const { theme } = useTheme();

  // Inject user data into mock leaderboard
  const entries = MOCK_LEADERBOARD.map((entry) => {
    if (entry.isCurrentUser) {
      return { ...entry, xp: userXP, level: userLevel, tier: userTier, claims: userClaims };
    }
    return entry;
  }).sort((a, b) => b.xp - a.xp).map((entry, i) => ({ ...entry, rank: i + 1 }));

  return (
    <View style={lbStyles.container}>
      {entries.map((entry, i) => (
        <Animated.View
          key={entry.name}
          entering={FadeInDown.duration(300).delay(i * 50)}
          style={[
            lbStyles.row,
            {
              backgroundColor: entry.isCurrentUser
                ? theme.primary + "12"
                : theme.backgroundDefault,
              borderColor: entry.isCurrentUser ? theme.primary + "40" : theme.border,
              ...Platform.select({
                web: entry.isCurrentUser
                  ? {
                      boxShadow: `0 0 24px ${theme.primaryGlow}, 0 2px 12px rgba(0,0,0,0.2)`,
                      background: `${Gradients.web.cardSheen}, ${theme.primary}12`,
                      animation: "lootdrop-border-glow 3s ease-in-out infinite",
                    }
                  : { boxShadow: WebShadows.insetGlow },
                default: {},
              }),
            },
          ]}
        >
          {/* Rank */}
          <View style={lbStyles.rankCol}>
            {entry.rank <= 3 ? (
              <ThemedText style={lbStyles.rankEmoji}>
                {RANK_DISPLAY[entry.rank - 1]}
              </ThemedText>
            ) : (
              <ThemedText
                style={[
                  lbStyles.rankNum,
                  { color: entry.isCurrentUser ? theme.primary : theme.textSecondary },
                ]}
              >
                {entry.rank}
              </ThemedText>
            )}
          </View>

          {/* Avatar + name */}
          <View style={lbStyles.nameCol}>
            <ThemedText style={lbStyles.tierEmoji}>
              {TIER_EMOJI[entry.tier]}
            </ThemedText>
            <View>
              <ThemedText
                style={[
                  lbStyles.name,
                  {
                    color: entry.isCurrentUser ? theme.primary : theme.text,
                    fontFamily: Fonts?.sans,
                  },
                ]}
              >
                {entry.isCurrentUser ? "You" : entry.name}
              </ThemedText>
              <ThemedText style={[lbStyles.level, { color: theme.textSecondary }]}>
                Lv.{entry.level} · {entry.claims} claims
              </ThemedText>
            </View>
          </View>

          {/* XP */}
          <ThemedText
            style={[
              lbStyles.xp,
              {
                color: entry.isCurrentUser ? theme.primary : theme.secondary,
                fontFamily: Fonts?.mono,
              },
            ]}
          >
            {entry.xp.toLocaleString()} XP
          </ThemedText>
        </Animated.View>
      ))}
    </View>
  );
}

const lbStyles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  rankCol: {
    width: 32,
    alignItems: "center",
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNum: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Fonts?.mono,
  },
  nameCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tierEmoji: {
    fontSize: 18,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
  },
  level: {
    fontSize: 11,
    fontWeight: "600",
  },
  xp: {
    fontSize: 13,
    fontWeight: "700",
  },
});
