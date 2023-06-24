import { Strapi } from "@strapi/strapi";
import pluginId from "../admin/src/pluginId";

export default ({ strapi }: { strapi: Strapi }) => {
  strapi.customFields.register({
    name: 'location',
    plugin: pluginId,
    type: 'json',
    inputSize: { // optional
      default: 4,
      isResizable: true,
    },
  });

};
