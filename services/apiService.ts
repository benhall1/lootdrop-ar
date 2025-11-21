import * as WebBrowser from 'expo-web-browser';

const API_BASE_URL = __DEV__
  ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`
  : `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

export class ApiService {
  static async createGuestUser(email: string, name: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  static async getSubscription(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to get subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Get subscription error:', error);
      throw error;
    }
  }

  static async getProductsWithPrices() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products-with-prices`);

      if (!response.ok) {
        throw new Error('Failed to get products');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }

  static async createCheckoutSession(userId: string, priceId: string, email: string, name: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, priceId, email, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  static async openCheckout(checkoutUrl: string) {
    try {
      const result = await WebBrowser.openBrowserAsync(checkoutUrl);
      return result;
    } catch (error) {
      console.error('Open checkout error:', error);
      throw error;
    }
  }
}
