import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);

const ICON_MAP: Record<ToastType, string> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { theme } = useTheme();

  const colorMap: Record<ToastType, string> = {
    success: theme.success,
    error: theme.error,
    info: theme.accent,
  };

  const color = colorMap[toast.type];

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(200)}
    >
      <Pressable
        onPress={onDismiss}
        style={[
          styles.toast,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: color + "40",
            ...Platform.select({
              web: { boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 16px ${color}15` },
              default: {},
            }),
          },
        ]}
      >
        <Feather name={ICON_MAP[toast.type] as any} size={18} color={color} />
        <ThemedText style={styles.toastText} numberOfLines={2} ellipsizeMode="tail">
          {toast.message}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]); // max 3 visible
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  const ctx: ToastContextType = {
    success: useCallback((msg: string) => show(msg, "success"), [show]),
    error: useCallback((msg: string) => show(msg, "error"), [show]),
    info: useCallback((msg: string) => show(msg, "info"), [show]),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    gap: Spacing.sm,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
