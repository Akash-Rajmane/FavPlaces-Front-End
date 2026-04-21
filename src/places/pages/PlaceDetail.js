import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useHttpClient from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import Map from "../../shared/components/UIElements/Map";
import Button from "../../shared/components/FormElements/Button";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import Modal from "../../shared/components/UIElements/Modal";
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
          <img src={loadedPlace.image} alt={loadedPlace.title} />
        </div>
        
        <div className="place-detail__content">
          <h1 className="place-detail__title">{loadedPlace.title}</h1>
          <h3 className="place-detail__address">{loadedPlace.address}</h3>
          <p className="place-detail__description">{loadedPlace.description}</p>

          <div className="place-detail__actions">
            <Button onClick={() => setShowMap(!showMap)}>
              {showMap ? "HIDE MAP" : "VIEW ON MAP"}
            </Button>
            
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
        </div>
      </div>
    </React.Fragment>
  );
};

export default PlaceDetail;
