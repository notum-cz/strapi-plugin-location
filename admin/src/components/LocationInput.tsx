/**
 *
 * LocationInput
 *
 */

import { Box, Button, Grid, Modal, Typography } from '@strapi/design-system';
import L from 'leaflet';
// @ts-ignore
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/leaflet.css';
import _ from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import type { Marker as MarkerType } from 'leaflet';
import LocationInputForm from './LocationInputForm';
import LocationTextInput from './LocationTextInput';

const icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12.5, 41],
});

type LocationInputValue = { lat: number | null; lng: number | null };

const LocationInput = ({
  value,
  onChange,
  name,
  attribute,
}: {
  value?: LocationInputValue;
  onChange: (params: {
    target: {
      name: string;
      value?: LocationInputValue;
      type: string;
    };
  }) => void;
  name: string;
  attribute: { type: string; customField: string };
}) => {
  const [defLat, defLng] = [49.195678016117164, 16.608182539182483];
  const [[lat, lng], setLocation] = useState(value ? [value.lat, value.lng] : [0, 0]);

  function FlyMapTo() {
    const map = useMap();

    useEffect(() => {
      map.setView([lat ? lat : defLat, lng ? lng : defLng], 15);
    }, [lat, lng]);

    return null;
  }

  const markerRef = useRef<MarkerType>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
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
        value: { lat: newValue[0], lng: newValue[1] },
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
        <LocationInputForm lat={lat} lng={lng} handleSetLocation={handleSetLocation} />
        <Grid.Item col={12}>
          <Modal.Root>
            <Modal.Trigger>
              <Button>Open map</Button>
            </Modal.Trigger>
            <Modal.Content>
              <Modal.Header>
                <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
                  Title
                </Typography>
              </Modal.Header>
              <Modal.Body>
                <Grid.Item gap={5} className="pb-2">
                  <LocationInputForm lat={lat} lng={lng} handleSetLocation={handleSetLocation} />
                </Grid.Item>
                <LocationTextInput handleSetLocation={handleSetLocation} />
                <Box paddingTop={6}>
                  <MapContainer
                    center={[lat ? lat : defLat, lng ? lng : defLng]}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: '300px' }}
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
                    />
                    <FlyMapTo />
                  </MapContainer>
                </Box>
              </Modal.Body>
              <Modal.Footer>
                <div> </div>
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
