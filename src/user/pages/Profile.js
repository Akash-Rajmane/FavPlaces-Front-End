import { useContext } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import NotificationToggle from "../components/NotificationToggle";

import "./Profile.css";

const Profile = () => {
  const auth = useContext(AuthContext);

  return (
    <div className="profile-page">
      <div className="profile-card">
        <img
          src={auth.image || "https://via.placeholder.com/120"}
          alt="Profile"
          className="profile-avatar"
        />

        <h2 className="profile-name">name</h2>
        <p className="profile-email">email</p>

        <div className="profile-section">
          <h3>Preferences</h3>
          <NotificationToggle />
        </div>
      </div>
    </div>
  );
};

export default Profile;
