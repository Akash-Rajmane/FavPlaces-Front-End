// In production, we register a service worker to serve assets from local cache.
// Modified for PUSH NOTIFICATION SAFETY + IMMEDIATE ACTIVATION

const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(
      window.location.hostname
    )
);

export default function register() {
  if (
    (process.env.NODE_ENV === "production" || isLocalhost) &&
    "serviceWorker" in navigator
  ) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    // ⚠️ DO NOT wait for full page load (push safety)
    window.addEventListener("DOMContentLoaded", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl);
      } else {
        registerValidSW(swUrl);
      }
    });
  }
}

/* --------------------------------------------------
   REGISTER
-------------------------------------------------- */
function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // 🔥 Ensure ready ASAP for push
      navigator.serviceWorker.ready.then(() => {
        console.log("Service Worker ready");
      });

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed") {
            // 🔥 Force activate new SW
            installingWorker.postMessage({ type: "SKIP_WAITING" });

            if (navigator.serviceWorker.controller) {
              console.log("New content available, activating immediately");
            } else {
              console.log("Content cached for offline use");
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}

/* --------------------------------------------------
   LOCALHOST CHECK
-------------------------------------------------- */
function checkValidServiceWorker(swUrl) {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType && !contentType.includes("javascript"))
      ) {
        // No valid SW found → clean up
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log("Offline mode: Service Worker not validated");
    });
}

/* --------------------------------------------------
   UNREGISTER
-------------------------------------------------- */
export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch(() => {});
  }
}
