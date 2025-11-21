import { Platform } from "react-native";
import { UserLocation } from "../types";

let Location: any = null;

if (Platform.OS !== "web") {
  Location = require("expo-location");
}

const MOCK_LOCATION: UserLocation = {
  latitude: 37.7849,
  longitude: -122.4094,
};

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") {
      return true;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  static async getCurrentLocation(): Promise<UserLocation | null> {
    if (Platform.OS === "web") {
      return MOCK_LOCATION;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  }

  static async watchLocation(
    callback: (location: UserLocation) => void
  ): Promise<any | null> {
    if (Platform.OS === "web") {
      callback(MOCK_LOCATION);
      return null;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error("Error watching location:", error);
      return null;
    }
  }
}
