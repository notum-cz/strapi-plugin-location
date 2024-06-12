# Contributing to strapi-plugin-location

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to strapi-plugin-location, which is hosted in the [strapi-plugin-location GitHub repository](https://github.com/notum-cz/strapi-plugin-location). These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## How to Develop the Plugin Locally

1. **Fork the repository.**
2. **Clone the repository** to the `src/plugins` folder (create one if it does not exist).
3. **Create or modify the `config/plugins.js` file** and include the following code snippet:

    ```javascript
    module.exports = ({ env }) => ({
        "location-plugin": {
            enabled: true,
            resolve: "./src/plugins/strapi-plugin-location"
        },
    });
    ```

4. **Extend `config/middlewares.js`** as shown in this example:

    ```javascript
    export default [
        "strapi::errors",
        {
            name: "strapi::security",
            config: {
                contentSecurityPolicy: {
                    useDefaults: true,
                    directives: {
                        "connect-src": ["'self'", "https:"],
                        "img-src": [
                            "'self'",
                            "data:",
                            "blob:",
                            "https://market-assets.strapi.io",
                            "https://tile.openstreetmap.org",
                            "https://a.tile.openstreetmap.org",
                            "https://b.tile.openstreetmap.org",
                            "https://c.tile.openstreetmap.org",
                        ],
                        "media-src": ["'self'", "data:", "blob:"],
                        upgradeInsecureRequests: null,
                    },
                },
            },
        },
        "strapi::cors",
        "strapi::poweredBy",
        "strapi::logger",
        "strapi::query",
        "strapi::body",
        "strapi::session",
        "strapi::favicon",
        "strapi::public",
    ];
    ```

5. **Open your terminal** in `src/plugins/strapi-plugin-location` and run `yarn` followed by `yarn develop`.

## How to Submit a PR

Once your features are ready, make a pull request to the original repository. Please fill in at least some information in the PR description so we know the reason for opening the PR.
