/* eslint-env node, shelljs */
const fs = require("fs");
const path = require("path");
const resultsPage = require("./results-page");
require("shelljs/global");
const pkg = require("../../package.json");

function readJson(file) {
  const json = fs.readFileSync(file);
  return JSON.parse(json);
}

function listFiles(dir) {
  return fs.readdirSync(dir).map((f) => path.resolve(dir, f));
}

function generateResultHtmls(dir, resultFiles) {
  resultFiles.forEach((resultFile) => {
    console.log(resultFile);
    const html = resultsPage(readJson(resultFile), "./style.css");
    const htmlFile = path.join(dir, path.parse(resultFile).name + ".html");
    console.log(htmlFile);
    fs.writeFileSync(htmlFile, html);
  });
}

function generateIndexHtml(resultFiles) {
  const pre = "<!doctype html>\n";
  const post = "";

  const link = (f) => {
    const name = path.parse(f).name;
    return `<a href="${name}.html">${name}</a>`;
  };

  return pre + resultFiles.map((f) => {
    return `<li>${link(f)}</li>`;
  }).join("\n") + post;
}

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

const resultFiles = listFiles(resultsDir);
generateResultHtmls(ghTemp, resultFiles);

cp("./public/results/style.css", ghTemp);

const indexHtml = generateIndexHtml(resultFiles);
fs.writeFileSync(path.join(ghTemp, "index.html"), indexHtml);

cd(ghTemp);

exec("git add .");
exec("git commit --amend --no-edit");
exec("git push -f origin gh-pages");
