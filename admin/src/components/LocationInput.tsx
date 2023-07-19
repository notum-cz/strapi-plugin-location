/**
 *
 * LocationInput
 *
 */

import React, { useEffect } from "react";
import {
  NumberInput,
  Grid,
  GridItem,
  Box,
  Typography,
} from "@strapi/design-system";
import _ from "lodash";

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
  const [[lat, lng], setLocation] = React.useState(parseValue(value));

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
      <Typography>Location</Typography>
      <Grid>
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
    </Box>
  );
};

export default LocationInput;
