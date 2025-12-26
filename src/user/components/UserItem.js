import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";

import Avatar from "../../shared/components/UIElements/Avatar";
import Card from "../../shared/components/UIElements/Card";
import { AuthContext } from "../../shared/context/auth-context";
import useHttpClient from "../../shared/hooks/http-hook";

import "./UserItem.css";

const UserItem = (props) => {
  const auth = useContext(AuthContext);
  const { sendRequest } = useHttpClient();

  /**
   * followStatus values:
   * "none" | "pending" | "accepted"
   */
  const [followStatus, setFollowStatus] = useState(
    props.followStatus || "none"
  );

  const isLoggedIn = !!auth.token;
  const isSelf = auth.userId === props.id;

  const followHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/follow/request`,
        "POST",
        JSON.stringify({ userId: props.id }),
        {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        }
      );

      // ✅ Request sent, waiting for acceptance
      setFollowStatus("pending");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <li className="user-item">
      <Card className="user-item__content">
        <Link to={`/${props.id}/places`} className="user-item__link">
          <div className="user-item__image">
            <Avatar image={props.image} alt={props.name} />
          </div>

          <div className="user-item__info">
            <h2>{props.name}</h2>
            <h3>
              {props.placeCount} {props.placeCount === 1 ? "Place" : "Places"}
            </h3>
          </div>
        </Link>

        {/* 🔽 FOLLOW STATE UI */}

        {/* 1️⃣ NOT FOLLOWING */}
        {isLoggedIn && !isSelf && followStatus === "none" && (
          <div className="user-item__actions">
            <button onClick={followHandler} className="follow-btn">
              Follow
            </button>
          </div>
        )}

        {/* 2️⃣ REQUEST SENT (PENDING) */}
        {isLoggedIn && !isSelf && followStatus === "pending" && (
          <div className="user-item__actions pending">Request Sent</div>
        )}

        {/* 3️⃣ FOLLOWING (ACCEPTED) */}
        {isLoggedIn && !isSelf && followStatus === "accepted" && (
          <div className="user-item__actions followed">Following</div>
        )}
      </Card>
    </li>
  );
};

export default UserItem;
