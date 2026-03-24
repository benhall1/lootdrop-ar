import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";

interface ActivityItem {
  id: string;
  type: "claim" | "badge" | "streak" | "levelup" | "share";
  user: string;
  message: string;
  emoji: string;
  timeAgo: string;
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "1", type: "claim", user: "TreasureKing", message: "claimed a loot box at Joe's Pizza", emoji: "🍕", timeAgo: "2m ago" },
  { id: "2", type: "badge", user: "LootQueen22", message: "unlocked Week Warrior badge", emoji: "⚡", timeAgo: "8m ago" },
  { id: "3", type: "streak", user: "DealHunterX", message: "hit a 7-day streak!", emoji: "🔥", timeAgo: "15m ago" },
  { id: "4", type: "claim", user: "CouponNinja", message: "claimed a loot box at GameStop", emoji: "🎮", timeAgo: "22m ago" },
  { id: "5", type: "levelup", user: "SaverSam", message: "reached Level 7!", emoji: "⭐", timeAgo: "35m ago" },
  { id: "6", type: "share", user: "BargainBoss", message: "shared a deal from Target", emoji: "🛍️", timeAgo: "42m ago" },
  { id: "7", type: "claim", user: "LootLooper", message: "claimed a loot box at Starbucks", emoji: "☕", timeAgo: "1h ago" },
  { id: "8", type: "badge", user: "ChestChaser", message: "unlocked Collector badge", emoji: "🏆", timeAgo: "1h ago" },
];

const TYPE_COLORS: Record<string, string> = {
  claim: "#FF6D3A",
  badge: "#FFD54F",
  streak: "#FF5722",
  levelup: "#00E5FF",
  share: "#34D399",
};

export function ActivityFeed() {
  const { theme } = useTheme();

  return (
    <View style={feedStyles.container}>
      {MOCK_ACTIVITY.map((item, i) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.duration(300).delay(i * 60)}
          style={[
            feedStyles.item,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              feedStyles.emojiCircle,
              { backgroundColor: (TYPE_COLORS[item.type] || theme.primary) + "15" },
            ]}
          >
            <ThemedText style={feedStyles.emoji}>{item.emoji}</ThemedText>
          </View>
          <View style={feedStyles.textCol}>
            <ThemedText style={feedStyles.message}>
              <ThemedText style={[feedStyles.username, { color: theme.primary }]}>
                {item.user}
              </ThemedText>
              {" "}{item.message}
            </ThemedText>
            <ThemedText style={[feedStyles.time, { color: theme.textSecondary }]}>
              {item.timeAgo}
            </ThemedText>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const feedStyles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  emojiCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 18,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  username: {
    fontWeight: "700",
  },
  time: {
    fontSize: 11,
    fontWeight: "600",
  },
});
