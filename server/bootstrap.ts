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
          const locationFieldSnakeCase = _.snakeCase(locationField);
          const hasColumn = await db.schema.hasColumn(
            `${tableName}`,
            `${locationFieldSnakeCase}_geom`
          );
          if (!hasColumn) {
            await db.raw(`
              ALTER TABLE ${tableName}
              ADD COLUMN ${locationFieldSnakeCase}_geom GEOGRAPHY(Point, 4326);
            `);
          }
          // Generate point column field using only a query
          await db.raw(`
          UPDATE ${tableName}
          SET ${locationFieldSnakeCase}_geom = ST_SetSRID(ST_MakePoint(
              CAST(${locationFieldSnakeCase}::jsonb->>'lng' AS DOUBLE PRECISION),
              CAST(${locationFieldSnakeCase}::jsonb->>'lat' AS DOUBLE PRECISION)
          ), 4326)
          WHERE ${locationFieldSnakeCase}::jsonb->>'lng' IS NOT NULL
            AND ${locationFieldSnakeCase}::jsonb->>'lat' IS NOT NULL
            AND ${locationFieldSnakeCase}::jsonb->>'lng' != ''
            AND ${locationFieldSnakeCase}::jsonb->>'lat' != ''
            AND ${locationFieldSnakeCase}_geom IS NULL;
          `);
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
