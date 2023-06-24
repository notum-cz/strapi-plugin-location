import { Strapi } from "@strapi/strapi";
import qs from "qs";

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

  strapi.db.lifecycles.subscribe({
    // @ts-expect-error
    model: modelsWithLocation.map((model) => model.uid),

    afterCreate: async (event) => {
      const { model } = event;
      const locationFields = strapi.services[
        "plugin::location-plugin.locationServices"
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
    afterUpdate: async (event) => {
      const { model, params } = event;
      const locationFields = strapi.services[
        "plugin::location-plugin.locationServices"
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
  });

  strapi.server.use(async (ctx, next) => {
    if (ctx.request.method !== "GET") return next();

    const url = ctx.request.url;
    const collectionType = url.replace("/api/", "").split("/")[0].split("?")[0];

    const model = modelsWithLocation.find(
      (model) => model.collectionName === collectionType
    );

    const queryString = ctx.request.querystring as string;
    if (!model || !queryString || !queryString.includes("$location")) {
      return next();
    }

    const query = qs.parse(queryString);
    if (!query.$location) {
      return next();
    }
    let range = 0,
      lat: number | null = null,
      lng: number | null = null;

    // TODO: change this so that it can handle multiple location fields
    const location = query.$location as
      | { lat?: string; lng?: string; range?: string }
      | string;

    if (typeof location === "string") {
      const [latStr, lngStr, rangeStr] = location.split(",");
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
      range = parseFloat(rangeStr);
    } else {
      if (location.range) {
        range = parseInt(location.range);
      }
      if (location.lat) {
        lat = parseFloat(location.lat);
      }
      if (location.lng) {
        lng = parseFloat(location.lng);
      }
    }
    if (!lat || !lng) return next();

    // TODO: Add logic to filter by location
    console.log(range, lat, lng);
    await next();
  });
};
