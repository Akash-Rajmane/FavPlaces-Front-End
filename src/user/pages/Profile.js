import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import NotificationToggle from "../components/NotificationToggle";
import useHttpClient from "../../shared/hooks/http-hook";

import "./Profile.css";

const Profile = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, isLoading, error } = useHttpClient();

  const [followRequests, setFollowRequests] = useState([]);

  // 🔹 Fetch pending follow requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/follow/requests`,
          "GET",
          null,
          {
            Authorization: "Bearer " + auth.token,
          }
        );

        setFollowRequests(responseData.requests);
      } catch (err) {
        console.error(err);
      }
    };

    if (auth.token) {
      fetchRequests();
    }
  }, [sendRequest, auth.token]);

  // ✅ Accept follow request
  const acceptHandler = async (followId) => {
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/follow/accept`,
        "POST",
        JSON.stringify({ followId }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );

      setFollowRequests((prev) => prev.filter((req) => req._id !== followId));
    } catch (err) {
      console.error(err);
    }
  };

  // ❌ Reject follow request
  const rejectHandler = async (followId) => {
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/follow/reject`,
        "POST",
        JSON.stringify({ followId }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );

      setFollowRequests((prev) => prev.filter((req) => req._id !== followId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <img
          src={auth.image || "https://via.placeholder.com/120"}
          alt="Profile"
          className="profile-avatar"
        />

        <h2 className="profile-name">{auth.name}</h2>
        <p className="profile-email">{auth.email}</p>

        {/* 🔔 Preferences */}
        <div className="profile-section">
          <h3>Preferences</h3>
          <NotificationToggle />
        </div>

        {/* 👥 Follow Requests */}
        <div className="profile-section">
          <h3>Follow Requests</h3>

          {isLoading && <p>Loading...</p>}

          {!isLoading && followRequests.length === 0 && (
            <p>No pending requests</p>
          )}

          {!isLoading &&
            followRequests.map((req) => (
              <div key={req._id} className="follow-request-item">
                <span>{req.follower.name}</span>

                <div className="follow-actions">
                  <button
                    className="accept-btn"
                    onClick={() => acceptHandler(req._id)}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => rejectHandler(req._id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
        </div>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
};

export default Profile;
