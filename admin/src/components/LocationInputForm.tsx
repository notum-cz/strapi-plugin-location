import { Grid, Box, NumberInput, Typography } from "@strapi/design-system";

const LocationInputForm = ({
  lat,
  lng,
  handleSetLocation,
  displayingInModal,
}: {
  lat: number | null;
  lng: number | null;
  handleSetLocation: (newValue: [number | null, number | null]) => void;
  displayingInModal: boolean;
}) => {
  return (
    <Grid.Root gridCols={12} gap={5}>
      <Grid.Item col={displayingInModal ? 1 : 4}>
        <Typography variant="pi">Latitude</Typography>
      </Grid.Item>
      <Grid.Item col={displayingInModal ? 3 : 8}>
        <Box style={{ width: "100%" }}>
          <NumberInput
            placeholder="Lat"
            value={lat ?? 0}
            onValueChange={(newValue: number | undefined) =>
              handleSetLocation([newValue ?? null, lng])
            }
          />
        </Box>
      </Grid.Item>
      <Grid.Item col={displayingInModal ? 1 : 4}>
        <Typography variant="pi">Longitude</Typography>
      </Grid.Item>
      <Grid.Item col={displayingInModal ? 3 : 8}>
        <NumberInput
          placeholder="Lng"
          value={lng ?? 0}
          onValueChange={(newValue: number | undefined) =>
            handleSetLocation([lat, newValue ?? null])
          }
        />
      </Grid.Item>
    </Grid.Root>
  );
};

export default LocationInputForm;
