/* eslint-disable no-restricted-globals */
/* global self */

// -------------------------------
// INSTALL
// -------------------------------
self.addEventListener("install", (event) => {
  // Activate service worker immediately
  self.skipWaiting();
});

// -------------------------------
// ACTIVATE
// -------------------------------
self.addEventListener("activate", (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// -------------------------------
// PUSH NOTIFICATION
// -------------------------------
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Push event but no data");
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "Notification", body: event.data.text() };
  }

  const title = data.title || "New Notification";
  const options = {
    body: data.body || "You have a new update",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/badge.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// -------------------------------
// NOTIFICATION CLICK
// -------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
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

// -------------------------------
// OPTIONAL: HANDLE NOTIFICATION CLOSE
// -------------------------------
self.addEventListener("notificationclose", (event) => {
  // Optional: analytics / cleanup
});
