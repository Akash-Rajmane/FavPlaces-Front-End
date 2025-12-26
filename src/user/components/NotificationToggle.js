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
    isPushEnabled().then(setEnabled);
  }, []);

  const toggleHandler = async () => {
    try {
      if (enabled) {
        await unsubscribeFromPush(sendRequest, auth.token, API_URL);
        setEnabled(false);
      } else {
        await subscribeToPush(sendRequest, auth.token, API_URL);
        setEnabled(true);
      }
    } catch (err) {
      console.error(err);
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
