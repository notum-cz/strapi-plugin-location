import {
  GridItem,
  NumberInput,
  IconButton,
  Grid,
  Box,
  Typography,
} from "@strapi/design-system";
import { Trash } from "@strapi/icons";
import React from "react";

const LocationInputForm = ({
  lat,
  lng,
  handleSetLocation,
  handleDeleteLocation,
  index,
}: {
  lat: number | null;
  lng: number | null;
  handleSetLocation: (newValue: [number | null, number | null]) => void;
  handleDeleteLocation?: (index: number) => void;
  index?: number;
}) => {
  const inputSize = index ? 5 : 6;

  return (
    <GridItem col={12}>
      <Grid gap={5}>
        {index && (
          <GridItem col={1} className="location-input-control">
            <Box color="white" marginBottom={3}>
              <Typography>{index}</Typography>
            </Box>
          </GridItem>
        )}
        <GridItem col={inputSize}>
          <NumberInput
            label="Lat"
            value={lat ? lat : 0}
            onValueChange={(newValue: number) =>
              handleSetLocation([newValue, lng])
            }
          />
        </GridItem>
        <GridItem col={inputSize}>
          <NumberInput
            label="Lng"
            value={lng ? lng : 0}
            onValueChange={(newValue: number) =>
              handleSetLocation([lat, newValue])
            }
          />
        </GridItem>
        {index && handleDeleteLocation && (
          <GridItem col={1} className="location-input-control">
            <IconButton
              size="L"
              onClick={() => handleDeleteLocation(index - 1)}
            >
              <Trash />
            </IconButton>
          </GridItem>
        )}
      </Grid>
    </GridItem>
  );
};

export default LocationInputForm;
