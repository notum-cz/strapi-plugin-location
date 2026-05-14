/// <reference path="../../custom.d.ts" />
/**
 *
 * LocationInput
 *
 */

import { Box, Button, Grid, Modal, Typography } from "@strapi/design-system";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import LocationInputForm from "./LocationInputForm";
import LocationTextInput from "./LocationTextInput";

//@ts-ignore
const icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
});

const parseValue = (value: {
  lat: number | null;
  lng: number | null;
}): [number | null, number | null] => {
  if (value?.lat == null || value?.lng == null) {
    return [null, null];
  }
  return [value.lat, value.lng];
};

//@ts-ignore
const LocationInput = ({ value, onChange, name, attribute }) => {
  const [defLat, defLng] = [49.195678016117164, 16.608182539182483];
  const [[lat, lng], setLocation] = useState(parseValue(value));

  function FlyMapTo() {
    const map = useMap();

    useEffect(() => {
      map.setView([lat ? lat : defLat, lng ? lng : defLng], 15);
    }, [lat, lng]);

    return null;
  }

  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          //@ts-ignore
          const { lat: newLat, lng: newLng } = marker.getLatLng();
          handleSetLocation([newLat, newLng]);
        }
      },
    }),
    [],
  );

  const handleSetLocation = (newValue: [number | null, number | null]) => {
    setLocation(newValue);
    onChange({
      target: {
        name,
        value: JSON.stringify({ lat: newValue[0], lng: newValue[1] }),
        type: attribute.type,
      },
    });
  };

  return (
    <Box>
      <Typography fontWeight="bold" variant="pi">
        {name}
      </Typography>
      <Grid.Root gap={5}>
        <LocationInputForm
          lat={lat}
          lng={lng}
          handleSetLocation={handleSetLocation}
          displayingInModal={false}
        />
        <Grid.Item col={12}>
          <Modal.Root>
            <Modal.Trigger>
              <Button>Open Map View</Button>
            </Modal.Trigger>
            <Modal.Content>
              <Modal.Header>
                <Modal.Title>Map View</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <LocationInputForm
                  lat={lat}
                  lng={lng}
                  handleSetLocation={handleSetLocation}
                  displayingInModal={true}
                />
                <LocationTextInput handleSetLocation={handleSetLocation} />
                <Box paddingTop={6}>
                  <MapContainer
                    center={[lat ? lat : defLat, lng ? lng : defLng]}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: "300px" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      draggable
                      eventHandlers={eventHandlers}
                      ref={markerRef}
                      position={[lat ? lat : defLat, lng ? lng : defLng]}
                      icon={icon}
                    ></Marker>
                    <FlyMapTo />
                  </MapContainer>
                </Box>
              </Modal.Body>

              <Modal.Footer>
                <Modal.Close>
                  <Button>OK</Button>
                </Modal.Close>
              </Modal.Footer>
            </Modal.Content>
          </Modal.Root>
        </Grid.Item>
      </Grid.Root>
    </Box>
  );
};

export default LocationInput;
