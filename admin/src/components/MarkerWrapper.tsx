import React, { useMemo, useRef } from "react";
//@ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
//@ts-ignore
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

import { Marker } from "react-leaflet";
import L from "leaflet";

const MarkerWrapper = ({
  location,
  handleSetLocation,
  index,
}: {
  location: [number, number];
  handleSetLocation: (newValue: [number, number], index: number) => void;
  index: number;
}) => {
  const icon = L.divIcon({
    className: "custom-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<span>${index + 1}</span>`,
  });
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend(i) {
        const marker = markerRef.current;
        if (marker != null) {
          //@ts-ignore
          const { lat: newLat, lng: newLng } = marker.getLatLng();
          handleSetLocation([newLat, newLng], index);
        }
      },
    }),
    [markerRef, handleSetLocation, index]
  );

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      ref={markerRef}
      position={location}
      icon={icon}
    ></Marker>
  );
};

export default MarkerWrapper;
