export const convertArrayToGeoJSON = (array: [number, number][]) => {
  const revertedArray = array.map((item) => [item[1], item[0]]);
  return JSON.stringify({
    type: "Polygon",
    coordinates: [[...revertedArray, revertedArray[0]]],
  });
};

export const convertGeoJSONToArray = (geoJSON: string) => {
  const parsed = JSON.parse(geoJSON);
  console.log(geoJSON, parsed.coordinates[0].slice(0, -1));
  return parsed.coordinates[0].slice(0, -1).map((item) => [item[1], item[0]]);
};
