import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  ViewToken,
  Platform,
} from "react-native";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "../components/ThemedText";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

const ONBOARDING_KEY = "@lootdrop_onboarding_seen";

const { width } = Dimensions.get("window");

interface Slide {
  emoji: string;
  title: string;
  description: string;
  accent: string;
}

const slides: Slide[] = [
  {
    emoji: "📡",
    title: "Discover Loot",
    description:
      "Virtual treasure boxes are hidden at local businesses around you. Use the radar to find them nearby!",
    accent: "#FF6B35",
  },
  {
    emoji: "🎁",
    title: "Claim Deals",
    description:
      "Walk up to a loot box and tap to claim real coupons and discounts from local shops and restaurants.",
    accent: "#00D4AA",
  },
  {
    emoji: "💰",
    title: "Save Money",
    description:
      "Build your collection, earn XP, unlock badges, and save money at your favorite local spots!",
    accent: "#FFD700",
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch {}
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await markOnboardingSeen();
      onComplete();
    }
  };

  const handleSkip = async () => {
    await markOnboardingSeen();
    onComplete();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      {/* Skip button */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.skipRow}>
        <Pressable onPress={handleSkip}>
          <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip
          </ThemedText>
        </Pressable>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Animated.View entering={FadeInUp.duration(600)}>
              <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
            </Animated.View>
            <ThemedText
              type="h1"
              style={[styles.title, { fontFamily: Fonts?.display, color: item.accent }]}
            >
              {item.title}
            </ThemedText>
            <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
              {item.description}
            </ThemedText>
          </View>
        )}
      />

      {/* Dots + button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? slides[currentIndex].accent : theme.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[
            styles.button,
            { backgroundColor: slides[currentIndex].accent },
          ]}
        >
          <ThemedText style={styles.buttonText}>
            {isLastSlide ? "Get Started" : "Next"}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipRow: {
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
