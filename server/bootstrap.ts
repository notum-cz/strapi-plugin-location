import { Strapi } from "@strapi/strapi";
import createSubscriber from "./utils/lifecycles";
import _ from "lodash";
import createFilterMiddleware from "./utils/middleware";

const locaitonServiceUid = "plugin::location-plugin.locationServices";
export default async ({ strapi }: { strapi: Strapi }) => {
  if (!strapi["location-plugin"].enabled) {
    // TODO: add information that plugin is disabled
    return;
  }
  const db = strapi.db.connection;

  const modelsWithLocation =
    strapi.services[locaitonServiceUid].getModelsWithLocation();

  await Promise.all(
    modelsWithLocation.map(async (model) => {
      const tableName = model.tableName;

      const locationFields = strapi.services[
        locaitonServiceUid
      ].getLocationFields(model.attributes);

      await Promise.all(
        locationFields.map(async (locationField) => {
          const locationFieldSnakeCase = _.snakeCase(locationField.field);
          const hasColumn = await db.schema.hasColumn(
            `${tableName}`,
            `${locationFieldSnakeCase}_geom`
          );
          if (locationField.type === "location") {
            if (!hasColumn) {
              await db.raw(`
              ALTER TABLE ${tableName}
              ADD COLUMN ${locationFieldSnakeCase}_geom GEOMETRY(Point, 4326);
            `);
            }
            // Generate point column field using only a query
            await db.raw(`
          UPDATE ${tableName}
          SET ${locationFieldSnakeCase}_geom = ST_SetSRID(ST_MakePoint(
              CAST((${locationFieldSnakeCase}::json->'lng')::text AS DOUBLE PRECISION),
              CAST((${locationFieldSnakeCase}::json->'lat')::text AS DOUBLE PRECISION)

          ), 4326)
          WHERE (${locationFieldSnakeCase}::json->'lng')::text != 'null' AND
                (${locationFieldSnakeCase}::json->'lat')::text != 'null' AND
                ${locationFieldSnakeCase}_geom IS NULL;
          `);
          }
          if (locationField.type === "shape") {
            if (!hasColumn) {
              await db.raw(`
              ALTER TABLE ${tableName}
              ADD COLUMN ${locationFieldSnakeCase}_geom GEOMETRY(Polygon, 4326);
            `);
            }
            // Generate point column field using only a query
            await db.raw(`
          UPDATE ${tableName}
          SET ${locationFieldSnakeCase}_geom = ST_SetSRID(
            ST_GeomFromGeoJSON(${locationFieldSnakeCase}),
            4326
        )
        WHERE ${locationFieldSnakeCase} IS NOT NULL AND ${locationFieldSnakeCase}::text != 'null'


          `);
          }
        })
      );
    })
  );

  const subscriber = createSubscriber(strapi);
  //@ts-ignore
  strapi.db.lifecycles.subscribe(subscriber);

  const middleware = createFilterMiddleware(strapi);
  strapi.server.use(middleware);
};
