import { Strapi } from "@strapi/strapi";
import createSubscriber from "./utils/lifecycles";
import _ from "lodash";
import { getLocationQueryParams } from "./utils/locationHelpers";
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
          const hasColumn = await db.schema.hasColumn(
            `${tableName}`,
            `${locationField}_geom`
          );
          if (!hasColumn) {
            await db.raw(`
              ALTER TABLE ${tableName}
              ADD COLUMN ${locationField}_geom GEOMETRY(Point, 4326);
            `);
          }
          const location = await db(tableName).select(locationField, "id");
          await Promise.all(
            location.map(async (entry) => {
              const json = entry[locationField];
              if (!json?.lng || !json?.lat) return;

              await db.raw(`
                UPDATE ${tableName}
                SET ${locationField}_geom = ST_SetSRID(ST_MakePoint(${json.lng}, ${json.lat}), 4326)
                WHERE id = ${entry.id};
              `);
            })
          );
        })
      );
    })
  );

  const subscriber = createSubscriber(strapi);
  strapi.db.lifecycles.subscribe(subscriber);

  const middleware = createFilterMiddleware(strapi);
  strapi.server.use(middleware);
};
