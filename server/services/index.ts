import { Strapi } from "@strapi/strapi";

const locationServices = ({ strapi }: { strapi: Strapi }) => ({
  getLocationFields: (modelAttributes: any) => {
    return Object.entries(modelAttributes)
      .map(([key, value]) => {
        if (
          value &&
          typeof value === "object" &&
          "customField" in value &&
          [
            "plugin::location-plugin.location",
            "plugin::location-plugin.location-shape",
          ].includes(value.customField as string)
        ) {
          return {
            field: key,
            type:
              value.customField === "plugin::location-plugin.location"
                ? "location"
                : "shape",
          };
        } else {
          return false;
        }
      })
      .filter(Boolean);
  },
  getModelsWithLocation: () => {
    return strapi.db.config.models
      .filter(
        (model) =>
          (model.uid as string).startsWith("api::") ||
          //@ts-ignore
          model.modelType === "component" ||
          (model.uid as string) === "plugin::users-permissions.user"
      )
      .map((model) => {
        const hasLocationField = Object.values(model.attributes).some(
          (entry) => {
            if (
              entry &&
              typeof entry === "object" &&
              "customField" in entry &&
              [
                "plugin::location-plugin.location",
                "plugin::location-plugin.location-shape",
              ].includes(entry.customField as string)
            ) {
              return true;
            } else {
              return false;
            }
          }
        );
        return hasLocationField ? model : false;
      })
      .filter(Boolean);
  },
});
export default {
  locationServices,
};
