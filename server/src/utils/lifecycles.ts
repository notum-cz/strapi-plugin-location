import { Model } from '@strapi/database';
import type { Core } from '@strapi/strapi';
import type { } from '@strapi/types';
import _ from 'lodash';
import { locationServiceUid } from '../../src/constants';

const createSubscriber = (strapi: Core.Strapi): Model['lifecycles'] => {
  const db = strapi.db.connection;

  const updateGeomField = async (tableName: string, locationField: string, id: string, lng: number, lat: number) => {
    // Needs to be in a transaction to avoid race condition
    await strapi.db.transaction(({ onCommit }) => {
      onCommit(async () => {
        await db.raw(`
          UPDATE ${tableName}
          SET ${_.snakeCase(locationField)}_geom = ST_SetSRID(ST_MakePoint(?::DOUBLE PRECISION, ?::DOUBLE PRECISION), 4326)
          WHERE id = ?
        `, [lng, lat, id]);
      });
    });
  }

  return {
    afterCreate: async (event) => {
      const { model } = event;
      const locationFields = strapi.service(locationServiceUid).getLocationFields(model.attributes);
      const id = event?.result?.id;
      if (!id) return;

      await Promise.all(
        locationFields.map(async (locationField) => {
          const data = event.params.data[locationField];

          if (!data?.lng || !data?.lat) return

          await updateGeomField(model.tableName, locationField, id, data.lng, data.lat);
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

          await updateGeomField(model.tableName, locationField, params.where.id, data.lng, data.lat);
        })
      );
    },
  };
};

export default createSubscriber;
