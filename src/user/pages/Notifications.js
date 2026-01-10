import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Notifications = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, isLoading, error } = useHttpClient();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await sendRequest(`${API_URL}/notifications`, "GET", null, {
          Authorization: "Bearer " + auth.token,
        });
        setNotifications(res.notifications || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, [auth.token, sendRequest]);

  const markRead = async (nid) => {
    try {
      await sendRequest(`${API_URL}/notifications/${nid}/read`, "PATCH", null, {
        Authorization: "Bearer " + auth.token,
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === nid ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Notifications</h2>
      {error && <p>{error}</p>}
      {notifications.length === 0 && <p>No notifications</p>}
      <ul>
        {notifications.map((n) => (
          <li key={n._id} style={{ opacity: n.isRead ? 0.6 : 1 }}>
            <p>{n.message}</p>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              From: {n.sender ? n.sender.name : "System"} —{" "}
              {new Date(n.createdAt).toLocaleString()}
            </p>
            {!n.isRead && (
              <button onClick={() => markRead(n._id)}>Mark as read</button>
            )}
            {n.link && (
              <p>
                <a href={n.link}>Open</a>
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
