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
import "leaflet/dist/leaflet.css";
import React, { useState } from "react";
//@ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
//@ts-ignore
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
//@ts-ignore
import _ from "lodash";
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import LocationInputForm from "./LocationInputForm";
import MarkerWrapper from "./MarkerWrapper";
import "../styles/styles.css";
import { convertArrayToGeoJSON, convertGeoJSONToArray } from "../utils/helpers";

const LocationShapeInput = ({ value, onChange, name, attribute }) => {
  const [defLat, defLng] = [49.195678016117164, 16.608182539182483];
  const [shape, setShape] = useState<[number, number][]>(
    value && value !== "null"
      ? convertGeoJSONToArray(value)
      : [[defLat, defLng]]
  );
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSetLocation = (
    newValue: [number | null, number | null],
    i: number
  ) => {
    if (newValue[0] === null || newValue[1] === null) return;
    const updatedShape = [...shape];
    updatedShape[i] = newValue as [number, number];
    setShape(updatedShape);
    onChange({
      target: {
        name,
        value: convertArrayToGeoJSON(updatedShape),
        type: attribute.type,
      },
    });
  };

  const handleDeleteLocation = (i: number) => {
    const updatedShape = [...shape];
    updatedShape.splice(i, 1);
    setShape(updatedShape);
    onChange({
      target: {
        name,
        value: convertArrayToGeoJSON(updatedShape),
        type: attribute.type,
      },
    });
  };

  const handleAddMarker = () => {
    setShape([
      ...shape,
      [shape[0] ? shape[0][0] : defLat, shape[0] ? shape[0][1] : defLng],
    ]);
  };

  return (
    <Box>
      <Typography fontWeight="bold" variant="pi">
        {name} karel
      </Typography>
      <Grid gap={5}>
        {/* <LocationInputForm
          lat={lat}
          lng={lng}
          handleSetLocation={handleSetLocation}
        /> */}
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
                  {shape.map((point, index) => (
                    <LocationInputForm
                      lat={point[0]}
                      lng={point[1]}
                      handleSetLocation={(newValue) =>
                        handleSetLocation(newValue, index)
                      }
                      index={index + 1}
                      handleDeleteLocation={handleDeleteLocation}
                    />
                  ))}
                  <GridItem col={12}>
                    <Button onClick={handleAddMarker}>Add new point</Button>
                  </GridItem>
                </Grid>

                <Box paddingTop={6}>
                  <MapContainer
                    center={
                      shape.length
                        ? [shape[0][0], shape[0][1]]
                        : [defLat, defLng]
                    }
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: "300px" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {shape.map((point, index) => {
                      return (
                        <MarkerWrapper
                          key={index}
                          index={index}
                          location={point}
                          handleSetLocation={handleSetLocation}
                        />
                      );
                    })}
                    <Polygon
                      positions={shape}
                      pathOptions={{ color: "purple" }}
                    />
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

export default LocationShapeInput;
