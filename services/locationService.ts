import * as Location from "expo-location";
import { UserLocation } from "../types";

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  static async getCurrentLocation(): Promise<UserLocation | null> {
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
  ): Promise<Location.LocationSubscription | null> {
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
