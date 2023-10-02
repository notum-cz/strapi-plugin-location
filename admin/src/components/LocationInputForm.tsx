import { GridItem, NumberInput } from "@strapi/design-system";
import React from "react";
const LocationInputForm = ({
  lat,
  lng,
  handleSetLocation,
}: {
  lat: number | null;
  lng: number | null;
  handleSetLocation: (newValue: [number | null, number | null]) => void;
}) => {
  return (
    <>
      <GridItem col={6}>
        <NumberInput
          label="Lat"
          value={lat ? lat : 0}
          onValueChange={(newValue: number) =>
            handleSetLocation([newValue, lng])
          }
        />
      </GridItem>
      <GridItem col={6}>
        <NumberInput
          label="Lng"
          value={lng ? lng : 0}
          onValueChange={(newValue: number) =>
            handleSetLocation([lat, newValue])
          }
        />
      </GridItem>
    </>
  );
};

export default LocationInputForm;
