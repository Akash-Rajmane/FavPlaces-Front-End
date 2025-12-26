import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushEnabled,
} from "../../shared/util/pushNotification";

import "./NotificationToggle.css";

const NotificationToggle = () => {
  const auth = useContext(AuthContext);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  console.log(
    "NotificationToggle render, enabled:",
    enabled,
    "loading:",
    loading
  );
  useEffect(() => {
    isPushEnabled()
      .then((status) => setEnabled(status))
      .catch((err) => {
        console.error("isPushEnabled failed", err);
        setEnabled(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleHandler = async () => {
    setLoading(true);
    try {
      if (enabled) {
        await unsubscribeFromPush(auth.token);
        setEnabled(false);
      } else {
        await subscribeToPush(auth.token);
        setEnabled(true);
      }
    } catch (err) {
      alert(err.message || "Unable to update subscription");
    } finally {
      setLoading(false);
    }
  };

  const pushSupported = "serviceWorker" in navigator && "PushManager" in window;

  return (
    <div className="toggle-container">
      <span>Notifications</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={enabled}
          onChange={toggleHandler}
          disabled={loading || !pushSupported}
        />
        <span className="slider" />
      </label>
      {!pushSupported && (
        <div style={{ marginTop: 6, color: "#777", fontSize: 12 }}>
          Push notifications are not supported in this browser.
        </div>
      )}
    </div>
  );
};

export default NotificationToggle;
