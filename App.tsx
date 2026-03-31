import React, { createContext, useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import OnboardingScreen, { hasSeenOnboarding } from "@/screens/OnboardingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WebFontLoader } from "@/components/WebFontLoader";
import { AuthService } from "@/services/authService";
import { PushService } from "@/services/pushService";
import { ToastProvider } from "@/contexts/ToastContext";
import { GuidedTourProvider } from "@/contexts/GuidedTourContext";
import { TourOverlay } from "@/components/TourOverlay";
import { InstallPrompt } from "@/components/InstallPrompt";

interface AuthContextType {
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Wait for both onboarding check and auth check before showing anything
    Promise.all([
      hasSeenOnboarding().then((seen) => {
        if (!seen) setShowOnboarding(true);
      }),
      AuthService.isSignedIn().then((signedIn) => {
        setIsAuthenticated(signedIn);
      }),
    ]).then(() => {
      setIsLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const unsubscribe = AuthService.onAuthStateChange((session) => {
      setIsAuthenticated(!!session);
    });

    // Register service worker for push notifications
    PushService.register();

    // Inject PWA manifest + theme-color meta tag for web
    if (typeof document !== "undefined") {
      if (!document.querySelector('link[rel="manifest"]')) {
        const manifest = document.createElement("link");
        manifest.rel = "manifest";
        manifest.href = "/manifest.json";
        document.head.appendChild(manifest);
      }
      if (!document.querySelector('meta[name="theme-color"]')) {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = "#0C0F1A";
        document.head.appendChild(meta);
      }
    }

    return unsubscribe;
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null;
  }

  return (
  <ErrorBoundary>
    <WebFontLoader />
    <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <ToastProvider>
              {showOnboarding ? (
                <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
              ) : isAuthenticated ? (
                <AuthContext.Provider value={{ signOut: handleSignOut }}>
                  <GuidedTourProvider>
                    <View style={styles.tourContainer}>
                      <NavigationContainer>
                        <MainTabNavigator />
                      </NavigationContainer>
                      <TourOverlay />
                      <InstallPrompt />
                    </View>
                  </GuidedTourProvider>
                </AuthContext.Provider>
              ) : (
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
              )}
            </ToastProvider>
            <StatusBar style="auto" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tourContainer: {
    flex: 1,
    position: "relative" as const,
  },
});
