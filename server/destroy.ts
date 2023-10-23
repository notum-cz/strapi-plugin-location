import { Strapi } from "@strapi/strapi";

export default async ({ strapi }: { strapi: Strapi }) => {
  const db = strapi.db.connection;

  const modelsWithLocation =
    strapi.services[
      "plugin::location-plugin.locationServices"
    ].getModelsWithLocation();

  await Promise.all(
    modelsWithLocation.map(async (model) => {
      const tableName = model.tableName;

      const locationFields = strapi.services[
        "plugin::location-plugin.locationServices"
      ].getLocationFields(model.attributes);

      await Promise.all(
        locationFields.map(async (locationField) => {
          await db.raw(`
            ALTER TABLE ${tableName}
            DROP COLUMN ${locationField}_geom;
          `);
        })
      );
    })
  );
};
