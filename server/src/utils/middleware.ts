import { Core } from "@strapi/strapi";
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


export const handlerLocationUpdatesMiddleware = (strapi: Core.Strapi) => {
  const db = strapi.db.connection;
  return async (ctx, next) => {
    await next();
    try {
      // 1. Perform this only for CREATE and UPDATE operations
      if (ctx.request.method !== "POST" && ctx.request.method !== "PUT") return;
      // 2. Perform this only for models with location fields
      const urlWithoutQuery = ctx.request.url.split("?")[0];
      const urlParts = urlWithoutQuery.split("/").filter(part => part !== "");
      const collectionTypesIndex = urlParts.indexOf("collection-types");
      const collectionType = collectionTypesIndex !== -1 && urlParts[collectionTypesIndex + 1] 
        ? urlParts[collectionTypesIndex + 1] 
        : null;
      const modelsWithLocation =
      strapi.services[locaitonServiceUid].getModelsWithLocation();
      const modelsWithLocationUidList = modelsWithLocation.map((model) => model.uid);
      if (!modelsWithLocationUidList.includes(collectionType)) return;
      // 3. Perform this only if we have a valid id
      const model = modelsWithLocation.find((model) => model.uid === collectionType);
      const locationFields = strapi.services[
        locaitonServiceUid
      ].getLocationFields(model.attributes);
      const id = ctx.response?.body?.data?.id;
      if (!id) return;
      // 4. Perform the location specific update query execution
      await Promise.all(
        locationFields.map(async (locationField) => {
          const data = ctx.response?.body?.data?.[locationField];
          if (!data || typeof data !== 'object' || !data?.['lng'] || !data?.['lat']) return;
            const r = await db.raw(`
                UPDATE ${model.collectionName}
                SET ${_.snakeCase(
                  locationField
                )}_geom = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
                WHERE id = ${id};
            `);
        })
      );
    }
    catch (error) {
      strapi.log.error(`An error occurred while handling the location updates middleware: ${error}`);
      return next();
    }
  };
};



export const createFilterMiddleware = (strapi: Core.Strapi) => {
  const db = strapi.db.connection;
  const modelsWithLocation =
    strapi.services[locaitonServiceUid].getModelsWithLocation();

  return async (ctx, next) => {
    try {
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
        : Object.values(strapi.contentTypes).find(
            //@ts-ignore
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
        const componentIdPairs = isComponentQuery
          ? await db(`${collectionModel.collectionName}_components`)
              .select("entity_id", "component_id")
              .where({
                component_type: componentModel.uid,
              })
          : null;
  
        const matchedComponents =
          isComponentQuery && componentIdPairs
            ? await db(componentModel.collectionName)
                .select("document_id")
                .whereIn(
                  "id",
                  componentIdPairs.map((pair) => pair.component_id)
                )
                .whereRaw(
                  `
          ST_DWithin(
          ${_.snakeCase(fieldToFilter)}_geom,
          ST_SetSRID(ST_MakePoint(?, ?), 4326), ?)`,
                  [lng, lat, range ?? 0]
                )
            : null;
        const documentIds =
          isComponentQuery && matchedComponents && componentIdPairs
            ? matchedComponents.map(
                (comp) =>
                  componentIdPairs.find((pair) => pair.component_id === comp.id)
                    .entity_id
              )
            : (
                await db(collectionModel.collectionName)
                  .select("document_id")
                  .whereRaw(
                    `
                ST_DWithin(
                ${_.snakeCase(fieldToFilter)}_geom,
                ST_SetSRID(ST_MakePoint(?, ?), 4326), ?)`,
                    [lng, lat, range ?? 0]
                  )
              ).map((item) => item.document_id);
          ctx.query = {
            ...ctx.query,
            filters: {
              ...ctx?.query?.filters,
              documentId: {
                $in: documentIds.length > 0 ? documentIds : [0],
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
                return `ST_DWithin(${_.snakeCase(
                  field
                )}_geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${
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
      const documentIds = (
        await db(collectionModel.collectionName)
          .select("document_id")
          .whereRaw(wholeQuery.join(" "))
      ).map((item) => item.document_id);
        ctx.query = {
          ...ctx.query,
          filters: {
            ...ctx?.query?.filters,
            documentId: {
              $in: documentIds.length > 0 ? documentIds : [0],
            },
          },
        };
  
      await next();
    }
    catch (error) {
      strapi.log.error(`An error occurred while handling location filter middleware: ${error}`);
      return next();
    }
  };
};
