import React, { createContext, useContext, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WebFontLoader } from "@/components/WebFontLoader";
import { AuthService } from "@/services/authService";
import { PushService } from "@/services/pushService";
import { ToastProvider } from "@/contexts/ToastContext";

interface AuthContextType {
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    AuthService.isSignedIn().then((signedIn) => {
      setIsAuthenticated(signedIn);
      setIsLoading(false);
    });

    // Listen for auth state changes (sign in, sign out, token refresh)
    const unsubscribe = AuthService.onAuthStateChange((session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Register service worker for push notifications
    PushService.register();

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
              {isAuthenticated ? (
                <AuthContext.Provider value={{ signOut: handleSignOut }}>
                  <NavigationContainer>
                    <MainTabNavigator />
                  </NavigationContainer>
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
});
