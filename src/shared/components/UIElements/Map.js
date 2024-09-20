import React, { useRef, useEffect } from "react";
import "./Map.css";
import useLoadScript from "../../hooks/loadscript-hook";
import LoadingSpinner from "./LoadingSpinner";

const Map = (props) => {
  const mapRef = useRef(null);
  const { center, zoom } = props;

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GMAP_API_KEY;
  const scriptLoaded = useLoadScript(
    `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`
  );

  useEffect(() => {
    if (scriptLoaded && window.google) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
      });

      new window.google.maps.Marker({ position: center, map: map });
    }
  }, [scriptLoaded, center, zoom]);

  return (
    <div ref={mapRef} className={`map ${props.className}`} style={props.style}>
      {!scriptLoaded && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default Map;
