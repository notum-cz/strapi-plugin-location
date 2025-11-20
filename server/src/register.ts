import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../admin/src/pluginId';

const getPostgisVersion = async (db) => {
  const result = await db.raw(`SELECT PostGIS_version();`).catch((err) => {
    console.log(err);
    return err.message;
  });
  if (typeof result === "string") {
    return undefined;
  }
  return result.rows[0].postgis_version;
};

const createPgExtension = async (db) => {
  const result = await db.raw(`create extension postgis;`).catch((err) => {
    console.log(err);
    return err.message;
  });
  if (typeof result === "string") {
    strapi.log.error(`Error Enabling PostGIS : ${result}`);
    return false;
  }
  return true;
};

const register = async ({ strapi }: { strapi: Core.Strapi }) => {

  try {
    if (strapi.config.database.connection.client !== "postgres") {
      strapi.log.error(`Strapi plugin-location works only with Postgres database.`);
      return;
    }
  
    // Use Strapi's managed database connection instead of creating a new knex instance
    const db = strapi.db.connection;
    let postgisVersion = await getPostgisVersion(db);
    if (!postgisVersion) {
      await createPgExtension(db);
      postgisVersion = await getPostgisVersion(db);
    }
    const isPostgisAvailable = postgisVersion !== undefined;
    if (!isPostgisAvailable) {
      strapi.log.error(`Error accessing POSTGIS`);
      return;
    }
  
    strapi.customFields.register({
      name: "location",
      plugin: PLUGIN_ID,
      type: "json",
      inputSize: {
        // optional
        default: 12,
        isResizable: true,
      },
    });
  }
  catch (error) {
    console.error('An error occurred while registering the location custom field', error);
    return;
  }
};

export default register;
