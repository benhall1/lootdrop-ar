import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Fonts, Typography, BorderRadius, Spacing, Shadows } from "../constants/theme";

interface CountdownTimerProps {
  targetTime: number;
  style?: any;
}

export function CountdownTimer({ targetTime, style }: CountdownTimerProps) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft("LIVE!");
        setIsUrgent(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (diff < 60000) {
        setTimeLeft(`${seconds}s`);
        setIsUrgent(true);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
        setIsUrgent(false);
      } else {
        setTimeLeft(`${minutes}m`);
        setIsUrgent(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  useEffect(() => {
    if (isUrgent) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulse.value = 1;
    }
  }, [isUrgent]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const isLive = timeLeft === "LIVE!";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isLive
            ? theme.success
            : isUrgent
            ? theme.error
            : theme.secondary,
        },
        isLive && Shadows.accentGlow,
        animatedStyle,
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          {
            fontFamily: Fonts?.mono,
            color: isLive ? "#FFF" : "#000",
          },
        ]}
      >
        {isLive ? "⚡ LIVE!" : `⏱ ${timeLeft}`}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
