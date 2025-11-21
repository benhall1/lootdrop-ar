import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Fonts, Typography, BorderRadius, Spacing } from "../constants/theme";

interface CountdownTimerProps {
  targetTime: number;
  style?: any;
}

export function CountdownTimer({ targetTime, style }: CountdownTimerProps) {
  const { theme } = useTheme();
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft("LIVE");
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

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: timeLeft === "LIVE" ? theme.success : theme.secondary,
        },
        isUrgent && styles.pulsing,
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          {
            fontFamily: Fonts.mono,
            color: "#000",
          },
        ]}
      >
        {timeLeft}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "700",
  },
  pulsing: {
    opacity: 0.9,
  },
});
