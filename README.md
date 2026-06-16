<div align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-location/main/assets/notum-location-icon.png" height="250" alt="Notum Tiptap Plugin Logo"/>
  </picture>

  <h1>PostGIS Location Plugin</h1>
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

# Table of Contents

- [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [About the Project](#about-the-project)
    - [Features](#features)
    - [Screenshots](#screenshots)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
      - [1. Install the plugin via npm or yarn](#1-install-the-plugin-via-npm-or-yarn)
      - [2. Enable the plugin](#2-enable-the-plugin)
      - [3. Configure middleware](#3-configure-middleware)
      - [4. Rebuild Strapi and test the plugin](#4-rebuild-strapi-and-test-the-plugin)
  - [Usage](#usage)
  - [🤝 Community](#-community)
    - [Maintained by Notum Technologies](#maintained-by-notum-technologies)
      - [Current maintainer](#current-maintainer)
      - [Contributors](#contributors)
    - [Contributing](#contributing)

## Prerequisites

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
    <img src="https://raw.githubusercontent.com/notum-cz/strapi-plugin-location/main/assets/location-plugin-mockup.png" alt="Strapi Plugin Location Interface" />
  </picture>
</div>

<!-- Getting Started -->

## Getting Started

> 🚨 **Important**
>
> If you need to use this plugin for Strapi V4, please install the 1.x releases of the plugin.

<!-- Installation -->

### Installation

#### 1. Install the plugin via npm or yarn

```bash
# NPM
npm i @notum-cz/strapi-plugin-location

# Yarn
yarn add @notum-cz/strapi-plugin-location
```

#### 2. Enable the plugin

Create or modify `config/plugins.js` (or `config/plugins.ts`):

```ts
module.exports = ({ env }) => ({
  "location-plugin": {
    enabled: true,
  },
});
```

#### 3. Configure middleware

Extend `config/middlewares.js` to allow OpenStreetMap tile sources:

```ts
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

#### 4. Rebuild Strapi and test the plugin

```bash
  yarn build
  yarn start
```

## Usage

- To use a custom input field for latitude and longitude go to the Content-type-builder of your application –> select a desired content-type -> click add another field -> select Custom tab -> name the field and hit the save button.
- To search or filter items based on their location use url parameter `location` in the following formats.

For example for a content-type named _Restaurant_ with a field _coords_ containing the coordinates the url with the location query would be:

`localhost:1337/api/restaurants?$location[coords]=49.200949303006055,16.623833585841673,5000`

This will return a list of restaurants within 5000m of the point specified by the coordinates. **Replace the collection name _restaurant_ and the field name _coords_ with the name of your collection name and the field containing the coordinates**. The last number (5000) is range and is not required.
Also this format is supported:

`localhost:1337/api/restaurants?$location[coords][lat]=49.200949303006055&$location[coords][lng]=16.623833585841673`

## 🤝 Community

### Maintained by [Notum Technologies](https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=location-readme)

Built and maintained by [Notum Technologies](https://notum.tech/?utm_source=strapi-plugin&utm_medium=github&utm_campaign=location-readme), a Czech-based Strapi Enterprise Partner with a passion for open-source tooling.

#### Current maintainer

[Filip Ónodi](https://github.com/fonodi)

#### Contributors

<a href="https://github.com/notum-cz/strapi-plugin-location/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=notum-cz/strapi-plugin-location" alt="Contributors" />
</a>

### Contributing

Contributions of all kinds are welcome: code, documentation, bug reports, and feature ideas.
<br> <br> Browse the [open issues](https://github.com/notum-cz/strapi-plugin-location/issues) to find something to work on, or open a new one to start a discussion. Pull requests are always appreciated!

If you'd like to directly contribute, check our [Contributions document](https://github.com/notum-cz/strapi-plugin-location?tab=contributing-ov-file).
