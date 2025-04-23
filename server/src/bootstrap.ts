import type { Core, Schema } from '@strapi/strapi';
import createSubscriber from './utils/lifecycles';
import _ from 'lodash';
import createFilterMiddleware from './utils/middleware';
import { locationServiceUid } from './constants';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  if (!strapi['location-plugin'].enabled) {
    // TODO: add information that plugin is disabled
    return;
  }
  const db = strapi.db.connection;

  strapi.log.info(`here before crash`);
  const modelsWithLocation = strapi
    .service(locationServiceUid)
    .getModelsWithLocation() as Schema.ContentTypes;
  strapi.log.info(JSON.stringify(modelsWithLocation));

  await Promise.all(
    Object.values(modelsWithLocation).map(async (model) => {
      strapi.log.info(`modeltablename: ${JSON.stringify(model)}`);
      const tableName = model.collectionName;
      strapi.log.info(tableName);
      const locationFields = strapi.services[locationServiceUid].getLocationFields(
        model.attributes
      );
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
              CAST((${locationFieldSnakeCase}::json->'lng')::text AS DOUBLE PRECISION),
              CAST((${locationFieldSnakeCase}::json->'lat')::text AS DOUBLE PRECISION)

          ), 4326)
          WHERE (${locationFieldSnakeCase}::json->'lng')::text != 'null' AND
                (${locationFieldSnakeCase}::json->'lat')::text != 'null' AND
                ${locationFieldSnakeCase}_geom IS NULL;
          `);
        })
      );
    })
  );

  const subscriber = createSubscriber(strapi);
  strapi.db.lifecycles.subscribe(subscriber);

  const middleware = createFilterMiddleware(strapi);
  strapi.server.use(middleware);
};

export default bootstrap;
