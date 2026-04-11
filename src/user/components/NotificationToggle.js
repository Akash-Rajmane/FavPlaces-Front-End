import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import {
  subscribeToPush,
  unsubscribeFromPush,
  isPushEnabled,
} from "../../shared/util/pushNotification";

import "./NotificationToggle.css";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const NotificationToggle = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, error, clearError } = useHttpClient();
  const [enabled, setEnabled] = useState(false);
  const [togglePending, setTogglePending] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
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
    setTogglePending(true);
    setActionError(null);
    clearError();
    try {
      if (enabled) {
        await unsubscribeFromPush(sendRequest, auth.token, API_URL);
      } else {
        if (Notification.permission === "denied") {
          throw new Error(
            "Notification permission is denied in browser settings.",
          );
        }
        await subscribeToPush(sendRequest, auth.token, API_URL);
      }
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Push subscription failed.");
    } finally {
      try {
        const val = await isPushEnabled();
        setEnabled(val);
      } catch (err) {
        console.error("Error re-checking push state:", err);
        setEnabled(false);
      }
      setTogglePending(false);
    }
  };

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />

      <div className="notification-toggle">
        <div className="notification-toggle__row">
          <label
            className={`notification-toggle__label${
              togglePending ? " notification-toggle__label--pending" : ""
            }`}
          >
            <span className="notification-toggle__title">Notifications</span>
            <input
              type="checkbox"
              className="notification-toggle__checkbox"
              checked={enabled}
              disabled={togglePending}
              onChange={toggleHandler}
            />
          </label>
          {togglePending ? (
            <span
              className="notification-toggle__spinner"
              role="status"
              aria-live="polite"
            >
              Saving…
            </span>
          ) : null}
        </div>
        {actionError ? (
          <p className="notification-toggle__action-error">{actionError}</p>
        ) : null}
      </div>
    </>
  );
};

export default NotificationToggle;
