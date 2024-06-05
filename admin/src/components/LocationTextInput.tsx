
import { Button, Grid, GridItem, TextInput } from "@strapi/design-system";
import React, { Dispatch, SetStateAction, useState } from "react";

export default function LocationTextInput({
  setLocation,
}: {
  setLocation: Dispatch<SetStateAction<number[]>>;
}) {
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const url = encodeURI(
      `https://nominatim.openstreetmap.org/search?format=json&q=${address}`
    );
    return await fetch(url)
      .then((val) => val.json())
      .then((val) => {
        if (val?.length > 0) {
          const firstOccur = val?.[0];
          const { lat: searchLatitude, lon: searchLongitude } = firstOccur;
          setLocation([searchLatitude, searchLongitude]);
          setErrorMsg("");
        } else {
          setErrorMsg("Address not found");
        }
      })
      .catch(() => {
        setErrorMsg("request error")
      })
      .finally(() => setLoading(false));
  };

  return (
    <Grid gap={5} style={{ padding: "16px 0" }}>
      <GridItem col={10}>
        <TextInput
          placeholder="insert your address"
          label="Address"
          name="address"
          style={{ width: "100%", flexGrow: 1 }}
          onChange={(e) => {
            setAddress(e?.target?.value);
          }}
          {...(errorMsg && { error: errorMsg })}
        />
      </GridItem>
      <GridItem
        col={2}
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "24px",
        }}
      >
        <Button
          variant="default"
          fullWidth
          loading={loading}
          onClick={async () => {
            await fetchData();
          }}
        >
          Send
        </Button>
      </GridItem>
    </Grid>
  );
}
