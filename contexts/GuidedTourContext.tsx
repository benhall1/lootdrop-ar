import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_COMPLETE_KEY = "@lootdrop_tour_complete";

export interface TourStep {
  id: string;
  title: string;
  message: string;
  arrow?: "top-right" | "bottom-center" | "bottom-left" | "bottom-right" | "none";
  arrowLabel?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to LootDrop!",
    message:
      "This app helps you find virtual treasure boxes hidden at real businesses near you. Each box contains a real coupon or deal you can use. Let's show you how it works!",
    arrow: "none",
  },
  {
    id: "radar",
    title: "This is Your Radar",
    message:
      "The glowing dots on the radar are loot boxes near you. Each one is placed at a local business. The closer a dot is to the center, the closer that business is to you right now.",
    arrow: "none",
  },
  {
    id: "ar-button",
    title: "Try AR Mode",
    message:
      "Tap the AR button in the top-right corner to switch to camera mode. You'll see the treasure boxes floating in the real world through your camera!",
    arrow: "top-right",
    arrowLabel: "Tap here",
  },
  {
    id: "nearby-list",
    title: "Nearby Loot Boxes",
    message:
      "Scroll down to see a list of all nearby loot boxes. Each card shows the business name, what kind of deal is inside, and how far away it is.",
    arrow: "none",
  },
  {
    id: "claim",
    title: "How to Claim a Deal",
    message:
      "Tap any loot box (on the radar, in AR, or in the list) to claim it! You need to be within 100 meters of the business. Don't worry — in demo mode you can claim from anywhere.",
    arrow: "none",
  },
  {
    id: "map-tab",
    title: "Explore the Map",
    message:
      "The Map tab shows all loot boxes on a real map so you can plan where to go. It's great for finding deals in a specific neighborhood.",
    arrow: "bottom-left",
    arrowLabel: "Map tab",
  },
  {
    id: "loot-tab",
    title: "Your Collection",
    message:
      "Every deal you claim goes into your Loot collection. Open this tab to view your coupons, see expiration dates, and redeem them at the business.",
    arrow: "bottom-center",
    arrowLabel: "Loot tab",
  },
  {
    id: "xp",
    title: "Earn XP & Level Up",
    message:
      "You earn XP for every box you claim and every day you open the app. Level up from Bronze to Silver to Gold! Check your stats on the Profile tab.",
    arrow: "bottom-right",
    arrowLabel: "Profile tab",
  },
  {
    id: "done",
    title: "You're All Set!",
    message:
      "New loot drops appear every day at businesses near you. Open the app daily to earn bonus XP and never miss a deal. Happy hunting!",
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
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
}
