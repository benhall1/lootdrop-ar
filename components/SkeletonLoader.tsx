import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";

export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        animatedStyle,
      ]}
    >
      {/* Logo placeholder */}
      <View style={[styles.circle, { backgroundColor: theme.backgroundTertiary }]} />

      {/* Text lines */}
      <View style={styles.textContainer}>
        <View style={[styles.lineTitle, { backgroundColor: theme.backgroundTertiary }]} />
        <View style={[styles.lineSubtitle, { backgroundColor: theme.backgroundTertiary }]} />
      </View>

      {/* Right-side element */}
      <View style={[styles.rightElement, { backgroundColor: theme.backgroundTertiary }]} />
    </Animated.View>
  );
}

export function SkeletonCardList() {
  return (
    <View style={styles.list}>
      <SkeletonCard delay={0} />
      <SkeletonCard delay={150} />
      <SkeletonCard delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  lineTitle: {
    height: 14,
    width: "70%",
    borderRadius: BorderRadius.xs,
  },
  lineSubtitle: {
    height: 10,
    width: "45%",
    borderRadius: BorderRadius.xs,
  },
  rightElement: {
    width: 40,
    height: 24,
    borderRadius: BorderRadius.xs,
  },
  list: {
    gap: Spacing.md,
  },
});
