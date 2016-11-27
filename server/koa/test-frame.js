const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

function loadTemplate() {
  return String(fs.readFileSync(path.join(__dirname, "test-frame.ejs.html")));
}

function attrsToStr(attrs) {
  if (!attrs) {
    return "";
  }
  const arr = [];
  for (const k in attrs) {
    arr.push(`${k}="${attrs[k]}"`);
  }
  return arr.join(" ");
}

function tagHtml(name, attrs, selfClose, content) {
  const attrsStr = attrs ? attrsToStr(attrs) : "";
  return [
    "<",
    name,
    attrsStr ? " " + attrsStr : "",
    selfClose ? "/" : "",
    ">\n",
    content ? content : "",
    !selfClose ? "\n</" + name + ">" : "",
  ].join("");
}

/* eslint-disable */
function resourceOnLoad(e) {
  log("resourceOnLoad", e);
  const msg = "?";
  const attrs = {};
  resourceLoaders.resolveWithEvent(resolve, msg, attrs)(e);
}

function resourceOnError(e) {
  log("resourceOnError", e);
  const tag = "?";
  const src = "?";
  resourceLoaders.rejectWithEvent(reject, tag, src)(e);
}
/* eslint-enable */

const reloadTemplate = true;
const template = loadTemplate();

function makeTemplateData(htmlContent) {
  return {
    htmlContent,
    placeInTag: htmlContent.placeInTag,
    html: function() {
      let attrs = Object.assign({}, htmlContent.attrs);
      if (htmlContent.onload) {
        attrs.onerror = "resourceOnError(event)";
      }
      if (htmlContent.onerror) {
        attrs.onload = "resourceOnLoad(event)";
      }
      return tagHtml(htmlContent.name, attrs, htmlContent.selfClose, htmlContent.content);
    },
  };
}

function render(tag) {
  const htmlContent = (Array.isArray(tag.htmlContent) ? tag.htmlContent : [tag.htmlContent]);
  const view = {
    resolveData: {
      msg: tag.metadata.name,
      attrs: tag.metadata.attrs,
    },
    rejectData: {
      tag: tag.metadata.name,
      src: tag.metadata.src,
    },
    htmlContent: htmlContent ? htmlContent.map(makeTemplateData) : [],
  };
  return ejs.render(reloadTemplate ? loadTemplate() : template, { view }, {
    debug: true,
  });
}

function cssLink(src) {
  const attrs = {
    type: "text/css",
    rel: "stylesheet",
    href: src,
  };
  return {
    metadata: {
      name: "style",
      attrs,
      src,
    },
    htmlContent: {
      placeInTag: "head",
      name: "link",
      attrs,
      selfClose: true,
      onload: true,
      onerror: true,
    }
  };
}

function imgTag(src) {
  const attrs = {
    src: src,
  };
  return {
    metadata: {
      name: "img",
      attrs,
      src,
    },
    htmlContent: {
      placeInTag: "body",
      name: "img",
      attrs,
      selfClose: true,
      onload: true,
      onerror: true,
    }
  };
}

function scriptTag(src) {
  const attrs = {
    type: "text/javascript",
    src: src,
  };
  return {
    metadata: {
      name: "script",
      attrs,
      src,
    },
    htmlContent: {
      placeInTag: "head",
      name: "script",
      attrs,
      selfClose: false,
      onload: true,
      onerror: true,
    }
  };
}

function woffStyle(src) {
  const css = `
    @font-face {
      font-family: 'Pacifico';
      font-style: normal;
      font-weight: 400;
      src: local('Pacifico Regular'), local('Pacifico-Regular'), url('${src}') format('woff');
    }
    #woff-span {
      font-family: 'Pacifico';
      font-size: 30pt;
    }`;
  const attrs = {
    id: "woff-span",
    class: "standard-font",
  };
  return {
    metadata: {
      name: "style",
      attrs,
      src,
    },
    htmlContent: [{
      placeInTag: "head",
      name: "style",
      selfClose: false,
      content: css,
    }, {
      placeInTag: "body",
      name: "span",
      attrs,
      selfClose: false,
      content: "wwwwwwwwww",
    }]
  };
}

const mappings = {
  cssLink,
  imgTag,
  scriptTag,
  woffStyle,
};

function fromQuery(query) {
  const tagFactory = mappings[query.type];
  if (!tagFactory) {
    return render();
  }
  const tag = tagFactory(query.src);
  return render(tag);
}

module.exports = {
  fromQuery,
};
