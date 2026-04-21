import { useContext, useEffect, useState } from "react";
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
            <h2>{auth.name || "Your Profile"}</h2>
            <p>{auth.email || ""}</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-column">
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
