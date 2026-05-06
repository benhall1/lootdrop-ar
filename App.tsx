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
      // Phone-frame layout on desktop: center the app in a 480px column
      // with the rest of the viewport filled with a dark backdrop.
      if (!document.getElementById("lootdrop-phone-frame")) {
        const style = document.createElement("style");
        style.id = "lootdrop-phone-frame";
        style.textContent = `
          @media (min-width: 768px) {
            html, body {
              background: radial-gradient(ellipse at top, #181D38 0%, #050714 70%) !important;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            #root {
              max-width: 480px;
              width: 100%;
              height: 100vh;
              max-height: 920px;
              margin: 0 auto;
              border-radius: 28px;
              overflow: hidden;
              box-shadow:
                0 0 0 1px rgba(255,255,255,0.06),
                0 30px 80px rgba(0,0,0,0.6),
                0 0 80px rgba(255,109,58,0.08);
              flex: none !important;
            }
          }
        `;
        document.head.appendChild(style);
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
