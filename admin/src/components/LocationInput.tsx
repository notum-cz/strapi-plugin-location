/**
 *
 * LocationInput
 *
 */

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  NumberInput,
  Grid,
  GridItem,
  Box,
  Typography,
  Button,
  ModalLayout,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "@strapi/design-system";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
//@ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
//@ts-ignore
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
//@ts-ignore
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import _ from "lodash";

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

  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          //@ts-ignore
          const { lat: newLat, lng: newLng } = marker.getLatLng();
          setLocation([newLat, newLng]);
        }
      },
    }),
    []
  );

  useEffect(() => {
    onChange({
      target: {
        name,
        value: JSON.stringify({ lat, lng }),
        type: attribute.type,
      },
    });
  }, [lng, lat, onChange, attribute.type, name]);

  return (
    <Box>
      <Typography fontWeight="bold" variant="pi">
        {name}
      </Typography>
      <Grid gap={5}>
        <GridItem col={6}>
          <NumberInput
            label="Lat"
            value={lat ? lat : 0}
            onValueChange={(newValue: number) =>
              setLocation((prev) => [newValue, prev[1]])
            }
          />
        </GridItem>
        <GridItem col={6}>
          <NumberInput
            label="Lng"
            value={lng ? lng : 0}
            onValueChange={(newValue: number) =>
              setLocation((prev) => [prev[0], newValue])
            }
          />
        </GridItem>
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
                  <GridItem col={6}>
                    <NumberInput
                      label="Lat"
                      value={lat ? lat : 0}
                      onValueChange={(newValue: number) =>
                        setLocation((prev) => [newValue, prev[1]])
                      }
                    />
                  </GridItem>
                  <GridItem col={6}>
                    <NumberInput
                      label="Lng"
                      value={lng ? lng : 0}
                      onValueChange={(newValue: number) =>
                        setLocation((prev) => [prev[0], newValue])
                      }
                    />
                  </GridItem>
                </Grid>
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
