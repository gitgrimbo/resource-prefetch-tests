const fs = require("co-fs");
const path = require("path");
const koa = require("koa");
const cors = require("kcors");
const route = require("koa-route");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const json = require("koa-json");
const logger = require("koa-logger");
const ctxCacheControl = require("koa-ctx-cache-control");
const koaResponseTime = require("koa-response-time");

const throttler = require("./my-koa-throttle");
const vendorScripts = require("./vendor-scripts");

const SessionManager = require("../session-manager");
const testConfig = require("../test-config");
const resultsPage = require("../results-page");

const sessionManager = new SessionManager();
const sessionSaveDir = path.join("./", "_sessions");
const resultsPathMap = {
  "results": path.resolve("./results"),
};
const downloadPathRegExp = /\/download-files/;

const app = koa();

// Add cache control capabilities
ctxCacheControl(app);

app.use(koaResponseTime());
app.use(logger());

app.use(route.get(downloadPathRegExp, throttler({ rate: 4, chunk: 20 * 1024, debug: 0 })));

// CORS
function* fakeOrigin(next) {
  const origin = this.request.headers["origin"];
  if (!origin) {
    const referer = this.request.headers["referer"];
    // Set the fakeOrigin to be the origin of the request.
    // E.g. "http://resource-prefetch-tests1:3002".
    const fakeOrigin = /^([^/]*\/\/[^/]*)\//.exec(referer)[1];
    this.request.headers["origin"] = fakeOrigin;
  }
  yield next;
}
// kcors MUST have an "origin" header (as it follows the CORS spec).
// If we want to send the CORS headers regardless, we can fake an "origin"
// header which causes kcors to treat it as a standards-compliant CORS request.
//app.use(route.get(downloadPathRegExp, fakeOrigin));
app.use(route.get(downloadPathRegExp, cors({
  origin: function(req) {
    const useCors = (req.query.useCors === "true");
    return useCors ? "*" : false;
  }
})));

// body parsing
app.use(bodyParser());

// json
app.use(json());


// The middleware that records a request made and a response sent.
app.use(route.get(downloadPathRegExp, function* (next) {
  function normalisedPath(req) {
    return req.protocol + "://" + req.headers.host + req.path;
  }
  const { sessionId, testId } = this.query;
  if (sessionId) {
    const resourcePath = normalisedPath(this.request);
    const resourceId = Number(this.query.resourceId);
    sessionManager.testResourceRequest(sessionId, testId, resourceId, resourcePath, this.headers);
    yield next;
    sessionManager.testResourceResponse(sessionId, testId, resourceId, resourcePath, this.response.status, this.response.headers);
  } else {
    yield next;
  }
}));

// Serve all the files in "./public".
app.use(serve("public", {
  maxage: 1 * 24 * 60 * 60 * 1000
}));

// Add the mappings to serve vendor scripts.
vendorScripts.linkVendorScripts(app);

// startTest means the next resource requested will be loaded as a prefetch.
app.use(route.post("/startTest", function* (next) {
  const { sessionId, testId } = this.query;
  const test = sessionManager.startTest(sessionId, testId, this.request.body.test);
  this.body = test;
}));

// startNormalDownload means the next resource requested will be loaded normally after prefetch.
app.use(route.post("/startNormalDownload", function* (next) {
  const { sessionId, testId } = this.query;
  const test = sessionManager.testStartNormalDownload(sessionId, testId);
  this.body = test;
}));

app.use(route.post("/endTest", function* (next) {
  const { sessionId, testId } = this.query;
  const test = sessionManager.endTest(sessionId, testId, this.request.body.client);
  this.body = test;
}));

app.use(route.post("/startSession", function* (next) {
  const userAgent = this.req.headers["user-agent"];
  console.log(userAgent);
  const session = sessionManager.startSession({
    userAgent
  });
  this.body = session;
}));

app.use(route.post("/endSession", function* (next) {
  const { sessionId } = this.query;
  const session = sessionManager.endSession(sessionId);
  this.body = session;
  sessionManager.saveSession(sessionId, sessionSaveDir);
}));

app.use(route.post("/getSessions", function* (next) {
  this.body = sessionManager.getSessions();
}));

app.use(route.post("/config", function* (next) {
  this.body = testConfig;
}));


// Output a single result from disk
app.use(route.get("/result.html", function* (next) {
  this.response.cacheControl(false);

  const { name } = this.query;

  if (!name) {
    return (this.body = "No result 'name' parameter provided");
  }

  const split = name.split("/");
  const alias = split[0];
  const file = name.substring(alias.length);
  const dir = resultsPathMap[alias];
  if (!file || !dir) {
    throw new Error(`Could not load file ${file} from alias ${alias}`);
  }
  try {
    const data = yield fs.readFile(path.join(dir, file + ".json"));
    const sessionFromDisk = JSON.parse(String(data));
    return (this.body = resultsPage(sessionFromDisk, "results/style.css"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  this.status = 404;
  this.body = "results with name=" + name + " not found";
}));


// Output list of results from disk
app.use(route.get("/results.html", function* (next) {
  this.response.cacheControl(false);

  const link = (nameParam, linkText) => `<a href="result.html?name=${nameParam}">${linkText}</a>`;

  // Read the files from each alias directory.
  const aliases = Object.keys(resultsPathMap);
  const readdirs = yield aliases.map((alias) => fs.readdir(resultsPathMap[alias]));

  this.body = aliases.map((alias, i) => {
    const files = readdirs[i];
    return files.map((f) => {
      const parsed = path.parse(f);
      const name = alias + "/" + parsed.name;
      return `<li>${link(name, name)}</li>`;
    }).join("\n");
  }).join("\n");
}));


// Output a single session from memory
app.use(route.get("/session.html", function* (next) {
  this.response.cacheControl(false);

  const { sessionId } = this.query;

  if (!sessionId) {
    return (this.body = "No sessionId parameter provided");
  }

  const session = sessionManager.getSession(sessionId);

  // Try session from memory first
  if (session) {
    return (this.body = resultsPage(session, "results/style.css"));
  }
}));


// Output list of sessions from memory
app.use(route.get("/sessions.html", function* () {
  this.response.cacheControl(false);

  const sessionIds = sessionManager.getSessionIds();
  const link = (id) => `<a href="session.html?sessionId=${id}">${id}</a>`;
  this.body = sessionIds.map((id) => `<li>${link(id)}</li>`).join("\n");
}));


const args = process.argv.slice(2);
const port = args[0] || 3002;

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${this.address().port}`);
});
