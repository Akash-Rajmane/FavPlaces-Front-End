const VAPID_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

// Convert a Base64 (URL-safe) string to a Uint8Array for the Push API
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ⬇️ sendRequest is injected
export async function subscribeToPush(sendRequest, token, apiUrl) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers not supported");
  }
  if (!("PushManager" in window)) {
    throw new Error("Push not supported");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission denied");

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    throw new Error("Service worker not registered");
  }

  if (!VAPID_KEY) throw new Error("VAPID key missing");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
  });

  await sendRequest(
    `${apiUrl}/push/subscribe`,
    "POST",
    JSON.stringify({ subscription }),
    {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    }
  );
}

export async function unsubscribeFromPush(sendRequest, token, apiUrl) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await subscription.unsubscribe();

  await sendRequest(`${apiUrl}/push/unsubscribe`, "POST", null, {
    Authorization: "Bearer " + token,
  });
}

export async function isPushEnabled() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  return !!(await registration.pushManager.getSubscription());
}
