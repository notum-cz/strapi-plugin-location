import { Strapi } from "@strapi/strapi";
import { Event } from "@strapi/database/lib/lifecycles";
import { Subscriber } from "@strapi/database/lib/lifecycles/subscribers";

const locaitonServiceUid = "plugin::location-plugin.locationServices";

const createSubscriber = (strapi: Strapi): Subscriber => {
  const db = strapi.db.connection;
  const modelsWithLocation =
    strapi.services[locaitonServiceUid].getModelsWithLocation();

  return {
    // @ts-expect-error
    model: modelsWithLocation.map((model) => model.uid),

    afterCreate: async (event: Event) => {
      const { model } = event;
      const locationFields = strapi.services[
        locaitonServiceUid
      ].getLocationFields(model.attributes);
      // @ts-expect-error
      const id = event?.result?.id;
      if (!id) return;

      await Promise.all(
        locationFields.map(async (locationField) => {
          const data = event.params.data[locationField];

          if (!data?.lng || !data?.lat) return;

          await db.raw(`
              UPDATE ${model.tableName}
              SET ${locationField}_geom = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
              WHERE id = ${id};
          `);
        })
      );
    },
    afterUpdate: async (event: Event) => {
      const { model, params } = event;
      const locationFields = strapi.services[
        locaitonServiceUid
      ].getLocationFields(model.attributes);

      await Promise.all(
        locationFields.map(async (locationField) => {
          const data = params.data[locationField];
          if (!params.where.id || !data?.lng || !data?.lat) return;

          await db.raw(`
            UPDATE ${model.tableName}
            SET ${locationField}_geom = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
            WHERE id = ${params.where.id};
          `);
        })
      );
    },
  };
};

export default createSubscriber;
