import { Button, Grid, TextInput } from '@strapi/design-system';
import { Dispatch, SetStateAction, useState } from 'react';
type NominatimResponse = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: Array<string>;
};
const parseResponseNumbers = (firstOccurrence: NominatimResponse) => {
  const lat = !Number.isNaN(Number(firstOccurrence.lat)) ? Number(firstOccurrence.lat) : null;
  const lon = !Number.isNaN(Number(firstOccurrence.lon)) ? Number(firstOccurrence.lon) : null;
  return { lat, lon };
};

export default function LocationTextInput({
  handleSetLocation,
}: {
  handleSetLocation: (newValue: [number | null, number | null]) => void;
}) {
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const url = encodeURI(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
    return await fetch(url)
      .then((val) => val.json())
      .then((val) => {
        if (val?.length > 0) {
          const firstOccur = val?.[0];
          const { lat: searchLatitude, lon: searchLongitude } = parseResponseNumbers(firstOccur);
          handleSetLocation([searchLatitude, searchLongitude]);
          setErrorMsg('');
        } else {
          setErrorMsg('Address not found');
        }
      })
      .catch(() => {
        setErrorMsg('request error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Grid.Root gap={5} style={{ padding: '16px 0' }}>
      <Grid.Item col={10}>
        <TextInput
          placeholder="insert your address"
          label="Address"
          name="address"
          style={{ width: '100%', flexGrow: 1 }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAddress(e?.target?.value);
          }}
          {...(errorMsg && { error: errorMsg })}
        />
      </Grid.Item>
      <Grid.Item
        col={2}
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '24px',
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
      </Grid.Item>
    </Grid.Root>
  );
}
