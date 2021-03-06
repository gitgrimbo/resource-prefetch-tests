# resource-prefetch-tests

Runs a series of tests to discover which approaches to prefetching resources
work in a browser.

# Install

`git clone https://github.com/gitgrimbo/resource-prefetch-tests.git`

# Usage

First, start the server.

`node server`

Second, point your browser at [http://localhost:3002](http://localhost:3002).

Third, click the `Start` button. The tests will run, and the results will be
displayed in the browser (as each individual test completes) and saved to disk
(when all the tests are complete, to the `./_sessions` folder).

# Results

What do the results look like?

- [https://gitgrimbo.github.io/resource-prefetch-tests/](https://gitgrimbo.github.io/resource-prefetch-tests/)

Or clone the repo and take a look at [./samples/results.html](./samples/results.html).

Also see [./samples/session.json](./samples/session.json).

# Why?

By prefetching resources we hope to speed up subsequent user interactions
with our site.

If we can prefetch required resources into the browser's cache
before they are needed, then fetching those resources when they *are* needed
should be much faster, as the browser has them in its cache.

# The Tests

The tests are built up from combining the following dimensions:

- prefetch approach
- resource type
- resource size
- same-domain resource/cross-domain resource
- CORS HTTP headers/no CORS HTTP headers

## Prefetch approaches tested

These are the implementations of prefetch that are tested.

- `<link rel="prefetch" href="url">` - [Mozilla Developer Network; Link prefetching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Link_prefetching_FAQ).
- `<link rel="prefetch" href="url" crossorigin="anonymous">` - [Mozilla Developer Network; &lt;link crossorigin&gt;](https://developer.mozilla.org/en/docs/Web/HTML/Element/link#attr-crossorigin).
- `new Image().src = url;` - [techrepublic.com; Preloading and the JavaScript Image() object](http://www.techrepublic.com/article/preloading-and-the-javascript-image-object/).
- `<object data="url">` - [Mozilla Developer Network; object element](https://developer.mozilla.org/en/docs/Web/HTML/Element/object).
- `XMLHttpRequest` - [Mozilla Developer Network; XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).
- `XDomainRequest` - [Mozilla Developer Network; XDomainRequest](https://developer.mozilla.org/en-US/docs/Web/API/XDomainRequest) (IE9 only feature).

## Resource types tested

These are the resource types that are tested.  Some prefetch implementations
work for some resources types but not others.

- JPG
- JS
- CSS
- WOFF

## Resource sizes tested

There are 'large', 'medium' and 'small' versions of JPG, CSS and JS.

The test server also deliberately throttles the bandwidth available to the test
resources. This is because some browsers reject (do not download and/or do
not cache) resources once they realise the resource is not the expected
content type. E.g. Firefox 49 and IE 11 will reject (not cache) non-image
resources prefetched using the `new Image().src = url` approach, but Chrome 53
caches these resources successfully.

Having large, medium and small resources, plus the bandwidth throttling,
facilitates exposing this browser behaviour.

## CORS and non-CORS

Each resource+approach combination is also tested with CORS and non-CORS requests.

A request with the `useCors=true` query parameter will instruct the test server
to add the CORS HTTP response headers.

## Known browser behaviour

IE11

- `<link rel="prefetch">`. IE11 supports up to ten (10) prefetch requests.
  Additional requests are ignored.
  [Prerender and prefetch support](https://msdn.microsoft.com/en-us/library/dn265039(v=vs.85).aspx).

IE9

- XHR differences can be seen based on IE security zones.  E.g. out-of-the-box
  IE9 may have "Access data sources across domains" disabled, but this setting
  may be enabled in Sauce Labs. This can be the difference between the XHR
  prefetch results passing or failing. See
  https://www.webdavsystem.com/ajax/programming/cross_origin_requests.

Edge

- `<link rel="prefetch">`. Microsoft Edge supports up to ten (10) prefetch requests.
  Additional requests are ignored.
  [Prerender and prefetch support](https://developer.microsoft.com/en-us/microsoft-edge/platform/documentation/dev-guide/performance/prerender-and-prefetch-support/):

# Client JS Build

Uses [browserify](https://github.com/substack/node-browserify) and
[Babel](https://babeljs.io/) to build the `dist.js` file for the client,
exporting a single module named `ResourcePrefetchTests`. Running:

    npm run build

will trigger:

    browserify -r ./public/entry:ResourcePrefetchTests -d -o public/dist.js

Babel is used for ES2015/ES2016/ES2017 features, such as async/await.

Uses [browserify-shim](https://github.com/thlorenz/browserify-shim) to keep
jQuery and Mustache out of `dist.js`:

```json
    "browserify-shim": {
      "jquery": "global:$",
      "mustache": "global:Mustache"
    }
```

Uses [npm-watch](https://github.com/grncdr/npm-watch) to trigger a build when
the source (`./public/**/*.js`) changes. Running:

    npm run watch

will use the following config:

```json
    "watch": {
      "build": {
        "patterns": [
          "public"
        ],
        "extensions": "js",
        "ignore": "public/dist.js",
        "quiet": true
      }
    }
```

# TODO

- HTTPS

# License

MIT © [Paul Grime](https://github.com/gitgrimbo/)
