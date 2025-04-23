export type Location = { lat?: string; lng?: string; range?: string } | string;
export type LocationQuery = {
  [key: string]: Location;
};
export type LogicalQuery =
  | { $or: LocationQuery[]; $and?: never }
  | { $and: LocationQuery[]; $or?: never };
export type LocationQueryCombined = LocationQuery | LogicalQuery;
