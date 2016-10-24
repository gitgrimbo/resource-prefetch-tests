const fs = require("co-fs");
const path = require("path");
const koa = require("koa");
const cors = require("kcors");
const route = require("koa-route");
const bodyParser = require("koa-bodyparser");
const serve = require("koa-static");
const json = require("koa-json");
const logger = require("koa-logger");

const throttler = require("./my-koa-throttle");
const vendorScripts = require("./vendor-scripts");

const SessionManager = require("../session-manager");
const testConfig = require("../test-config");
const resultsPage = require("../results-page");

const sessionManager = new SessionManager();
const sessionSaveDir = path.join("./", "_sessions");
const resultsSaveDir = path.join("./", "results");
const downloadPathRegExp = /\/download-files/;

const app = koa();

app.use(logger());
app.use(route.get(downloadPathRegExp, throttler({ rate: 4, chunk: 20 * 1024, debug: 0 })));
app.use(route.get(downloadPathRegExp, cors({
  origin: function(req) {
    const useCors = (req.query.useCors === "true");
    return useCors ? "*" : false;
  }
})));
app.use(bodyParser());
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
    sessionManager.testResourceRequest(sessionId, testId, resourceId, resourcePath);
    yield next;
    sessionManager.testResourceResponse(sessionId, testId, resourceId, resourcePath, this.response.status);
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
app.use(route.get("/startNormalDownload", function* (next) {
  const { sessionId, testId } = this.query;
  const test = sessionManager.testStartNormalDownload(sessionId, testId);
  this.body = test;
}));

app.use(route.post("/endTest", function* (next) {
  const { sessionId, testId } = this.query;
  const test = sessionManager.endTest(sessionId, testId, this.request.body.client);
  this.body = test;
}));

app.use(route.get("/startSession", function* (next) {
  const session = sessionManager.startSession(this.query);
  this.body = session;
}));

app.use(route.get("/endSession", function* (next) {
  const { sessionId } = this.query;
  const session = sessionManager.endSession(sessionId);
  this.body = session;
  sessionManager.saveSession(sessionId, sessionSaveDir);
}));

app.use(route.get("/getSessions", function* (next) {
  this.body = sessionManager.getSessions();
}));

app.use(route.get("/config", function* (next) {
  this.body = testConfig;
}));


// Output a single result from disk
app.use(route.get("/result.html", function* (next) {
  const { name } = this.query;

  if (!name) {
    return (this.body = "No result 'name' parameter provided");
  }

  try {
    const data = yield fs.readFile(path.join(resultsSaveDir, name + ".json"));
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
  const link = f => `<a href="result.html?name=${path.parse(f).name}">${f}</a>`;
  const files = yield fs.readdir(resultsSaveDir);
  this.body = files.map(f => `<li>${link(f)}</li>`).join("\n");
}));


// Output a single session from memory
app.use(route.get("/session.html", function* (next) {
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

const args = process.argv.slice(2);
const port = args[0] || 3002;

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${this.address().port}`);
});
