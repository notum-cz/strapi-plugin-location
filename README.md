<div align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-location/main/assets/notum-location-icon.png" height="250" alt="Notum Tiptap Plugin Logo"/>
  </picture>

  <h1>TipTap Editor Plugin for Strapi V5</h1>
  <p>by<br />
  <a href="https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=location-readme">
    <img style="margin-top: 0.5rem" src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-location/main/assets/notum-logo.svg" alt="Notum Technologies" />
  </a>
  </p>

  <p>
    A Strapi plugin for location-based inputs with PostGIS geometry storage. <br />
    Capture coordinates, filter by location, all backed by spatial types.
  </p>

  <!-- Badges -->
  <p>
    <a
      href="https://github.com/notum-cz/strapi-plugin-location/graphs/contributors"
    >
      <img
        src="https://img.shields.io/github/contributors/notum-cz/strapi-plugin-location"
        alt="contributors"
      />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-location/commits">
      <img
        src="https://img.shields.io/github/last-commit/notum-cz/strapi-plugin-location"
        alt="last update"
      />
    </a>
    <a href="https://github.com/notum-cz/strapi-plugin-location/issues/">
      <img
        src="https://img.shields.io/github/issues/notum-cz/strapi-plugin-location"
        alt="open issues"
      />
    </a>
    <a
      href="https://github.com/notum-cz/strapi-plugin-location/blob/main/LICENSE"
    >
      <img
        src="https://img.shields.io/github/license/notum-cz/strapi-plugin-location"
        alt="license"
      />
    </a>
    <a
      href="https://github.com/notum-cz/strapi-plugin-location/stargazers"
    >
      <img
        src="https://img.shields.io/github/stars/notum-cz/strapi-plugin-location"
        alt="stars"
      />
    </a>
  </p>

  <h4>
    <a href="https://github.com/notum-cz/strapi-plugin-location/issues/"
      >Report Bug or Request Feature</a
    >
  </h4>
</div>

<br />

<!-- Table of Contents -->

## Caution 🖐⚠️

This plugin requires a PostgreSQL database with the PostGIS extension enabled (can be used on that database plugin will enable it for you if it can). Make sure you have a compatible database set up before using this plugin. For development I used postgis docker image from here: https://registry.hub.docker.com/r/postgis/postgis/

⚠️ Filtering by data in relations is not supported.

<!-- About the Project -->

## About the Project

<!-- Features -->

### Features

- **Custom location field** for capturing latitude and longitude values, registered as a Strapi custom field
- **Interactive map** powered by [Leaflet](https://leafletjs.com/) and OpenStreetMap tiles — no Google Maps API key required
- **Draggable marker** to fine-tune coordinates directly on the map
- **Manual coordinate input** for entering latitude and longitude by hand
- **PostGIS geometry storage** — coordinates are persisted as spatial `geometry` types; the plugin enables the PostGIS extension automatically when possible
- **Location-based filtering** of entries via the `$location` query parameter
- **Radius search** — find entries within a given distance of a point
- **Same-location search** — find entries sharing a set of coordinates
- Built for **Strapi V5** with `@strapi/sdk-plugin`, working against the `documentId` attribute

<!-- Screenshots -->

### Screenshots

<div align="center"> 
  <picture>
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-location/main/assets/location-plugin-mockup.png" alt="Strapi Plugin TipTap Editor Interface" />
  </picture>
</div>

## We've released v2.x for Strapi V5

The version 2.x for this plugin is aimed at Strapi V5. If you need to use this plugin for Strapi V4, please install the 1.x releases of the plugin. With this upgrade:

- The plugin uses Strapi V5's plugin SDK library `@strapi/sdk-plugin`.
- The plugin now works based on the `documentId` attribute

## 🙉 What does the plugin do for you?

- ✅ Provides a custom location input field for latitude and longitude values
- ✅ Display the location on a map and fine-tune it by moving a marker using drag-and-drop functionality, all without the need for a Google Maps API key.
- ✅ Handles storage of location values as geometry types in a PostGIS database
- ✅ Allows filtering of items based on their location
- ✅ Enables searching for items with the same location or within a specified range

## 🧑‍💻 Installation

1. Install the package with your preferred package manager using one of the commands bellow:

```
npm i @notum-cz/strapi-plugin-location
```

```
yarn add @notum-cz/strapi-plugin-location
```

2. Create or modify file `config/plugins.js` and include the following code snippet:

```
module.exports = ({ env }) => ({
	"location-plugin": {
		enabled:  true,
	},
});
```

3. run `npm build` or `yarn build` to get the plugin activated in the admin UI
4. extend `config/middlewares.js` as shown in this example:

```
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

## ⚙️ Usage

- To use a custom input field for latitude and longitude go to the Content-type-builder of your application –> select a desired content-type -> click add another field -> select Cutstom tab -> name the field and hit the save button.
- To search or filter items based on their location use url parameter `location` in the following formats.

For example for a content-type named _Restaurant_ with a field _coords_ containing the coordinates the url with the location query would be:

`localhost:1337/api/restaurants?$location[coords]=49.200949303006055,16.623833585841673,5000`

This will return a list of restaurants within 5000m of the point specified by the coordinates. **Replace the collection name _restaurant_ and the field name _coords_ with the name of your collection name and the field containing the coordinates**. The last number (5000) is range and is not required.
Also this format is supported:

`localhost:1337/api/restaurants?$location[coords][lat]=49.200949303006055&$location[coords][lng]=16.623833585841673`

## 🛣️ Road map

Are any of these features significant to you? Please show your support by giving a thumbs up on the linked issues. This will help us assess their priority on the roadmap.

### Q4 2023

- ✨ [Geolocation shape field](https://github.com/notum-cz/strapi-plugin-location/issues/44)
- ✨ [MySQL support](https://github.com/notum-cz/strapi-plugin-location/issues/31)

### Q1 2024

- ✨ [GraphQL support](https://github.com/notum-cz/strapi-plugin-location/issues/46)
- ✨ [Reverse geocoding](https://github.com/notum-cz/strapi-plugin-location/issues/45)

## 🐛 Bugs

We manage bugs through [GitHub Issues](https://github.com/notum-cz/strapi-plugin-location/issues). <br>
If you're interested in helping us, you would be a rock ⭐.

## 🧔 Authors

The main star: **Dominik Míček** https://github.com/Ballonek <br>
Original Maintainer: **Ondřej Mikulčík** https://github.com/omikulcik <br>
Active Maintainer: **Filip Ónodi** https://github.com/fonodi <br>
Project owner: **Ondřej Janošík** <br>

Wanna be here? Open an issue (and solve it), PR or share improvement idea and you will become a listed contributor.

## 💬 Community

Join our [Discord server](https://discord.gg/hZRCcfWq) to discuss new features, implementation challenges or anything related to this plugin.

## 🚀 Created with passion by [Notum Technologies](https://notum.cz/en)

- Official STRAPI partner and Czech based custom development agency.
- We're passionate about sharing our expertise with the open source community, which is why we developed this plugin. 🖤

## 🎯 [How can Notum help you with your STRAPI project?](https://notum.cz/en/strapi/)

✔️ We offer valuable assistance in developing custom STRAPI, web, and mobile apps to fulfill your requirements and goals.. <br>
✔️ With a track record of 100+ projects, our open communication and exceptional project management skills provide us with the necessary tools to get your project across the finish line.<br>
📅 To initiate a discussion about your Strapi project, feel free to reach out to us via email at sales@notum.cz. We're here to assist you!
