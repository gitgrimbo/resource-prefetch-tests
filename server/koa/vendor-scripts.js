const path = require("path");
const route = require("koa-route");
const send = require("koa-send");
const ms = require("ms");
const vendorScriptMappings = require("../vendor-script-mappings");

function linkVendorScript(app, webpath, npmPath) {
  const filepath = path.join("node_modules", npmPath);
  app.use(route.get("/vendor" + webpath, function* () {
    this.response.cacheControl(ms("1 day"));

    yield send(this, filepath);
  }));
}

function linkVendorScripts(app) {
  vendorScriptMappings.forEach((mapping) => linkVendorScript(app, mapping[0], mapping[1]));
}

module.exports = {
  linkVendorScript,
  linkVendorScripts
};
