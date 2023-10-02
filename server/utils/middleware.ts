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

    const collectionType = url
      .replace(strapi.config.api.rest.prefix, "")
      .split("/")[1]
      .split("?")[0];

    const queryString = ctx.request.querystring as string;
    const locationQuery = ctx.query.$location as LocationQueryCombined;
    const locationKeys = locationQuery && Object.keys(locationQuery);
    const isComponentQuery = locationKeys && locationKeys[0].includes(".");
    const modelCondition = (model) =>
      model.collectionName === _.snakeCase(collectionType);
    const collectionModel = !isComponentQuery
      ? modelsWithLocation.find((model) => modelCondition(model))
      : // @ts-expect-error
        strapi.db.config.models.find(
          (model) => model.collectionName === _.snakeCase(collectionType)
        );

    if (
      (!collectionModel && !isComponentQuery) ||
      !queryString ||
      !queryString.includes("$location")
    ) {
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
    const componentAttrField =
      isComponentQuery &&
      collectionModel.attributes[locationKeys[0].split(".")[0]];
    const componentModel =
      componentAttrField &&
      modelsWithLocation.find(
        (modelWithLocation) =>
          modelWithLocation.uid === componentAttrField.component
      );
    ctx.query = _.omit(ctx.query, ["$location"]);
    const componentsToFilter = locationKeys.map((key) => key.split(".")[1]);
    if (locationKeys.length > 1) {
      // TODO: $and or $or logic warning here this is not valid query
      return next();
    }
    const fieldToFilter = isComponentQuery
      ? componentsToFilter[0]
      : locationKeys[0];
    if (fieldToFilter !== "$or" && fieldToFilter !== "$and") {
      const filterModel = isComponentQuery ? componentModel : collectionModel;
      const mutatedLocationQuery = isComponentQuery
        ? Object.entries(locationQuery).reduce((result, [, value], i) => {
            result[componentsToFilter[i]] = value;
            return result;
          }, {})
        : locationQuery;
      const locationQueryParams = getLocationQueryParams(
        filterModel,
        fieldToFilter,
        mutatedLocationQuery
      );
      if (!locationQueryParams) {
        // TODO: add warning that location query is not valid
        return next();
      }
      const [lat, lng, range] = locationQueryParams;
      const componentIdPairs = await db(
        `${collectionModel.tableName}_components`
      )
        .select("entity_id", "component_id")
        .where({
          component_type: componentModel.uid,
        });
      const matchedComponents = await db(componentModel.tableName)
        .select("id")
        .whereIn(
          "id",
          componentIdPairs.map((pair) => pair.component_id)
        )
        .whereRaw(
          `
        ST_DWithin(
        ${fieldToFilter}_geom,
        ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`,
          [lng, lat, range ?? 0]
        );
      const ids = isComponentQuery
        ? matchedComponents.map(
            (comp) =>
              componentIdPairs.find((pair) => pair.component_id === comp.id)
                .entity_id
          )
        : (
            await db(collectionModel.tableName)
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
              collectionModel,
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
      await db(collectionModel.tableName)
        .select("id")
        .whereRaw(wholeQuery.join(" "))
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
