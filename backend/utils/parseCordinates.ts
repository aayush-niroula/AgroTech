export const parseCoordinates = (coordsString: string): [number, number] | null => {
  const parts = coordsString.split(",").map(Number);
  if (
    parts.length === 2 &&
    !isNaN(parts[0]) &&
    !isNaN(parts[1]) &&
    parts[0] >= -180 && parts[0] <= 180 &&
    parts[1] >= -90 && parts[1] <= 90
  ) {
    return [parts[0], parts[1]];
  }
  return null;
};
