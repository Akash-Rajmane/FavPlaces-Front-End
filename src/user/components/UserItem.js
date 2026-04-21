import React from "react";
import { Link } from "react-router-dom";
import "./UserItem.css";

const UserItem = (props) => {
  return (
    <li className="user-item">
      <Link to={`/${props.id}/places`} className="user-item__link">
        <div className="user-item__painting-frame">
          <div className="user-item__painting-mat">
            <img
              src={props.image}
              alt={props.name}
              className="user-item__painting-image"
            />
          </div>
        </div>

        <div className="user-item__plaque">
          <h2>{props.name}</h2>
          <h3>
            {props.placeCount} {props.placeCount === 1 ? "Place" : "Places"}
          </h3>
        </div>
      </Link>
    </li>
  );
};

export default UserItem;
