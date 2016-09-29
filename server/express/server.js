const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const responseTime = require("response-time");
const cors = require("cors");
const bodyParser = require("body-parser");

const throttleMiddleware = require("./throttle-middleware");
const vendorScripts = require("./vendor-scripts");

const resultsPage = require("../results-page");
const SessionManager = require("../session-manager");
const testConfig = require("../test-config");

function corsOptionsDelegate(req, callback) {
  const corsOptions = {};
  const useCors = (req.query.useCors === "true");
  if (useCors) {
    corsOptions.origin = "*";
  } else {
    corsOptions.origin = false;
  }
  callback(null, corsOptions);
}

const sessionManager = new SessionManager();
const sessionSaveDir = path.join("./", "_sessions");
const app = express();
app.use(morgan("combined"));
app.use(responseTime());
app.use(cors(corsOptionsDelegate));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// startTest means the next resource requested will be loaded as a prefetch.
app.post("/startTest", function(req, res) {
  const { sessionId, testId } = req.query;
  const test = sessionManager.startTest(sessionId, testId, req.body.test);
  res.json(test);
});

// startNormalDownload means the next resource requested will be loaded normally after prefetch.
app.get("/startNormalDownload", function(req, res) {
  const { sessionId, testId } = req.query;
  const test = sessionManager.testStartNormalDownload(sessionId, testId);
  return res.json(test);
});

app.post("/endTest", function(req, res) {
  const { sessionId, testId } = req.query;
  const test = sessionManager.endTest(sessionId, testId, req.body.client);
  res.json(test);
});

app.get("/startSession", function(req, res) {
  const session = sessionManager.startSession(req.query);
  res.json(session);
});

app.get("/endSession", function(req, res) {
  const { sessionId } = req.query;
  const session = sessionManager.endSession(sessionId);
  res.json(session);
  sessionManager.saveSession(sessionId, sessionSaveDir);
});

app.get("/getSessions", function(req, res) {
  res.json(sessionManager.getSessions());
});

app.get("/config", function(req, res) {
  res.json(testConfig);
});

app.get("/results.html", function(req, res, next) {
  const { sessionId } = req.query;

  // Try session from memory first
  const session = sessionManager.getSession(sessionId);
  if (session) {
    return res.send(resultsPage(session, "results/style.css"));
  }

  // Then from disk
  fs.readFile(path.join(sessionSaveDir, sessionId + ".json"), function(err, data) {
    if (!err) {
      const sessionFromDisk = JSON.parse(String(data));
      return res.send(resultsPage(sessionFromDisk, "results/style.css"));
    }
    next();
  });
});

app.use(function(req, res, next) {
  function normalisedPath(req) {
    return req.protocol + "://" + req.headers.host + req.path;
  }

  const { sessionId, testId } = req.query;
  if (sessionId) {
    const resourceId = Number(req.query.resourceId);
    const resourcePath = normalisedPath(req);
    sessionManager.testResourceRequest(sessionId, testId, resourceId, resourcePath);
  }
  next();
});

app.use("/download-files", throttleMiddleware(1000 * 1024));

app.use("/download-files", function(req, res, next) {
  var end = res.end;
  res.end = function() {
    end.apply(res, arguments);
    const { sessionId, testId } = req.query;
    const resourceId = Number(req.query.resourceId);
    sessionManager.testResourceResponse(sessionId, testId, resourceId, res.statusCode);
  };
  next();
});

//app.use("/download-files", function(req, res, next) { setTimeout(next, 4000); });
app.use(express.static("public", {
  lastModified: false,
  maxAge: "1d"
}));

vendorScripts.linkVendorScripts(app);

const httpPort = 3001;
const httpsPort = 3002;

const args = process.argv.slice(2);
const passphrase = args[0];

http.createServer(app).listen(httpPort);

if (passphrase) {
  https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.cer"),
    passphrase
  }, app).listen(httpsPort);
}
