import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import DiscoverScreen from "@/screens/DiscoverScreen";
import MapScreen from "@/screens/MapScreen";
import CollectionScreen from "@/screens/CollectionScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import { useTheme } from "@/hooks/useTheme";
import { Fonts } from "@/constants/theme";

export type MainTabParamList = {
  Discover: undefined;
  Map: undefined;
  Collection: undefined;
  Premium: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Feather name={name as any} size={22} color={color} />
      {focused && (
        <View style={[styles.activeIndicator, { backgroundColor: color }]} />
      )}
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          fontFamily: Fonts?.sans,
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
            web: theme.backgroundDefault + "F0",
            default: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          ...Platform.select({
            web: {
              backdropFilter: "blur(20px)",
              borderTopWidth: 1,
              borderTopColor: theme.border,
            },
            default: {},
          }),
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="crosshair" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="map" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          title: "Loot",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gift" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Premium"
        component={SubscriptionScreen}
        options={{
          title: "Premium",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="zap" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
