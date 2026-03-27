import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_COMPLETE_KEY = "@lootdrop_tour_complete";

export interface TourStep {
  id: string;
  title: string;
  message: string;
  target?: string;
  action?: string;
  position?: "top" | "center" | "bottom";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LootDrop! \u{1F381}",
    message: "Virtual treasure boxes with real deals are hidden nearby. Let's find one!",
    position: "center",
  },
  {
    id: "radar-intro",
    title: "Your Radar",
    message: "These blips are loot boxes at local businesses. The closer the blip, the closer the deal!",
    position: "bottom",
  },
  {
    id: "try-ar",
    title: "Try AR Mode!",
    message: "Tap the AR button to see loot boxes in the real world through your camera.",
    target: "ar-toggle",
    action: "tap-ar",
    position: "top",
  },
  {
    id: "ar-look",
    title: "Look Around!",
    message: "A demo treasure box is right nearby. Move your phone to find it!",
    position: "center",
  },
  {
    id: "claim-box",
    title: "Claim It!",
    message: "You're close enough! Tap the treasure box to claim your first deal.",
    action: "claim-box",
    position: "top",
  },
  {
    id: "collection",
    title: "Your Collection",
    message: "Nice! Check the Loot tab to see your claimed coupons anytime.",
    target: "collection-tab",
    position: "center",
  },
  {
    id: "map-hint",
    title: "Explore the Map",
    message: "Use the Map tab to see all drops around town. Happy hunting!",
    target: "map-tab",
    position: "center",
  },
  {
    id: "complete",
    title: "You're Ready!",
    message: "New loot drops daily. Open the app each day to earn bonus XP!",
    position: "center",
  },
];

interface GuidedTourContextType {
  isTourActive: boolean;
  currentStep: number;
  steps: TourStep[];
  currentStepData: TourStep | null;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  tourCompleted: boolean;
}

const GuidedTourContext = createContext<GuidedTourContextType>({
  isTourActive: false,
  currentStep: 0,
  steps: TOUR_STEPS,
  currentStepData: null,
  startTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
  completeTour: () => {},
  resetTour: () => {},
  tourCompleted: false,
});

export function useTour() {
  return useContext(GuidedTourContext);
}

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if tour has already been completed
  useEffect(() => {
    AsyncStorage.getItem(TOUR_COMPLETE_KEY).then((value) => {
      if (value === "true") {
        setTourCompleted(true);
      }
    });
  }, []);

  // Auto-advance for steps without an action
  useEffect(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    if (!isTourActive) return;

    const step = TOUR_STEPS[currentStep];
    if (step && !step.action) {
      autoAdvanceTimer.current = setTimeout(() => {
        nextStep();
      }, 4000);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = null;
      }
    };
  }, [isTourActive, currentStep]);

  const markComplete = useCallback(async () => {
    setIsTourActive(false);
    setTourCompleted(true);
    setCurrentStep(0);
    await AsyncStorage.setItem(TOUR_COMPLETE_KEY, "true");
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsTourActive(true);
  }, []);

  const resetTour = useCallback(async () => {
    setTourCompleted(false);
    setIsTourActive(false);
    setCurrentStep(0);
    await AsyncStorage.removeItem(TOUR_COMPLETE_KEY);
  }, []);

  const nextStep = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= TOUR_STEPS.length) {
        markComplete();
        return prev;
      }
      return next;
    });
  }, [markComplete]);

  const skipTour = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    markComplete();
  }, [markComplete]);

  const completeTour = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    markComplete();
  }, [markComplete]);

  const currentStepData = isTourActive ? TOUR_STEPS[currentStep] ?? null : null;

  return (
    <GuidedTourContext.Provider
      value={{
        isTourActive,
        currentStep,
        steps: TOUR_STEPS,
        currentStepData,
        startTour,
        nextStep,
        skipTour,
        completeTour,
        resetTour,
        tourCompleted,
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
}
