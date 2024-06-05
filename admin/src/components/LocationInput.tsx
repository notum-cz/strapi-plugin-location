/**
 *
 * LocationInput
 *
 */

import {
  Box,
  Button,
  Grid,
  GridItem,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalLayout,
  Typography,
} from "@strapi/design-system";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
//@ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
//@ts-ignore
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
//@ts-ignore
import _ from "lodash";
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

const parseValue = (value: string): [number | null, number | null] => {
  try {
    const object = JSON.parse(value);

    if (!object?.lat || !object?.lng) {
      return [null, null];
    }
    return [
      _.pick(object, ["lat", "lng"]).lat,
      _.pick(object, ["lat", "lng"]).lng,
    ];
  } catch (error) {
    return [null, null];
  }
};

//@ts-ignore
const LocationInput = ({ value, onChange, name, attribute }) => {
  const [defLat, defLng] = [49.195678016117164, 16.608182539182483];
  const [[lat, lng], setLocation] = useState(parseValue(value));
  const [isModalVisible, setIsModalVisible] = useState(false);

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
    []
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
      <Grid gap={5}>
        <LocationInputForm
          lat={lat}
          lng={lng}
          handleSetLocation={handleSetLocation}
        />
        <GridItem col={12}>
          <Button onClick={() => setIsModalVisible((prev) => !prev)}>
            Open map
          </Button>
          {isModalVisible && (
            <ModalLayout
              onClose={() => setIsModalVisible((prev) => !prev)}
              labelledBy="title"
            >
              <ModalHeader>
                <Typography
                  fontWeight="bold"
                  textColor="neutral800"
                  as="h2"
                  id="title"
                >
                  Title
                </Typography>
              </ModalHeader>
              <ModalBody>
                <Grid gap={5} className="pb-2">
                  <LocationInputForm
                    lat={lat}
                    lng={lng}
                    handleSetLocation={handleSetLocation}
                  />
                </Grid>
                <LocationTextInput setLocation={setLocation} />
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
              </ModalBody>
              <ModalFooter
                endActions={
                  <>
                    <Button onClick={() => setIsModalVisible((prev) => !prev)}>
                      Ok
                    </Button>
                  </>
                }
              />
            </ModalLayout>
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

export default LocationInput;
