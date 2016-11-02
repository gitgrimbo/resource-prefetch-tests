/* eslint-disable no-console */

/*
Usage:

node server\scripts\compare-results.js result1.json result2.json

*/

const fs = require("fs");
const requirejs = require("requirejs");

const dirname = __dirname;

// http://requirejs.org/docs/node.html#nodeModules
requirejs.config({
  baseUrl: dirname,
  nodeRequire: require
});

const compare = requirejs("../../public/diff/results-comparator").compare;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file));
}

function compareFiles(f1, f2) {
  return compare(readJson(f1), readJson(f2));
}

const args = process.argv.slice(2);
compareFiles(args[0], args[1]);
