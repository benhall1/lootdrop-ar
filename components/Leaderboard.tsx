import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, WebShadows, Gradients } from "../constants/theme";
import { SocialService, LeaderboardEntry } from "../services/socialService";

const TIER_EMOJI = { bronze: "🔥", silver: "⚡", gold: "👑" };
const RANK_DISPLAY = ["🥇", "🥈", "🥉"];

interface LeaderboardProps {
  userXP?: number;
  userLevel?: number;
  userTier?: "bronze" | "silver" | "gold";
  userClaims?: number;
}

export function Leaderboard({ userXP = 0, userLevel = 1, userTier = "bronze", userClaims = 0 }: LeaderboardProps) {
  const { theme } = useTheme();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SocialService.getLeaderboard().then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ActivityIndicator color={theme.primary} style={{ padding: Spacing.xl }} />;
  }

  // Inject current user into leaderboard, re-sort, re-rank
  const withUser: LeaderboardEntry[] = [
    ...leaderboard,
    { rank: 0, name: "You", xp: userXP, level: userLevel, tier: userTier, claims: userClaims, isCurrentUser: true },
  ];
  const entries = withUser
    .sort((a, b) => b.xp - a.xp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

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
