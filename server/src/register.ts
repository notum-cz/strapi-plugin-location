import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../pluginId';
const getPostgisVersion = async (db: Core.Strapi['db']['connection']) => {
  const result = await db.raw(`SELECT PostGIS_version();`).catch((err) => {
    return err.message;
  });

  if (typeof result === 'string') {
    return undefined;
  }
  return result.rows[0].postgis_version;
};

const createPgExtension = async (db: Core.Strapi['db']['connection']) => {
  const result = await db.raw(`create extension postgis;`).catch((err) => {
    strapi.log.error(err);
    return err.message;
  });

  if (typeof result === 'string') {
    strapi.log.info(`Error Enabling PostGIS I am HERE, ${result}\n${Object.keys(db)}`);
    return false;
  }

  return true;
};

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  strapi[PLUGIN_ID] = {
    enabled: true,
  };

  if (strapi.config.database.connection.client !== 'postgres') {
    strapi.log.info(`Only postgres client type is supported!`);
    strapi[PLUGIN_ID].enabled = false;

    return;
  }

  let postgisVersion = await getPostgisVersion(strapi.db.connection);
  strapi.log.info(`postgis v: ${postgisVersion}, ${!postgisVersion}`);

  if (!postgisVersion) {
    strapi.log.info('trying to create postgis');
    await createPgExtension(strapi.db.connection);
    postgisVersion = await getPostgisVersion(strapi.db.connection);
  }

  const isPostgisAvailable = postgisVersion !== undefined;
  strapi.log.info(`isPostgisAvailable: ${isPostgisAvailable}`);
  if (!isPostgisAvailable) {
    strapi.log.error(`Error accessing POSTGIS I AM HERE`);
    strapi[PLUGIN_ID].enabled = false;
    return;
  }

  strapi.customFields.register({
    name: 'location',
    plugin: PLUGIN_ID,
    type: 'json',

    inputSize: {
      // optionalƒhere
      default: 4,
      isResizable: true,
    },
  });

  // db.destroy();
};

export default register;
