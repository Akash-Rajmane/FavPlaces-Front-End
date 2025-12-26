const VAPID_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;
const API_URL = process.env.REACT_APP_BACKEND_URL;

// Convert a Base64 (URL-safe) string to a Uint8Array for the Push API
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(token) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser");
  }
  if (!("PushManager" in window)) {
    throw new Error("Push messaging is not supported in this browser");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission denied");

  // Use getRegistration() so we don't block waiting for a service worker
  // to become active (navigator.serviceWorker.ready may never resolve in
  // development if no SW is registered). If there's no registration,
  // surface a clear error to the caller.
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    throw new Error(
      "No service worker registered. Push requires a registered service worker (use production build or register one)."
    );
  }

  if (!VAPID_KEY) throw new Error("VAPID public key not configured");
  const applicationServerKey = urlBase64ToUint8Array(VAPID_KEY);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ subscription }),
  });
}

export async function unsubscribeFromPush(token) {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();

    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
    });
  }
}

export async function isPushEnabled() {
  // Don't wait on navigator.serviceWorker.ready if service worker or Push isn't available
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (err) {
    console.error("isPushEnabled error", err);
    return false;
  }
}
