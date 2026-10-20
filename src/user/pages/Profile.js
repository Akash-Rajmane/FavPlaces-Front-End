import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../shared/context/auth-context";
import NotificationToggle from "../components/NotificationToggle";
import useHttpClient from "../../shared/hooks/http-hook";
import Avatar from "../../shared/components/UIElements/Avatar";
import Card from "../../shared/components/UIElements/Card";

import "./Profile.css";

const Profile = () => {
  const auth = useContext(AuthContext);
  const { sendRequest, isLoading, error } = useHttpClient();
  const [followRequests, setFollowRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/follow/requests`,
          "GET",
          null,
          {
            Authorization: "Bearer " + auth.token,
          },
        );

        setFollowRequests(responseData.requests || []);
      } catch (err) {}
    };

    if (auth.token) {
      fetchRequests();
    }
  }, [sendRequest, auth.token]);

  const acceptHandler = async (followId) => {
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/follow/accept`,
        "POST",
        JSON.stringify({ followId }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      );

      setFollowRequests((prev) => prev.filter((req) => req._id !== followId));
    } catch (err) {}
  };

  const rejectHandler = async (followId) => {
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/follow/reject`,
        "POST",
        JSON.stringify({ followId }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
      );

      setFollowRequests((prev) => prev.filter((req) => req._id !== followId));
    } catch (err) {}
  };

  return (
    <div className="profile-dashboard">
      <div className="profile-header-card">
        <div className="profile-cover"></div>
        <div className="profile-header-info">
          <div className="profile-avatar-wrapper">
            <Avatar image={auth.image || ""} alt={auth.name || "Profile"} />
          </div>
          <div className="profile-text-info">
            <h2>
              {auth.name || "Your Profile"}
              {auth.isPremium && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "0.5rem",
                    padding: "0.15rem 0.55rem",
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff",
                    borderRadius: "9999px",
                    verticalAlign: "middle",
                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.35)",
                  }}
                >
                  💎 PRO
                </span>
              )}
            </h2>
            <p>{auth.email || ""}</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-column">
          <Card className="profile-card-section">
            <h3>Membership & Plan</h3>
            {auth.isPremium ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#059669",
                  fontWeight: "600",
                  fontSize: "0.92rem",
                }}
              >
                <span>💎</span> FavPlaces Pro Member (All Features Unlocked)
              </div>
            ) : (
              <div>
                <p className="profile-muted-text" style={{ marginBottom: "0.75rem" }}>
                  Standard Plan (Free). Upgrade to unlock the AI Trip Planner, real-time weather, and Google Calendar sync.
                </p>
                <Link
                  to="/planner"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d2691e 100%)",
                    color: "#ffffff",
                    padding: "0.45rem 1rem",
                    borderRadius: "9999px",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    boxShadow: "0 2px 6px rgba(210, 105, 30, 0.3)",
                  }}
                >
                  <span>✦</span> Upgrade to Pro (₹199)
                </Link>
              </div>
            )}
          </Card>

          <Card className="profile-card-section">
            <h3>Preferences</h3>
            <NotificationToggle />
          </Card>
        </div>

        <div className="profile-column">
          <Card className="profile-card-section">
            <h3>Follow Requests</h3>

            {isLoading && <p className="profile-muted-text">Loading requests...</p>}

            {!isLoading && followRequests.length === 0 && (
              <p className="profile-muted-text">No pending follow requests.</p>
            )}

            {!isLoading && followRequests.length > 0 && (
              <ul className="follow-requests-list">
                {followRequests.map((req) => (
                  <li key={req._id} className="follow-request-item">
                    <div className="follow-request-user">
                      <div className="follow-request-avatar">
                        <Avatar image={req.follower.image} alt={req.follower.name} />
                      </div>
                      <span>{req.follower.name}</span>
                    </div>

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
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default Profile;
