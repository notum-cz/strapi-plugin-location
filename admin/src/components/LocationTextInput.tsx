import { Button, Box, Grid, TextInput } from "@strapi/design-system";
import { useState } from "react";

export default function LocationTextInput({
  handleSetLocation,
}: {
  handleSetLocation: (newValue: [number | null, number | null]) => void;
}) {
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const url = encodeURI(
      `https://nominatim.openstreetmap.org/search?format=json&q=${address}`,
    );
    return await fetch(url)
      .then((val) => val.json())
      .then((val) => {
        if (val?.length > 0) {
          const firstOccur = val?.[0];
          const { lat: searchLatitude, lon: searchLongitude } = firstOccur;
          handleSetLocation([searchLatitude, searchLongitude]);
          setErrorMsg("");
        } else {
          setErrorMsg("Address not found");
        }
      })
      .catch(() => {
        setErrorMsg("request error");
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Grid.Root gridCols={12} marginTop={4}>
        <Grid.Item col={10}>
          <Box style={{ width: "100%" }} marginRight={2}>
            <TextInput
              placeholder="Type your address"
              name="address"
              onChange={(e: any) => {
                setAddress(e?.target?.value);
              }}
              {...(errorMsg && { error: errorMsg })}
            />
          </Box>
        </Grid.Item>
        <Grid.Item col={2}>
          <Button
            fullWidth
            variant="default"
            loading={loading}
            onClick={async () => {
              await fetchData();
            }}
          >
            Send
          </Button>
        </Grid.Item>
      </Grid.Root>
    </>
  );
}
