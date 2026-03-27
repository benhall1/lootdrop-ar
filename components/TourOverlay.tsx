import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useTour } from "../contexts/GuidedTourContext";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";

/**
 * Arrow indicator that points to a UI element.
 * Positioned at the edge of the modal to direct the user's attention.
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
  const { width, height } = useWindowDimensions();

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

  const isTop = direction === "top-right";

  return (
    <View style={getStyle()}>
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
    </View>
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

export function TourOverlay() {
  const { theme } = useTheme();
  const { isTourActive, currentStep, steps, currentStepData, nextStep, skipTour } =
    useTour();

  if (!isTourActive || !currentStepData) return null;

  const isLastStep = currentStep === steps.length - 1;
  const stepNumber = currentStep + 1;
  const totalSteps = steps.length;
  const hasArrow = currentStepData.arrow && currentStepData.arrow !== "none";

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

        {/* Tour card — always centered */}
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
