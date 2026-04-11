import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import "./Notifications.css";

const backend = process.env.REACT_APP_BACKEND_URL;

const TYPE_LABEL = {
  FOLLOW_REQUEST: "Follow request",
  FOLLOW_ACCEPTED: "Follow",
  NEW_PLACE: "New place",
};

function NotificationTargetLink({ link, children }) {
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) {
    return (
      <a
        href={link}
        className="notifications-page__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={link} className="notifications-page__link">
      {children}
    </Link>
  );
}

const Notifications = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, error, clearError } = useHttpClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  const loadNotifications = useCallback(async () => {
    if (!auth.token) {
      setNotifications([]);
      setUnreadCount(0);
      setListLoading(false);
      return;
    }

    setListLoading(true);
    try {
      const res = await sendRequest(`${backend}/notifications`, "GET", null, {
        Authorization: "Bearer " + auth.token,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      });
      const list = res.notifications || [];
      setNotifications(list);
      setUnreadCount(
        typeof res.unreadCount === "number" ? res.unreadCount : list.length,
      );
    } catch {
      /* ErrorModal via http hook */
    } finally {
      setListLoading(false);
    }
  }, [auth.token, sendRequest]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (nid) => {
    setMarkingId(nid);
    try {
      await sendRequest(
        `${backend}/notifications/${nid}/read`,
        "PATCH",
        JSON.stringify({}),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.filter((n) => String(n._id) !== String(nid)),
      );
    } catch {
      /* ErrorModal */
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <>
      <ErrorModal error={error} onClear={clearError} />

      <div className="notifications-page">
        <div className="notifications-page__inner">
          <header className="notifications-page__header">
            <p className="notifications-page__eyebrow">Inbox</p>
            <h1 className="notifications-page__title">Notifications</h1>
            <p className="notifications-page__meta">
              {unreadCount === 0
                ? "You're all caught up."
                : `${unreadCount} unread`}
            </p>
          </header>

          {listLoading ? (
            <div className="notifications-page__spinner">
              <LoadingSpinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-page__empty">
              No unread notifications. You’re caught up — new activity will
              appear here.
            </div>
          ) : (
            <ul className="notifications-page__list">
              {notifications.map((notification) => {
                const sender = notification.sender;
                const name = sender?.name || "System";
                const initial = name.trim().charAt(0).toUpperCase() || "?";

                return (
                  <li
                    key={notification._id}
                    className="notifications-page__item notifications-page__item--unread"
                  >
                    <div className="notifications-page__avatar-wrap">
                      {sender?.image ? (
                        <img src={sender.image} alt="" />
                      ) : (
                        <span aria-hidden>{initial}</span>
                      )}
                    </div>
                    <div className="notifications-page__body">
                      <div className="notifications-page__row">
                        {notification.type ? (
                          <span className="notifications-page__badge">
                            {TYPE_LABEL[notification.type] || notification.type}
                          </span>
                        ) : null}
                        <span className="notifications-page__time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="notifications-page__message">
                        {notification.message}
                      </p>
                      <p className="notifications-page__time">
                        From <strong>{name}</strong>
                      </p>
                      <div className="notifications-page__footer">
                        <div className="notifications-page__actions">
                          <button
                            type="button"
                            className="notifications-page__mark-read"
                            disabled={markingId !== null}
                            aria-busy={
                              String(markingId) === String(notification._id)
                            }
                            onClick={() => markRead(notification._id)}
                          >
                            {String(markingId) === String(notification._id)
                              ? "Marking…"
                              : "Mark as read"}
                          </button>
                          {notification.link ? (
                            <NotificationTargetLink link={notification.link}>
                              Open related page
                            </NotificationTargetLink>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
