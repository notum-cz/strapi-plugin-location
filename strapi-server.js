"use strict";
const path =
  process.env.NODE_ENV === "development" ? "./dist/server" : "./server";
module.exports = require(path);
