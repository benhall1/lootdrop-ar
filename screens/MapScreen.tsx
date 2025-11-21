import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CategoryChip } from "../components/CategoryChip";
import { CountdownTimer } from "../components/CountdownTimer";
import { FAB } from "../components/FAB";
import { useTheme } from "../hooks/useTheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius } from "../constants/theme";
import { mockLootBoxes } from "../services/mockData";
import { LocationCategory, LootBox } from "../types";

export default function MapScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);

  const categories: LocationCategory[] = ["restaurant", "retail", "entertainment", "services"];

  const filteredLootBoxes = selectedCategory
    ? mockLootBoxes.filter((box) => box.category === selectedCategory)
    : mockLootBoxes;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: Spacing.xl,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <ThemedText type="h3">Loot Drops Nearby</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryContainer, { paddingTop: Spacing.xl }]}
        style={[styles.categoryScroll, { backgroundColor: theme.backgroundRoot }]}
      >
        {categories.map((category) => (
          <CategoryChip
            key={category}
            category={category}
            selected={selectedCategory === category}
            onPress={() =>
              setSelectedCategory(selectedCategory === category ? null : category)
            }
          />
        ))}
      </ScrollView>

      <View
        style={[
          styles.mapPlaceholder,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather
          name="map"
          size={64}
          color={theme.textSecondary}
          style={{ opacity: 0.3 }}
        />
        <ThemedText
          style={[styles.placeholderText, { color: theme.textSecondary }]}
        >
          Interactive Map View
        </ThemedText>
        <ThemedText
          style={[styles.placeholderSubtext, { color: theme.textSecondary }]}
        >
          Showing {filteredLootBoxes.length} nearby loot drops
        </ThemedText>

        <FlatList
          data={filteredLootBoxes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.locationCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: item.isActive ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedLootBox(item)}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.marker,
                    {
                      backgroundColor: item.isActive
                        ? theme.primary
                        : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <Feather
                    name="gift"
                    size={20}
                    color={item.isActive ? "#FFF" : theme.textSecondary}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <ThemedText type="h3" numberOfLines={1}>
                    {item.businessName}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.cardSubtext,
                      { color: theme.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.coupon.title}
                  </ThemedText>
                </View>
                <CountdownTimer targetTime={item.dropTime} />
              </View>
            </Pressable>
          )}
        />
      </View>

      {selectedLootBox && (
        <View
          style={[
            styles.callout,
            {
              bottom: tabBarHeight + Spacing.xl,
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.calloutHeader}>
            <ThemedText type="h3" numberOfLines={1}>
              {selectedLootBox.businessName}
            </ThemedText>
            <Pressable onPress={() => setSelectedLootBox(null)}>
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>
          <ThemedText
            style={[styles.calloutSubtext, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {selectedLootBox.coupon.title}
          </ThemedText>
          <CountdownTimer targetTime={selectedLootBox.dropTime} style={styles.calloutTimer} />
        </View>
      )}

      <FAB
        icon="camera"
        onPress={() => navigation.navigate("Discover")}
        style={[styles.fab, { bottom: tabBarHeight + Spacing.xl }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing["3xl"],
  },
  placeholderText: {
    marginTop: Spacing.lg,
    fontSize: 18,
    fontWeight: "600",
  },
  placeholderSubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
    opacity: 0.7,
    marginBottom: Spacing["2xl"],
  },
  listContent: {
    padding: Spacing.lg,
    width: "100%",
  },
  locationCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardSubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  callout: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  calloutSubtext: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  calloutTimer: {
    alignSelf: "flex-start",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
  },
});
