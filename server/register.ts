import { Strapi } from "@strapi/strapi";
import knex from "knex";
import pluginId from "../admin/src/pluginId";

const getPostgisVersion = async (db) => {
  const result = await db.raw(`SELECT PostGIS_version();`).catch((err) => {
    return err.message;
  });
  if (typeof result === "string") {
    return undefined;
  }
  return result.rows[0].postgis_version;
};

const createPgExtension = async (db) => {
  const result = await db.raw(`create extension postgis;`).catch((err) => {
    return err.message;
  });
  if (typeof result === "string") {
    strapi.log.info(`Error Enabling PostGIS, ${result}`);
    return false;
  }
  return true;
};

export default async ({ strapi }: { strapi: Strapi }) => {
  strapi["location-plugin"] = {
    enabled: true,
  };
  if (strapi.config.database.connection.client !== "postgres") {
    strapi.log.info(`Only postgres client type is supported!`);
    strapi["location-plugin"].enabled = false;
    return;
  }
  const db = knex(strapi.config.database.connection);
  let postgisVersion = await getPostgisVersion(db);
  if (!postgisVersion) {
    await createPgExtension(db);
    postgisVersion = await getPostgisVersion(db);
  }
  const isPostgisAvailable = postgisVersion !== undefined;
  if (!isPostgisAvailable) {
    strapi.log.error(`Error accessing POSTGIS`);
    strapi["location-plugin"].enabled = false;
    return;
  }

  strapi.customFields.register({
    name: "location",
    plugin: pluginId,
    type: "json",
    inputSize: {
      // optional
      default: 4,
      isResizable: true,
    },
  });

  db.destroy();
};
