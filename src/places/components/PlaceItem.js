import React from "react";
import { Link } from "react-router-dom";
import Card from "../../shared/components/UIElements/Card";
import "./PlaceItem.css";

const PlaceItem = (props) => {
  return (
    <div className="place-item">
      <Link to={`/place/${props.id}`} className="place-item__link">
        <Card className="place-item__content">
          <div className="place-item__image">
            <img src={`${props.image}`} alt={props.title} />
          </div>
          <div className="place-item__info">
            <h2>{props.title}</h2>
          </div>
        </Card>
      </Link>
    </div>
  );
};

export default PlaceItem;
