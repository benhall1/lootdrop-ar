import React, { useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useTour } from "../contexts/GuidedTourContext";
import {
  Spacing,
  BorderRadius,
  Fonts,
  Typography,
  Shadows,
  WebShadows,
} from "../constants/theme";

/**
 * Approximate screen positions for target elements.
 * These are rough positions — we use a pulsing ring to draw attention
 * rather than a pixel-perfect spotlight cutout.
 */
function useTargetPosition(target?: string) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!target) return null;

  switch (target) {
    case "ar-toggle":
      // Top-right area of the Discover screen header
      return { x: width - 70, y: insets.top + 28, radius: 36 };
    case "collection-tab":
      // Bottom tab bar, 3rd tab (center)
      return { x: width / 2, y: height - 30, radius: 32 };
    case "map-tab":
      // Bottom tab bar, 2nd tab
      return { x: width * 0.3, y: height - 30, radius: 32 };
    default:
      return null;
  }
}

function PulsingRing({ x, y, radius }: { x: number; y: number; radius: number }) {
  const { theme } = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.35 }],
    opacity: 1 - pulse.value * 0.6,
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.15 }],
    opacity: 0.8 - pulse.value * 0.3,
  }));

  return (
    <View style={[pulseStyles.container, { left: x - radius, top: y - radius }]}>
      <Animated.View
        style={[
          pulseStyles.ring,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderColor: theme.primary,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          pulseStyles.ring,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderColor: theme.secondary,
          },
          innerRingStyle,
        ]}
      />
      {/* Spotlight cutout — lighter circle */}
      <View
        style={[
          pulseStyles.spotlight,
          {
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            backgroundColor: "rgba(255,255,255,0.08)",
          },
        ]}
      />
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1,
  },
  ring: {
    position: "absolute",
    borderWidth: 2.5,
  },
  spotlight: {
    position: "absolute",
  },
});

export function TourOverlay() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTourActive, currentStep, steps, currentStepData, nextStep, skipTour } =
    useTour();

  const targetPos = useTargetPosition(currentStepData?.target);

  if (!isTourActive || !currentStepData) return null;

  const isLastStep = currentStep === steps.length - 1;
  const stepNumber = currentStep + 1;
  const totalSteps = steps.length;
  const hasAction = !!currentStepData.action;

  // Card vertical position
  const getCardPosition = () => {
    switch (currentStepData.position) {
      case "top":
        return { top: insets.top + 80 };
      case "bottom":
        return { bottom: 140 };
      case "center":
      default:
        return { top: "35%" as any };
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
      pointerEvents="box-none"
    >
      {/* Semi-transparent backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={() => {
          // Tapping backdrop acts as "Next" for non-action steps
          if (!hasAction) nextStep();
        }}
      />

      {/* Pulsing ring for target elements */}
      {targetPos && (
        <PulsingRing x={targetPos.x} y={targetPos.y} radius={targetPos.radius} />
      )}

      {/* Tour card */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(100)}
        style={[
          styles.card,
          getCardPosition(),
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.primary + "30",
            ...Platform.select({
              web: { boxShadow: WebShadows.cardGlow },
              default: Shadows.cardGlow,
            }),
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Step counter */}
        <View style={[styles.stepCounter, { backgroundColor: theme.primary + "15" }]}>
          <ThemedText
            style={[
              styles.stepCounterText,
              { color: theme.primary, fontFamily: Fonts?.mono },
            ]}
          >
            {stepNumber} of {totalSteps}
          </ThemedText>
        </View>

        {/* Title */}
        <ThemedText
          style={[
            styles.title,
            { fontFamily: Fonts?.display, color: theme.text },
          ]}
        >
          {currentStepData.title}
        </ThemedText>

        {/* Message */}
        <ThemedText
          style={[styles.message, { color: theme.textSecondary, fontFamily: Fonts?.sans }]}
        >
          {currentStepData.message}
        </ThemedText>

        {/* Action hint for action-required steps */}
        {hasAction && (
          <View style={[styles.actionHint, { backgroundColor: theme.accent + "12" }]}>
            <Feather name="info" size={14} color={theme.accent} />
            <ThemedText
              style={[styles.actionHintText, { color: theme.accent, fontFamily: Fonts?.sans }]}
            >
              {currentStepData.action === "tap-ar"
                ? "Tap the AR button above to continue"
                : "Tap a treasure box to continue"}
            </ThemedText>
          </View>
        )}

        {/* Next button */}
        <Pressable
          onPress={nextStep}
          style={({ pressed }) => [
            styles.nextButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
              ...Platform.select({
                web: { boxShadow: WebShadows.fab },
                default: Shadows.fab,
              }),
            },
          ]}
        >
          <ThemedText style={[styles.nextButtonText, { fontFamily: Fonts?.sans }]}>
            {isLastStep ? "Got it!" : hasAction ? "Skip step" : "Next"}
          </ThemedText>
          {!isLastStep && (
            <Feather name="arrow-right" size={16} color="#FFF" />
          )}
        </Pressable>

        {/* Skip tour link */}
        {!isLastStep && (
          <Pressable onPress={skipTour} style={styles.skipButton}>
            <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
              Skip Tour
            </ThemedText>
          </Pressable>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  card: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    zIndex: 2,
  },
  stepCounter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    ...Typography.h3,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  actionHintText: {
    fontSize: 13,
    fontWeight: "600",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    minWidth: 140,
  },
  nextButtonText: {
    color: "#FFFFFF",
    ...Typography.button,
  },
  skipButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
