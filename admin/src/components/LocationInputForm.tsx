import { Grid, NumberInput } from '@strapi/design-system';
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
      <Grid.Item col={6}>
        <NumberInput
          label="Lat"
          value={lat ? lat : 0}
          onValueChange={(newValue: number) => handleSetLocation([newValue, lng])}
        />
      </Grid.Item>
      <Grid.Item col={6}>
        <NumberInput
          label="Lng"
          value={lng ? lng : 0}
          onValueChange={(newValue: number) => handleSetLocation([lat, newValue])}
        />
      </Grid.Item>
    </>
  );
};

export default LocationInputForm;
