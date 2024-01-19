export const getLocationFromString = (location: string) => {
  const [latStr, lngStr, rangeStr] = location.split(",");
  return [
    parseFloat(latStr),
    parseFloat(lngStr),
    rangeStr ? parseFloat(rangeStr) : 0,
  ];
};

export const getLocationQueryParams = (
  model,
  fieldToFilter,
  locationQuery
): [number | null, number | null, number, string] | null => {
  if (
    ![
      "plugin::location-plugin.location",
      "plugin::location-plugin.location-shape",
    ].includes(model?.attributes?.[fieldToFilter]?.customField)
  ) {
    return null;
  }
  let range = 0,
    lat: number | null = null,
    lng: number | null = null;
  if (typeof locationQuery[fieldToFilter] === "string") {
    [lat, lng, range] = getLocationFromString(locationQuery[fieldToFilter]);
  } else {
    if (locationQuery[fieldToFilter]?.range) {
      range = parseInt(locationQuery[fieldToFilter].range);
    }
    if (locationQuery[fieldToFilter]?.lat) {
      lat = parseFloat(locationQuery[fieldToFilter].lat);
    }
    if (locationQuery[fieldToFilter]?.lng) {
      lng = parseFloat(locationQuery[fieldToFilter].lng);
    }
  }

  return [lat, lng, range, model?.attributes?.[fieldToFilter]?.customField];
};
