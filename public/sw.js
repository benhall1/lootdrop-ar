// LootDrop AR — Service Worker for Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications
self.addEventListener("push", (event) => {
  const defaultData = {
    title: "LootDrop AR",
    body: "New loot drops nearby!",
    icon: "/assets/images/icon.png",
    badge: "/assets/images/favicon.png",
    tag: "lootdrop",
    data: { url: "/" },
  };

  let payload = defaultData;
  if (event.data) {
    try {
      payload = { ...defaultData, ...event.data.json() };
    } catch {
      payload = { ...defaultData, body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: payload.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "View Drop" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(url);
    })
  );
});
