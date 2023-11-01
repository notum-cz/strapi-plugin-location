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
  //@ts-expect-error
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
          const hasColumn = await db.schema.hasColumn(
            `${tableName}`,
            `${locationField.toLowerCase()}_geom`
          );
          if (!hasColumn) {
            await db.raw(`
              ALTER TABLE ${tableName}
              ADD COLUMN ${locationField}_geom GEOMETRY(Point, 4326);
            `);
          }
          // Generate point column field using only a query
          await db.raw(`
          UPDATE ${tableName}
          SET ${locationField}_geom = ST_SetSRID(ST_MakePoint(
              CAST((${locationField}::json->'lng')::text AS DOUBLE PRECISION),
              CAST((${locationField}::json->'lat')::text AS DOUBLE PRECISION)

          ), 4326)
          WHERE (${locationField}::json->'lng')::text != 'null' AND
                (${locationField}::json->'lat')::text != 'null'
          `);
        })
      );
    })
  );

  const subscriber = createSubscriber(strapi);
  //@ts-expect-error
  strapi.db.lifecycles.subscribe(subscriber);

  const middleware = createFilterMiddleware(strapi);
  strapi.server.use(middleware);
};
