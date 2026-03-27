import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { SocialService, ActivityItem } from "../services/socialService";

const TYPE_COLORS: Record<string, string> = {
  claim: "#FF6D3A",
  badge: "#FFD54F",
  streak: "#FF5722",
  levelup: "#00E5FF",
  share: "#34D399",
};

export function ActivityFeed() {
  const { theme } = useTheme();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SocialService.getActivityFeed().then((data) => {
      setActivity(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ActivityIndicator color={theme.primary} style={{ padding: Spacing.xl }} />;
  }

  return (
    <View style={feedStyles.container}>
      {activity.map((item, i) => (
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
            <ThemedText style={feedStyles.message} numberOfLines={2} ellipsizeMode="tail">
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
