import { Model } from '@strapi/database';
import type { Core } from '@strapi/strapi';
import type {} from '@strapi/types';
import _ from 'lodash';
import { locationServiceUid } from '../../src/constants';

const createSubscriber = (strapi: Core.Strapi): Model['lifecycles'] => {
  const db = strapi.db.connection;
  return {
    afterCreate: async (event) => {
      const { model } = event;
      const locationFields = strapi.service(locationServiceUid).getLocationFields(model.attributes);
      const id = event?.result?.id;
      if (!id) return;

      await Promise.all(
        locationFields.map(async (locationField) => {
          const data = event.params.data[locationField];

          if (!data?.lng || !data?.lat) return;

          await db.raw(`
              UPDATE ${model.tableName}
              SET ${_.snakeCase(
                locationField
              )}_geom = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
              WHERE id = ${id};
          `);
        })
      );
    },

    afterUpdate: async (event) => {
      const { model, params } = event;
      const locationFields = strapi.service(locationServiceUid).getLocationFields(model.attributes);

      await Promise.all(
        locationFields.map(async (locationField) => {
          const data = params.data[locationField];
          if (!params.where.id || !data?.lng || !data?.lat) return;

          await db.raw(`
            UPDATE ${model.tableName}
            SET ${_.snakeCase(locationField)}_geom = ST_SetSRID(ST_MakePoint(${
              data.lng
            }, ${data.lat}), 4326)
            WHERE id = ${params.where.id};
          `);
        })
      );
    },
  };
};

export default createSubscriber;
