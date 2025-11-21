import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@lootdrop_user';

export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
}

export class UserService {
  static async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  static async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Save user error:', error);
      throw error;
    }
  }

  static async updatePremiumStatus(isPremium: boolean): Promise<void> {
    try {
      const user = await this.getUser();
      if (user) {
        user.isPremium = isPremium;
        await this.saveUser(user);
      }
    } catch (error) {
      console.error('Update premium status error:', error);
      throw error;
    }
  }

  static async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Clear user error:', error);
    }
  }

  static generateGuestId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
