const path = require("path");
const express = require("express");
const vendorScriptMappings = require("../vendor-script-mappings");

function linkVendorScript(app, webpath, npmPath) {
  const filepath = path.join("node_modules", npmPath);
  app.use("/vendor" + webpath, express.static(filepath));
}

function linkVendorScripts(app) {
  vendorScriptMappings.forEach(mapping => linkVendorScript(app, mapping[0], mapping[1]));
}

module.exports = {
  linkVendorScript,
  linkVendorScripts
};
