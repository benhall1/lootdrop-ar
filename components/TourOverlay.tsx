import React, { useEffect, useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  useWindowDimensions,
  Animated as RNAnimated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useTour } from "../contexts/GuidedTourContext";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";

/**
 * Arrow indicator that points to a UI element.
 * Positioned at the edge of the overlay to direct the user's attention.
 */
function ArrowPointer({
  direction,
  label,
  color,
}: {
  direction: "top-right" | "bottom-center" | "bottom-left" | "bottom-right";
  label?: string;
  color: string;
}) {
  const { width } = useWindowDimensions();
  const bounce = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(bounce, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        RNAnimated.timing(bounce, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [bounce]);

  const isTop = direction === "top-right";
  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: isTop ? [0, -8] : [0, 8],
  });

  const getStyle = () => {
    switch (direction) {
      case "top-right":
        return {
          position: "absolute" as const,
          top: 60,
          right: 24,
          alignItems: "center" as const,
        };
      case "bottom-left":
        return {
          position: "absolute" as const,
          bottom: 70,
          left: width * 0.15,
          alignItems: "center" as const,
        };
      case "bottom-center":
        return {
          position: "absolute" as const,
          bottom: 70,
          left: width * 0.5 - 30,
          alignItems: "center" as const,
        };
      case "bottom-right":
        return {
          position: "absolute" as const,
          bottom: 70,
          right: width * 0.1,
          alignItems: "center" as const,
        };
      default:
        return {};
    }
  };

  return (
    <RNAnimated.View style={[getStyle(), { transform: [{ translateY }] }]}>
      {isTop && (
        <>
          <Feather name="arrow-up" size={32} color={color} />
          {label && (
            <ThemedText style={[arrowStyles.label, { color }]}>{label}</ThemedText>
          )}
        </>
      )}
      {!isTop && (
        <>
          {label && (
            <ThemedText style={[arrowStyles.label, { color }]}>{label}</ThemedText>
          )}
          <Feather name="arrow-down" size={32} color={color} />
        </>
      )}
    </RNAnimated.View>
  );
}

const arrowStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 4,
  },
});

/**
 * Floating instruction card for action-gated steps.
 * Rendered at the top or bottom of the screen, non-blocking.
 */
function ActionCard({
  title,
  message,
  stepNumber,
  totalSteps,
  onSkip,
  position,
}: {
  title: string;
  message: string;
  stepNumber: number;
  totalSteps: number;
  onSkip: () => void;
  position: "top" | "bottom";
}) {
  const { theme } = useTheme();
  const fadeIn = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  return (
    <RNAnimated.View
      style={[
        actionCardStyles.wrapper,
        position === "top"
          ? actionCardStyles.wrapperTop
          : actionCardStyles.wrapperBottom,
        { opacity: fadeIn },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          actionCardStyles.card,
          {
            backgroundColor: theme.backgroundDefault + "F0",
            borderColor: theme.primary + "60",
          },
        ]}
      >
        <View style={actionCardStyles.header}>
          <View style={[actionCardStyles.stepPill, { backgroundColor: theme.primary + "15" }]}>
            <ThemedText
              style={[
                actionCardStyles.stepPillText,
                { color: theme.primary, fontFamily: Fonts?.mono },
              ]}
            >
              Step {stepNumber} of {totalSteps}
            </ThemedText>
          </View>
          <Pressable onPress={onSkip} hitSlop={12}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
        <ThemedText
          style={[actionCardStyles.title, { color: theme.text, fontFamily: Fonts?.display }]}
        >
          {title}
        </ThemedText>
        <ThemedText
          style={[actionCardStyles.message, { color: theme.textSecondary, fontFamily: Fonts?.sans }]}
        >
          {message}
        </ThemedText>
        <Pressable onPress={onSkip} style={actionCardStyles.skipButton}>
          <ThemedText style={[actionCardStyles.skipText, { color: theme.textSecondary }]}>
            Skip Tutorial
          </ThemedText>
        </Pressable>
      </View>
    </RNAnimated.View>
  );
}

const actionCardStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    alignItems: "center",
  },
  wrapperTop: {
    top: 100,
  },
  wrapperBottom: {
    bottom: 120,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  stepPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  skipButton: {
    marginTop: Spacing.sm,
    alignSelf: "flex-end",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export function TourOverlay() {
  const { theme } = useTheme();
  const { isTourActive, currentStep, steps, currentStepData, nextStep, skipTour } =
    useTour();

  // Auto-advance for steps with autoAdvanceMs
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (currentStepData?.autoAdvanceMs && !currentStepData.actionRequired) {
      autoAdvanceTimer.current = setTimeout(() => {
        nextStep();
      }, currentStepData.autoAdvanceMs);
    }
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [currentStep, currentStepData, nextStep]);

  if (!isTourActive || !currentStepData) return null;

  const isLastStep = currentStep === steps.length - 1;
  const stepNumber = currentStep + 1;
  const totalSteps = steps.length;
  const hasArrow = currentStepData.arrow && currentStepData.arrow !== "none";
  const isActionGated = !!currentStepData.actionRequired;

  // --- Action-gated step: semi-transparent overlay with pointerEvents="box-none" ---
  if (isActionGated) {
    return (
      <View style={overlayStyles.passthrough} pointerEvents="box-none">
        {/* Semi-transparent scrim — taps pass through */}
        <View style={overlayStyles.scrim} pointerEvents="none" />

        {/* Arrow pointer */}
        {hasArrow && (
          <ArrowPointer
            direction={currentStepData.arrow!}
            label={currentStepData.arrowLabel}
            color={theme.secondary}
          />
        )}

        {/* Floating instruction card */}
        <ActionCard
          title={currentStepData.title}
          message={currentStepData.message}
          stepNumber={stepNumber}
          totalSteps={totalSteps}
          onSkip={skipTour}
          position={currentStepData.arrow === "top-right" ? "bottom" : "top"}
        />
      </View>
    );
  }

  // --- Regular modal step ---
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Semi-transparent backdrop */}
        <View style={styles.backdrop} />

        {/* Arrow pointer */}
        {hasArrow && (
          <ArrowPointer
            direction={currentStepData.arrow!}
            label={currentStepData.arrowLabel}
            color={theme.secondary}
          />
        )}

        {/* Tour card -- always centered */}
        <View style={styles.cardWrapper}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.primary + "40",
              },
            ]}
          >
            {/* Step counter pill */}
            <View style={[styles.stepPill, { backgroundColor: theme.primary + "15" }]}>
              <ThemedText
                style={[
                  styles.stepPillText,
                  { color: theme.primary, fontFamily: Fonts?.mono },
                ]}
              >
                Step {stepNumber} of {totalSteps}
              </ThemedText>
            </View>

            {/* Title */}
            <ThemedText
              style={[styles.title, { color: theme.text, fontFamily: Fonts?.display }]}
            >
              {currentStepData.title}
            </ThemedText>

            {/* Message */}
            <ThemedText
              style={[
                styles.message,
                { color: theme.textSecondary, fontFamily: Fonts?.sans },
              ]}
            >
              {currentStepData.message}
            </ThemedText>

            {/* Progress dots */}
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === currentStep ? theme.primary : theme.primary + "30",
                      width: i === currentStep ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Next button */}
            <Pressable
              onPress={nextStep}
              style={({ pressed }) => [
                styles.nextButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText style={styles.nextButtonText}>
                {isLastStep ? "Start Exploring!" : "Next"}
              </ThemedText>
              {!isLastStep && <Feather name="arrow-right" size={18} color="#FFF" />}
            </Pressable>

            {/* Skip link */}
            {!isLastStep && (
              <Pressable onPress={skipTour} style={styles.skipButton}>
                <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
                  Skip Tutorial
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  passthrough: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  cardWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: "center",
  },
  stepPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    minWidth: 160,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
