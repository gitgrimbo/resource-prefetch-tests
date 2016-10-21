/* eslint-env node, shelljs */
const path = require("path");
const resultsPage = require("./results-page");
require("shelljs/global");

const ghTemp = "./temp/gh-pages";
const repo = require("../../package.json").repository.url;

set("+v");

if (!which("git")) {
  echo("git is required");
  exit(1);
}

rm("-rf", ghTemp);
mkdir("-p", ghTemp);

exec("git clone " + repo + " --branch gh-pages --single-branch " + ghTemp);

const html = resultsPage({}, "../styles.css");
console.log(html);
/*
cd(ghTemp);

exec("git add .");
exec("git commit --amend --no-edit");
exec("git push -f origin gh-pages");
*/
