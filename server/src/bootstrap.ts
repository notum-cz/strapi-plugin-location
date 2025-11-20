import type { Core } from '@strapi/strapi';
import _ from "lodash";
import { createFilterMiddleware, handlerLocationUpdatesMiddleware } from "../src/utils/middleware";
const locaitonServiceUid = "plugin::location-plugin.locationServices";
const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {

  try {
    const db = strapi.db.connection;

    const modelsWithLocation =
      strapi.services[locaitonServiceUid].getModelsWithLocation();
  
    await Promise.all(
      modelsWithLocation.map(async (model) => {
        const tableName = model.collectionName;
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
                CAST(${locationFieldSnakeCase}::json->>'lng' AS DOUBLE PRECISION),
                CAST(${locationFieldSnakeCase}::json->>'lat' AS DOUBLE PRECISION)
            ), 4326)
            WHERE ${locationFieldSnakeCase}::json->>'lng' IS NOT NULL AND
                  ${locationFieldSnakeCase}::json->>'lat' IS NOT NULL AND
                  ${locationFieldSnakeCase}::jsonb->>'lng' != '' AND
                  ${locationFieldSnakeCase}::jsonb->>'lat' != '' AND
                  ${locationFieldSnakeCase}_geom IS NULL;
            `);
          })
        );
      })
    );
  
    strapi.server.use(createFilterMiddleware(strapi));  
    strapi.server.use(handlerLocationUpdatesMiddleware(strapi));
  }
  catch (error) {
    console.error('An error occurred while bootstrapping the location plugin', error);
    return;
  }
};

export default bootstrap;
