import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface Coupon3DData {
  business: string;
  deal: string;
  sub?: string;
  code: string;
  expires: string;
  logo?: string;
  color?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

interface Coupon3DProps {
  data: Coupon3DData;
  width?: number;
  height?: number;
  autoSpin?: boolean;
}

// Native fallback: static front face (no 3D spin on RN)
export function Coupon3D({ data, width = 280, height = 380 }: Coupon3DProps) {
  const color = data.color || "#FF6D3A";
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 22,
        overflow: "hidden",
        backgroundColor: color,
        padding: 22,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "800",
          color: "rgba(255,255,255,0.85)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginTop: "auto",
        }}
      >
        {data.business}
      </Text>
      <Text
        style={{
          fontSize: 64,
          color: "#fff",
          letterSpacing: -2,
          lineHeight: 64,
          fontWeight: "900",
        }}
      >
        {data.deal}
      </Text>
      {data.sub && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "rgba(255,255,255,0.9)",
            marginTop: 2,
          }}
        >
          {data.sub}
        </Text>
      )}
      <View style={{ flex: 1 }} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={styles.label}>Expires</Text>
          <Text style={styles.value}>{data.expires}</Text>
        </View>
        <View>
          <Text style={styles.label}>Code</Text>
          <Text style={styles.value}>{data.code}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 8,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
});

export default Coupon3D;
