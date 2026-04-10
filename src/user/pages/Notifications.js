import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Notifications = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, isLoading, error } = useHttpClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth.token) {
        return;
      }

      try {
        const res = await sendRequest(`${API_URL}/notifications`, "GET", null, {
          Authorization: "Bearer " + auth.token,
        });
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      } catch (err) {}
    };

    fetchNotifications();
  }, [auth.token, sendRequest]);

  const markRead = async (nid) => {
    try {
      await sendRequest(`${API_URL}/notifications/${nid}/read`, "PATCH", null, {
        Authorization: "Bearer " + auth.token,
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === nid
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (err) {}
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {error && <p>{error}</p>}
      {notifications.length === 0 && <p>No notifications</p>}
      <ul>
        {notifications.map((notification) => (
          <li
            key={notification._id}
            style={{ opacity: notification.isRead ? 0.6 : 1 }}
          >
            <p>{notification.message}</p>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              From: {notification.sender ? notification.sender.name : "System"} -
              {" "}{new Date(notification.createdAt).toLocaleString()}
            </p>
            {!notification.isRead && (
              <button onClick={() => markRead(notification._id)}>
                Mark as read
              </button>
            )}
            {notification.link && (
              <p>
                <Link to={notification.link}>Open</Link>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
