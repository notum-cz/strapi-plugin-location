import { Strapi } from "@strapi/strapi";
import _ from "lodash";
import { getLocationQueryParams } from "./locationHelpers";

type Location = { lat?: string; lng?: string; range?: string } | string;
type LocationQuery = {
  [key: string]: Location;
};
type LogicalQuery =
  | { $or: LocationQuery[]; $and?: never }
  | { $and: LocationQuery[]; $or?: never };
type LocationQueryCombined = LocationQuery | LogicalQuery;

const locaitonServiceUid = "plugin::location-plugin.locationServices";
const createFilterMiddleware = (strapi: Strapi) => {
  const db = strapi.db.connection;
  const modelsWithLocation =
    strapi.services[locaitonServiceUid].getModelsWithLocation();

  return async (ctx, next) => {
    if (ctx.request.method !== "GET") return next();
    const url = ctx.request.url;
    const collectionType = url.replace("/api/", "").split("/")[0].split("?")[0];

    const model = modelsWithLocation.find(
      (model) => model.collectionName === _.snakeCase(collectionType)
    );

    const queryString = ctx.request.querystring as string;
    if (!model || !queryString || !queryString.includes("$location")) {
      return next();
    }

    if (!ctx.query.$location) {
      return next();
    }
    if (typeof ctx.query.$location === "string") {
      // TODO: logic warning here this is not valid query
      return next();
    }

    // TODO: change this so that it can handle multiple location fields
    const locationQuery = ctx.query.$location as LocationQueryCombined;
    ctx.query = _.omit(ctx.query, ["$location"]);
    const fieldsToFilter = Object.keys(locationQuery);
    if (fieldsToFilter.length > 1) {
      // TODO: $and or $or logic warning here this is not valid query
      return next();
    }
    const fieldToFilter = fieldsToFilter[0];
    if (fieldToFilter !== "$or" && fieldToFilter !== "$and") {
      const locationQueryParams = getLocationQueryParams(
        model,
        fieldToFilter,
        locationQuery
      );
      if (!locationQueryParams) {
        // TODO: add warning that location query is not valid
        return next();
      }
      const [lat, lng, range] = locationQueryParams;
      const ids = (
        await db(model.tableName)
          .select("id")
          .whereRaw(
            `
              ST_DWithin(
              ${fieldToFilter}_geom,
              ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
            [lng, lat, range ?? 0]
          )
      ).map((item) => item.id);

      ctx.query = {
        ...ctx.query,
        filters: {
          ...ctx?.query?.filters,
          id: {
            $in: ids.length ? ids : [0],
          },
        },
      };
      return next();
    }

    if (!Array.isArray(locationQuery[fieldToFilter])) {
      // TODO: add warning that $and and $or must be an array
      return next();
    }

    const query = locationQuery[fieldToFilter] as LogicalQuery["$or" | "$and"];

    const logicalOperators = { $or: "OR", $and: "AND" };
    const dbQuery = query
      ?.map((item) => {
        const logicalFieldsToFilter = Object.keys(item);

        const filters = logicalFieldsToFilter
          .map((field) => {
            const locationQueryParams = getLocationQueryParams(
              model,
              field,
              item
            );
            if (!!locationQueryParams) {
              const [lat, lng, range] = locationQueryParams;
              return `ST_DWithin(${field}_geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${
                range ?? 0
              })`;
            } else {
              return false;
            }
          })
          .filter(Boolean);
        return filters;
      })
      .flat();

    if (!dbQuery || dbQuery?.length === 0) {
      // TODO: add warning that location query is not valid
      return next();
    }

    const wholeQuery = dbQuery.map((item, index) =>
      index === 0 ? `(${item})` : `${logicalOperators[fieldToFilter]} ${item}`
    );
    const ids = (
      await db(model.tableName).select("id").whereRaw(wholeQuery.join(" "))
    ).map((item) => item.id);

    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx?.query?.filters,
        id: {
          $in: ids.length ? ids : [0],
        },
      },
    };

    await next();
  };
};

export default createFilterMiddleware;
