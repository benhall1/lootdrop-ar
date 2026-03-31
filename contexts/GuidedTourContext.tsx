import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_COMPLETE_KEY = "@lootdrop_tour_complete";

export interface TourStep {
  id: string;
  title: string;
  message: string;
  arrow?: "top-right" | "bottom-center" | "bottom-left" | "bottom-right" | "none";
  arrowLabel?: string;
  /** When set, the step is action-gated: no Next button, advances only via completeAction(actionRequired) */
  actionRequired?: string;
  /** Auto-advance after this many milliseconds (for non-action-gated tooltip steps) */
  autoAdvanceMs?: number;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LootDrop!",
    message:
      "Let's walk through how it works. We'll have you discovering loot boxes in no time!",
    arrow: "none",
  },
  {
    id: "radar",
    title: "This is Your Radar",
    message:
      "The glowing dots are loot boxes near you. Each one is at a real business with a real deal inside.",
    arrow: "none",
    autoAdvanceMs: 3000,
  },
  {
    id: "tap-ar",
    title: "Try AR Mode",
    message: "Tap the AR button to switch to camera mode!",
    arrow: "top-right",
    arrowLabel: "Tap here",
    actionRequired: "tap-ar",
  },
  {
    id: "ar-intro",
    title: "You're in AR Mode!",
    message:
      "See the loot boxes floating around you. This is how you'll discover deals in the real world.",
    arrow: "none",
  },
  {
    id: "claim-lootbox",
    title: "Claim a Loot Box",
    message: "Now tap any loot box to claim it! Go ahead, pick one.",
    arrow: "none",
    actionRequired: "claim-lootbox",
  },
  {
    id: "congrats",
    title: "Nice Work!",
    message:
      "You just claimed your first loot box! Every claim earns you XP and real coupons you can redeem.",
    arrow: "none",
  },
  {
    id: "map-tab",
    title: "Explore the Map",
    message:
      "Check the Map tab for a bird's-eye view of all drops near you.",
    arrow: "bottom-left",
    arrowLabel: "Map tab",
  },
  {
    id: "loot-tab",
    title: "Your Collection",
    message:
      "Your claimed coupons live in the Loot tab. View, share, and redeem them here.",
    arrow: "bottom-center",
    arrowLabel: "Loot tab",
  },
  {
    id: "done",
    title: "You're All Set!",
    message:
      "New drops appear every day at businesses near you. Open the app daily to earn bonus XP. Happy hunting!",
    arrow: "none",
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
  resetTour: () => Promise<void>;
  tourCompleted: boolean;
  /** Advance from an action-gated step. Only works if the current step's actionRequired matches. */
  completeAction: (actionId: string) => void;
}

const GuidedTourContext = createContext<GuidedTourContextType>({
  isTourActive: false,
  currentStep: 0,
  steps: TOUR_STEPS,
  currentStepData: null,
  startTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
  resetTour: async () => {},
  tourCompleted: false,
  completeAction: () => {},
});

export function useTour() {
  return useContext(GuidedTourContext);
}

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(true); // default true, flip to false if no key
  const [loaded, setLoaded] = useState(false);

  // On mount: check AsyncStorage. If key is NOT "true", tour hasn't been done yet.
  useEffect(() => {
    AsyncStorage.getItem(TOUR_COMPLETE_KEY).then((value) => {
      if (value !== "true") {
        setTourCompleted(false);
        // Auto-start tour for first-time users
        setIsTourActive(true);
        setCurrentStep(0);
      }
      setLoaded(true);
    });
  }, []);

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

  const nextStep = useCallback(() => {
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
    markComplete();
  }, [markComplete]);

  const resetTour = useCallback(async () => {
    await AsyncStorage.removeItem(TOUR_COMPLETE_KEY);
    setTourCompleted(false);
    setCurrentStep(0);
    setIsTourActive(true);
  }, []);

  const completeAction = useCallback(
    (actionId: string) => {
      const step = TOUR_STEPS[currentStep];
      if (!step || step.actionRequired !== actionId) return;
      // Advance to next step
      nextStep();
    },
    [currentStep, nextStep]
  );

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
        resetTour,
        tourCompleted,
        completeAction,
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
}
