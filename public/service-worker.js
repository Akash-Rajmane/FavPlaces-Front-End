/* eslint-disable no-restricted-globals */
/* global self */

/* --------------------------------------------------
   INSTALL
-------------------------------------------------- */
self.addEventListener("install", (event) => {
  // Activate immediately on first install
  self.skipWaiting();
});

/* --------------------------------------------------
   ACTIVATE
-------------------------------------------------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* --------------------------------------------------
   MESSAGE (for SKIP_WAITING from app)
-------------------------------------------------- */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* --------------------------------------------------
   PUSH EVENT
-------------------------------------------------- */
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Push event received with no data");
    return;
  }

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Notification",
      body: event.data.text(),
    };
  }

  const title = payload.title || "New Notification";

  const options = {
    body: payload.body || "You have a new message",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/badge.png",
    vibrate: [200, 100, 200],
    requireInteraction: true, // 🔥 Prevent auto-dismiss
    renotify: true,
    tag: payload.tag || "general",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error("showNotification failed:", err);
    })
  );
});

/* --------------------------------------------------
   NOTIFICATION CLICK
-------------------------------------------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

/* --------------------------------------------------
   PUSH SUBSCRIPTION CHANGE
   (IMPORTANT for Chrome / Edge)
-------------------------------------------------- */
self.addEventListener("pushsubscriptionchange", (event) => {
  console.warn("Push subscription expired or changed", event);
  // Backend should re-subscribe user on next app load
});

/* --------------------------------------------------
   NOTIFICATION CLOSE (OPTIONAL)
-------------------------------------------------- */
self.addEventListener("notificationclose", () => {
  // Optional analytics hook
});
