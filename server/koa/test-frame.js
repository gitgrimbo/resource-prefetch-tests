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

const template = loadTemplate();

function makeTemplateData(tag) {
  return {
    tag,
    placeInTag: tag.placeInTag,
    html: function() {
      let attrs = Object.assign({}, tag.attrs);
      if (tag.onload) {
        attrs.onerror = "resourceOnError(event)";
      }
      if (tag.onerror) {
        attrs.onload = "resourceOnLoad(event)";
      }
      return tagHtml(tag.name, attrs, tag.selfClose, tag.content);
    },
  };
}

function render(tagOrTags) {
  const tags = tagOrTags ? (Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags]) : null;
  const view = tags ? tags.map(makeTemplateData) : [];
  return ejs.render(/*template*/loadTemplate(), { view }, {
    debug: true
  });
}

function cssLink(src) {
  return {
    placeInTag: "head",
    name: "link",
    attrs: {
      type: "text/css",
      rel: "stylesheet",
      href: src,
    },
    selfClose: true,
    onload: true,
    onerror: true,
  };
}

function imgTag(src) {
  return {
    placeInTag: "body",
    name: "img",
    attrs: {
      src: src,
    },
    selfClose: true,
    onload: true,
    onerror: true,
  };
}

function scriptTag(src) {
  return {
    placeInTag: "head",
    name: "script",
    attrs: {
      type: "text/javascript",
      src: src,
    },
    selfClose: false,
    onload: true,
    onerror: true,
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
  return [{
    placeInTag: "head",
    name: "style",
    selfClose: false,
    content: css,
  }, {
    placeInTag: "body",
    name: "span",
    attrs: {
      id: "woff-span",
      class: "standard-font",
    },
    selfClose: false,
    content: "wwwwwwwwww",
  }];
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
