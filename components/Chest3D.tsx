import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

export type ChestRarity = "gold" | "silver" | "bronze" | "epic";

interface Chest3DProps {
  size?: number;
  rarity?: ChestRarity;
  floating?: boolean;
  opening?: boolean;
}

const COLORS: Record<
  ChestRarity,
  { top: string; mid: string; dark: string; strap: string; glow: string }
> = {
  gold: { top: "#FFD54F", mid: "#FFB300", dark: "#8B6500", strap: "#5A3F00", glow: "#FFD54F" },
  silver: { top: "#E8EDF7", mid: "#9CA8C0", dark: "#5A6378", strap: "#2D3540", glow: "#C0CAE0" },
  bronze: { top: "#E89B5E", mid: "#B86F30", dark: "#6B3D14", strap: "#3D2208", glow: "#E89B5E" },
  epic: { top: "#E0AAFF", mid: "#9D4EDD", dark: "#5A189A", strap: "#240046", glow: "#C77DFF" },
};

export function Chest3D({
  size = 80,
  rarity = "gold",
  floating = true,
  opening = false,
}: Chest3DProps) {
  const c = COLORS[rarity];
  const float = useSharedValue(0);

  useEffect(() => {
    if (!floating) return;
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1750, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [floating]);

  const wrapStyle = useAnimatedStyle(() => {
    const ty = -12 * float.value;
    const rot = `${-2 + 4 * float.value}deg`;
    return {
      transform: [{ translateY: ty }, { rotate: rot }] as any,
    };
  });

  const lidRotate = opening ? "-35deg" : "0deg";
  const bodyH = size * 0.4;
  const bodyW = size * 0.72;
  const lidH = size * 0.22;

  return (
    <Animated.View style={[{ width: size, height: size }, wrapStyle]}>
      {/* glow halo */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: c.glow,
            opacity: 0.25,
            borderRadius: size,
            transform: [{ scale: 1.4 }],
          },
        ]}
      />
      {/* Body */}
      <View
        style={{
          position: "absolute",
          left: size * 0.14,
          top: size * 0.44,
          width: bodyW,
          height: bodyH,
          backgroundColor: c.mid,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: c.dark,
          shadowColor: c.glow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.6,
          shadowRadius: 16,
          elevation: 8,
        }}
      />
      {/* Lid */}
      <View
        style={{
          position: "absolute",
          left: size * 0.14,
          top: size * 0.22,
          width: bodyW,
          height: lidH,
          backgroundColor: c.top,
          borderTopLeftRadius: bodyW / 2,
          borderTopRightRadius: bodyW / 2,
          borderWidth: 2,
          borderColor: c.dark,
          transform: [{ rotate: lidRotate }],
        }}
      />
      {/* Vertical strap */}
      <View
        style={{
          position: "absolute",
          left: size * 0.46,
          top: size * 0.22,
          width: size * 0.08,
          height: size * 0.62,
          backgroundColor: c.strap,
        }}
      />
      {/* Horizontal strap */}
      <View
        style={{
          position: "absolute",
          left: size * 0.14,
          top: size * 0.56,
          width: bodyW,
          height: size * 0.06,
          backgroundColor: c.strap,
        }}
      />
      {/* Lock */}
      <View
        style={{
          position: "absolute",
          left: size * 0.44,
          top: size * 0.5,
          width: size * 0.12,
          height: size * 0.14,
          backgroundColor: c.top,
          borderRadius: 2,
          borderWidth: 1.5,
          borderColor: c.dark,
        }}
      />
    </Animated.View>
  );
}

export default Chest3D;
