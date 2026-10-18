import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useHttpClient from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import Map from "../../shared/components/UIElements/Map";
import Button from "../../shared/components/FormElements/Button";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import Modal from "../../shared/components/UIElements/Modal";
import AIPlaceAssistant from "../../shared/components/UIElements/AIPlaceAssistant";
import "./PlaceDetail.css";

const PlaceDetail = () => {
  const auth = useContext(AuthContext);
  const { placeId } = useParams();
  const navigate = useNavigate();
  const { isLoading, sendRequest } = useHttpClient();
  const [loadedPlace, setLoadedPlace] = useState();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/places/${placeId}`
        );
        setLoadedPlace(responseData.place);
      } catch (err) {}
    };

    fetchPlace();
  }, [sendRequest, placeId]);

  const showDeleteWarningHandler = () => {
    setShowConfirmModal(true);
  };

  const cancelDeleteHandler = () => {
    setShowConfirmModal(false);
  };

  const confirmDeleteHandler = async () => {
    setShowConfirmModal(false);
    try {
      await sendRequest(
        `${process.env.REACT_APP_BACKEND_URL}/places/${placeId}`,
        "DELETE",
        null,
        {
          Authorization: "Bearer " + auth.token,
        }
      );
      navigate("/");
    } catch (err) {}
  };

  const sharePlaceOnWhatsApp = () => {
    if (!loadedPlace) return;

    const pageUrl = window.location.href;
    const mapQuery = encodeURIComponent(loadedPlace.address || loadedPlace.title);
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    const text = `📍 *Check out ${loadedPlace.title} on FavPlaces!*\n\n` +
      `🏠 *Address:* ${loadedPlace.address}\n\n` +
      `📝 *About:* ${loadedPlace.description}\n\n` +
      `🗺️ *View on Google Maps:* ${mapLink}\n` +
      `🌟 *View on FavPlaces:* ${pageUrl}`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="center" style={{ marginTop: "5rem" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!loadedPlace && !isLoading) {
    return (
      <div className="center" style={{ marginTop: "5rem" }}>
        <h2>Could not find place!</h2>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Modal
        show={showConfirmModal}
        onCancel={cancelDeleteHandler}
        header="Are you sure?"
        footerClass="place-detail__modal-actions"
        footer={
          <React.Fragment>
            <Button inverse onClick={cancelDeleteHandler}>
              CANCEL
            </Button>
            <Button danger onClick={confirmDeleteHandler}>
              DELETE
            </Button>
          </React.Fragment>
        }
      >
        <p style={{ padding: '1.5rem', margin: 0, color: 'var(--color-text-muted)' }}>
          Do you want to proceed and delete this place? Please note that it
          can't be undone thereafter.
        </p>
      </Modal>

      <div className="place-detail-page">
        <div className="place-detail__hero">
          <div className="place-detail__painting-frame">
            <div className="place-detail__painting-mat">
              <img src={loadedPlace.image} alt={loadedPlace.title} className="place-detail__painting-image" />
            </div>
          </div>
        </div>
        
        <div className="place-detail__content">
          <h1 className="place-detail__title">{loadedPlace.title}</h1>
          <h3 className="place-detail__address">{loadedPlace.address}</h3>
          <p className="place-detail__description">{loadedPlace.description}</p>

          <div className="place-detail__actions">
            <Button onClick={() => setShowMap(!showMap)}>
              {showMap ? "HIDE MAP" : "VIEW ON MAP"}
            </Button>

            <button
              type="button"
              className="place-detail__whatsapp-btn"
              onClick={sharePlaceOnWhatsApp}
              title="Share this place on WhatsApp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.53 1.771.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.385 8.213c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.122-.513-1.825-.757-3.003-2.616-3.094-2.738-.091-.121-.741-.986-.741-1.88 0-.895.469-1.336.636-1.516.167-.181.365-.226.487-.226.122 0 .243.002.349.006.111.005.26-.042.406.31.144.348.498 1.214.542 1.304.044.09.073.196.015.312-.058.115-.087.187-.174.289-.087.102-.184.228-.263.306-.089.088-.182.184-.078.362.104.179.463.764.994 1.237.685.61 1.263.799 1.442.888.179.089.284.076.39-.046.106-.122.456-.531.577-.713.121-.182.243-.152.406-.091.163.061 1.034.488 1.212.577.178.089.297.133.341.209.045.076.045.438-.099.843zm-3.385-12.385c-5.514 0-10 4.486-10 10 0 1.758.459 3.473 1.333 4.985l-1.417 5.176 5.297-1.389c1.464.798 3.117 1.228 4.787 1.228 5.514 0 10-4.486 10-10s-4.486-10-10-10zm0 18.281c-1.492 0-2.955-.394-4.231-1.141l-.304-.179-3.14.823.838-3.06-.197-.313c-.822-1.309-1.258-2.833-1.258-4.411 0-4.566 3.714-8.281 8.281-8.281 4.566 0 8.281 3.715 8.281 8.281 0 4.566-3.715 8.281-8.281 8.281z" />
              </svg>
              Share on WhatsApp
            </button>
            
            {auth.userId === loadedPlace.creator && (
              <React.Fragment>
                <Button to={`/places/${loadedPlace.id}`}>EDIT PLACE</Button>
                <Button danger onClick={showDeleteWarningHandler}>
                  DELETE PLACE
                </Button>
              </React.Fragment>
            )}
          </div>

          {showMap && (
            <div className="place-detail__map-container">
              <Map 
                center={{
                  lat: loadedPlace.location_geo.coordinates[1],
                  lng: loadedPlace.location_geo.coordinates[0],
                }} 
                zoom={16} 
              />
            </div>
          )}

          <AIPlaceAssistant
            place={loadedPlace}
            token={auth.token}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default PlaceDetail;
