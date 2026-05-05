import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LootBox, UserLocation } from "../types";
import { GamificationState } from "../services/gamificationService";
import { calculateDistance, formatDistance } from "../services/geolocation";

interface ARHudProps {
  lootBoxes: LootBox[];
  userLocation: UserLocation | null;
  gamification: GamificationState | null;
  onLootBoxTap: (box: LootBox) => void;
  onMapPress: () => void;
  onSearchPress?: () => void;
}

// Native fallback — the rich AR HUD is web-only (.web.tsx).
export function ARHud({ lootBoxes, userLocation, onLootBoxTap }: ARHudProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>SCANNING NEARBY</Text>
      <Text style={styles.count}>{lootBoxes.length} LOOT DROPS</Text>
      <View style={{ height: 16 }} />
      {lootBoxes.slice(0, 5).map((box) => {
        const distance = userLocation
          ? calculateDistance(userLocation, {
              latitude: box.latitude,
              longitude: box.longitude,
            })
          : 0;
        return (
          <Pressable key={box.id} onPress={() => onLootBoxTap(box)} style={styles.row}>
            <Text style={styles.name}>{box.businessName}</Text>
            <Text style={styles.dist}>{formatDistance(distance)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default ARHud;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0d1c", padding: 24, justifyContent: "center" },
  title: { color: "#00E5FF", fontSize: 11, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  count: { color: "#fff", fontSize: 26, fontWeight: "900", textAlign: "center", marginTop: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,229,255,0.1)",
  },
  name: { color: "#fff", fontSize: 14, fontWeight: "800" },
  dist: { color: "#00E5FF", fontSize: 14, fontWeight: "700" },
});
