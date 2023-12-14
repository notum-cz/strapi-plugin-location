export const convertArrayToGeoJSON = (array: [number, number][]) => {
  return JSON.stringify({
    type: "Polygon",
    coordinates: [[...array, array[0]]],
  });
};

export const convertGeoJSONToArray = (geoJSON: string) => {
  const parsed = JSON.parse(geoJSON);
  return parsed.coordinates[0].slice(0, -1);
};
