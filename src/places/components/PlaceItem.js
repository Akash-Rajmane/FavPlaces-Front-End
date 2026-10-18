import React from "react";
import { Link } from "react-router-dom";
import Card from "../../shared/components/UIElements/Card";
import "./PlaceItem.css";

const PlaceItem = (props) => {
  const handleWhatsAppShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const placeUrl = `${window.location.origin}/place/${props.id}`;
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.address || props.title)}`;
    const text = `📍 *Check out ${props.title} on FavPlaces!*\n${props.address ? `🏠 ${props.address}\n` : ""}\n🗺️ *Google Maps:* ${mapLink}\n🌟 *View on FavPlaces:* ${placeUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="place-item">
      <Link to={`/place/${props.id}`} className="place-item__link">
        <Card className="place-item__content">
          <div className="place-item__image">
            <img src={`${props.image}`} alt={props.title} />
          </div>
          <div className="place-item__info">
            <h2>{props.title}</h2>
            <button
              type="button"
              className="place-item__whatsapp-btn"
              title="Share on WhatsApp"
              onClick={handleWhatsAppShare}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.53 1.771.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.385 8.213c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.122-.513-1.825-.757-3.003-2.616-3.094-2.738-.091-.121-.741-.986-.741-1.88 0-.895.469-1.336.636-1.516.167-.181.365-.226.487-.226.122 0 .243.002.349.006.111.005.26-.042.406.31.144.348.498 1.214.542 1.304.044.09.073.196.015.312-.058.115-.087.187-.174.289-.087.102-.184.228-.263.306-.089.088-.182.184-.078.362.104.179.463.764.994 1.237.685.61 1.263.799 1.442.888.179.089.284.076.39-.046.106-.122.456-.531.577-.713.121-.182.243-.152.406-.091.163.061 1.034.488 1.212.577.178.089.297.133.341.209.045.076.045.438-.099.843zm-3.385-12.385c-5.514 0-10 4.486-10 10 0 1.758.459 3.473 1.333 4.985l-1.417 5.176 5.297-1.389c1.464.798 3.117 1.228 4.787 1.228 5.514 0 10-4.486 10-10s-4.486-10-10-10zm0 18.281c-1.492 0-2.955-.394-4.231-1.141l-.304-.179-3.14.823.838-3.06-.197-.313c-.822-1.309-1.258-2.833-1.258-4.411 0-4.566 3.714-8.281 8.281-8.281 4.566 0 8.281 3.715 8.281 8.281 0 4.566-3.715 8.281-8.281 8.281z" />
              </svg>
            </button>
          </div>
        </Card>
      </Link>
    </div>
  );
};

export default PlaceItem;
