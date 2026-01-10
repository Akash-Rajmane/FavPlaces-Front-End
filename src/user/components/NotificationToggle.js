import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushEnabled,
} from "../../shared/util/pushNotification";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationToggle = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, isLoading, error } = useHttpClient();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Initialize toggle based on actual subscription state
    (async () => {
      try {
        const val = await isPushEnabled();
        setEnabled(val);
      } catch (err) {
        console.error("Error checking push state:", err);
        setEnabled(false);
      }
    })();
  }, []);

  const toggleHandler = async () => {
    try {
      if (enabled) {
        await unsubscribeFromPush(sendRequest, auth.token, API_URL);
      } else {
        // If notifications are denied, short-circuit and show a console hint
        if (Notification.permission === "denied") {
          throw new Error(
            "Notification permission is denied in browser settings"
          );
        }
        await subscribeToPush(sendRequest, auth.token, API_URL);
      }
    } catch (err) {
      console.error(err);
      // Show a user-facing error so people know why subscribe failed (permission, network, etc.)
      alert(err.message || "Push subscription failed");
    } finally {
      // Re-check actual state after attempt to avoid optimistic mismatches
      try {
        const val = await isPushEnabled();
        setEnabled(val);
      } catch (err) {
        console.error("Error re-checking push state:", err);
        setEnabled(false);
      }
    }
  };

  return (
    <label>
      Notifications
      <input
        type="checkbox"
        checked={enabled}
        disabled={isLoading}
        onChange={toggleHandler}
      />
      {error && <p>{error}</p>}
    </label>
  );
};

export default NotificationToggle;
