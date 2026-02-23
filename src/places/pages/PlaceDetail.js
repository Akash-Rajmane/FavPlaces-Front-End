import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PlaceItem from "../components/PlaceItem";
import useHttpClient from "../../shared/hooks/http-hook";

const PlaceDetail = () => {
  const { placeId } = useParams();
  const { isLoading, sendRequest } = useHttpClient();
  const [loadedPlace, setLoadedPlace] = useState();

  useEffect(() => {
    const fetchPlace = async () => {
      try {
        const responseData = await sendRequest(
          `${process.env.REACT_APP_BACKEND_URL}/places/${placeId}`,
        );
        setLoadedPlace(responseData.place);
      } catch (err) {}
    };

    fetchPlace();
  }, [sendRequest, placeId]);

  if (isLoading) return <p>Loading...</p>;
  if (!loadedPlace) return <p>Could not find place!</p>;

  return (
    <PlaceItem
      id={loadedPlace.id}
      image={loadedPlace.image}
      title={loadedPlace.title}
      address={loadedPlace.address}
      description={loadedPlace.description}
      coordinates={{
        lng: loadedPlace.location_geo.coordinates[0],
        lat: loadedPlace.location_geo.coordinates[1],
      }}
      creatorId={loadedPlace.creator}
    />
  );
};

export default PlaceDetail;
