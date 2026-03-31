import { Platform } from "react-native";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const VAPID_PUBLIC_KEY =
  "BHGUgXeeojfBM_jlXyMAjcpQOWoS4rx6RuwQYFTg0FntrOewPp6hZk3ucEyaMslW8BeHM2ILfYx-YMptSW4lWDo";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushService {
  private static registration: ServiceWorkerRegistration | null = null;

  /** Check if Web Push is supported in this browser */
  static isSupported(): boolean {
    return (
      Platform.OS === "web" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /** Get current permission state */
  static getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  /** Register the service worker */
  static async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[Push] Service worker registered");
      return this.registration;
    } catch (err) {
      console.warn("[Push] Service worker registration failed:", err);
      return null;
    }
  }

  /** Request permission and subscribe to push notifications */
  static async subscribe(userId?: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) return null;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[Push] Permission denied");
      return null;
    }

    // Ensure SW is registered
    if (!this.registration) {
      this.registration = await this.register();
    }
    if (!this.registration) return null;

    try {
      // Check for existing subscription
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
        console.log("[Push] Subscribed to push notifications");
      }

      // Save subscription to Supabase
      await this.saveSubscription(subscription, userId);

      return subscription;
    } catch (err) {
      console.warn("[Push] Subscription failed:", err);
      return null;
    }
  }

  /** Unsubscribe from push notifications */
  static async unsubscribe(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        // Remove from Supabase
        if (isSupabaseConfigured) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", endpoint);
        }

        console.log("[Push] Unsubscribed");
        return true;
      }
    } catch (err) {
      console.warn("[Push] Unsubscribe failed:", err);
    }
    return false;
  }

  /** Check if currently subscribed */
  static async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      if (!this.isSupported()) return false;
      this.registration = (await navigator.serviceWorker.getRegistration()) || null;
    }
    if (!this.registration) return false;

    const subscription = await this.registration.pushManager.getSubscription();
    return !!subscription;
  }

  /** Save subscription to Supabase */
  private static async saveSubscription(
    subscription: PushSubscription,
    userId?: string
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    const key = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");
    if (!key || !auth) return;

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
    const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)));

    await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        p256dh,
        auth: authStr,
        user_id: userId || null,
      },
      { onConflict: "endpoint" }
    );
  }

  /** Send a local test notification (for testing without server) */
  static async sendTestNotification(): Promise<void> {
    if (!this.registration) return;

    await this.registration.showNotification("LootDrop AR", {
      body: "New loot drop spotted nearby! Tap to claim.",
      icon: "/assets/images/icon.png",
      tag: "lootdrop-test",
    } as NotificationOptions);
  }

  /**
   * Trigger a server-side push notification via Supabase Edge Function.
   * @param type - Notification type: "nearby-loot" | "daily-reminder" | "claim-congrats" | "broadcast"
   * @param title - Notification title
   * @param body - Notification body text
   * @param options - Optional: userId to target, data payload
   */
  static async triggerNotification(
    type: string,
    title: string,
    body: string,
    options?: { userId?: string; data?: Record<string, string> }
  ): Promise<{ sent: number; failed: number } | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: {
          type,
          title,
          body,
          userId: options?.userId,
          data: options?.data,
        },
      });

      if (error) {
        console.warn("[Push] Trigger failed:", error);
        return null;
      }

      return data as { sent: number; failed: number };
    } catch (err) {
      console.warn("[Push] Trigger error:", err);
      return null;
    }
  }
}
