/* eslint-disable no-console */

/*
Usage:

node server\scripts\merge-results.js _sessions

If _sessions is a directory name, then merge-results will read each file in
that directory and try and merge the results by User Agent.

Why? E.g. when several (different) tests are run as Intern functional tests
and we want to combine all the results.
*/

const fs = require("fs");
const path = require("path");
const uaParser = require("ua-parser-js");

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (err) {
    return false;
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file));
}

function merge(merged, json, i) {
  Object.keys(json.tests).forEach((k) => {
    const test = json.tests[k];
    delete json.tests[k];
    json.tests[i + "." + k] = test;
  });

  if (!merged) {
    return json;
  }

  if (merged.userAgent !== json.userAgent) {
    throw new Error("Should not merge results with different user agents");
  }

  Object.keys(json.tests).forEach((k) => {
    merged.tests[k] = json.tests[k];
  });

  return merged;
}

function mergeJsons(jsons) {
  return jsons.reduce(merge, null);
}

function mergeFiles(files) {
  return files.reduce((merged, file, i) => {
    const json = readJson(file);
    return merge(merged, json, i);
  }, null);
}

/**
 * @param {string} dir The directory to scan.
 * @return {object} A map of {userAgent: string}->{mergedResult: object}
 */
function mergeDirectory(dir) {
  const files = fs.readdirSync(dir);
  const jsons = files
    .map((f) => path.resolve(dir, f))
    .filter(isFile)
    .map(readJson);

  const uaMap = jsons.reduce((map, json) => {
    const arr = map[json.userAgent] = (map[json.userAgent] || []);
    arr.push(json);
    return map;
  }, {});

  Object.keys(uaMap).forEach((k) => {
    const jsons = uaMap[k];
    uaMap[k] = mergeJsons(jsons);
  });

  return uaMap;
}

function writeUAMap(dir, uaMap) {
  Object.keys(uaMap).forEach((k) => {
    const merged = uaMap[k];
    const ua = uaParser(k);
    const file = path.resolve(dir, ua.browser.name + "-" + ua.browser.version + ".json");
    console.log("writing to " + file);
    fs.writeFileSync(file, JSON.stringify(merged, null, 1));
  });
}

function firstAndOnlyArgIsDirectory(args) {
  if (args.length !== 1) {
    return false;
  }
  const stat = fs.statSync(args[0]);
  return stat.isDirectory();
}

const args = process.argv.slice(2);

if (firstAndOnlyArgIsDirectory(args)) {
  const uaMap = mergeDirectory(args[0]);
  writeUAMap(args[0], uaMap);
} else {
  console.log(mergeFiles(args));
}
