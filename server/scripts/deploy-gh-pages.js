/* eslint-env node, shelljs */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const globby = require("globby");
const mkdirp = require("mkdirp");
const resultsPage = require("./results-page");
require("shelljs/global");
const pkg = require("../../package.json");

function readJson(file) {
  const json = fs.readFileSync(file);
  return JSON.parse(json);
}

function listResults(dir) {
  return globby.sync("**/*.json", {
    cwd: dir
  });
}

function generateResultHtmls(outputDir, resultsDir, resultFiles) {
  resultFiles.forEach((resultFile) => {
    console.log(resultsDir, resultFile);
    const fullResultPath = path.resolve(resultsDir, resultFile);
    // Not using path.sep here, using "/" as our paths are all "/", even on Windows
    const parent = resultFile.split("/").slice(1).map((_) => "..").join("/");
    const html = resultsPage(readJson(fullResultPath), (parent || ".") + "/style.css");
    // resultFile could be something like "SauceLabs/result.html",
    // so make sure we preseve this folder in the output.
    const htmlDir = path.parse(path.resolve(outputDir, resultFile)).dir;
    const htmlFile = path.resolve(htmlDir, path.parse(resultFile).name + ".html");
    mkdirp.sync(path.parse(htmlFile).dir);
    console.log(htmlFile);
    fs.writeFileSync(htmlFile, html);
  });
}

function generateIndexHtml(resultsDir, resultFiles) {
  const pre = "<!doctype html>\n";
  const post = "";

  const link = (resultFile) => {
    const parsed = path.parse(resultFile);
    parsed.base = null;
    parsed.ext = ".html";
    const htmlFile = path.format(parsed);
    return `<a href="${htmlFile}">${htmlFile}</a>`;
  };

  return pre + resultFiles.map((f) => {
    return `<li>${link(f)}</li>`;
  }).join("\n") + post;
}

function main(opts) {
  const resultsDir = path.resolve("results");
  console.log("resultsDir=" + resultsDir);

  const ghTemp = path.resolve("./temp/gh-pages");
  console.log("ghTemp=" + ghTemp);

  const repo = pkg.repository.url;

  set("+v");

  if (!which("git")) {
    echo("git is required");
    exit(1);
  }

  rm("-rf", ghTemp);

  // git clone will also create the ghTemp folder
  exec("git clone " + repo + " --branch gh-pages --single-branch " + ghTemp);

  const resultFiles = listResults(resultsDir);
  generateResultHtmls(ghTemp, resultsDir, resultFiles);

  cp("./public/results/style.css", ghTemp);

  const indexHtml = generateIndexHtml(resultsDir, resultFiles);
  fs.writeFileSync(path.join(ghTemp, "index.html"), indexHtml);

  cd(ghTemp);

  exec("git add .");
  exec("git commit --amend --no-edit");

  if (opts.deploy) {
    exec("git push -f origin gh-pages");
  }
}

const args = process.argv.slice(2);
main({
  deploy: args[0] !== "dry-run"
});
