import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../pluginId';

const locationService = ({ strapi }: { strapi: Core.Strapi }) => ({
  getLocationFields: (modelAttributes: Core.Strapi['contentTypes']) =>
    Object.entries(modelAttributes)
      .map(([key, value]) =>
        value &&
        typeof value === 'object' &&
        'customField' in value &&
        value.customField === `plugin::${PLUGIN_ID}.location`
          ? key
          : false
      )
      .filter(Boolean),
  getModelsWithLocation: () =>
    Object.keys(strapi.contentTypes).reduce(
      (acc, uid) =>
        uid.startsWith('api::') &&
        typeof strapi.contentTypes[uid].attributes === 'object' &&
        Object.values(strapi.contentTypes[uid].attributes).some(
          (attribute) =>
            typeof attribute === 'object' &&
            'customField' in attribute &&
            attribute.customField === `plugin::${PLUGIN_ID}.location`
        )
          ? { ...acc, [uid]: strapi.contentTypes[uid] }
          : acc,
      {}
    ),
});

export default locationService;
