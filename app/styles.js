(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["styles"],{

/***/ 5:
/*!******************************!*\
  !*** multi ./src/styles.css ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! C:\Users\fredo corleone\Documents\GitHub\web-app\src\styles.css */"OmL/");


/***/ }),

/***/ "JPst":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (useSourceMap) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item, useSourceMap);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join('');
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === 'string') {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, '']];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

function cssWithMappingToString(item, useSourceMap) {
  var content = item[1] || ''; // eslint-disable-next-line prefer-destructuring

  var cssMapping = item[3];

  if (!cssMapping) {
    return content;
  }

  if (useSourceMap && typeof btoa === 'function') {
    var sourceMapping = toComment(cssMapping);
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || '').concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
  }

  return [content].join('\n');
} // Adapted from convert-source-map (MIT)


function toComment(sourceMap) {
  // eslint-disable-next-line no-undef
  var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
  var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
  return "/*# ".concat(data, " */");
}

/***/ }),

/***/ "LboF":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : undefined;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && btoa) {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "OmL/":
/*!************************!*\
  !*** ./src/styles.css ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var api = __webpack_require__(/*! ../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "LboF");
            var content = __webpack_require__(/*! !../node_modules/css-loader/dist/cjs.js??ref--12-1!../node_modules/postcss-loader/src??embedded!./styles.css */ "W9N5");

            content = content.__esModule ? content.default : content;

            if (typeof content === 'string') {
              content = [[module.i, content, '']];
            }

var options = {};

options.insert = "head";
options.singleton = false;

var update = api(content, options);



module.exports = content.locals || {};

/***/ }),

/***/ "W9N5":
/*!*********************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js??ref--12-1!./node_modules/postcss-loader/src??embedded!./src/styles.css ***!
  \*********************************************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "JPst");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(true);
// Module
___CSS_LOADER_EXPORT___.push([module.i, "html {\r\n  transition: filter .2s ease-in-out;\r\n}\r\n\r\nhtml[theme=\"dark-mode\"] {\r\n  filter: invert(1) hue-rotate(180deg) contrast(0.9) saturate(0.6) brightness(0.8)\r\n}\r\n\r\nhtml[theme=\"dark-mode\"] img {\r\n  filter: invert(1) hue-rotate( 180deg);\r\n}\r\n\r\n.main {\r\n  min-height: calc(100vh - 128px);\r\n  margin-top: 64px;\r\n  animation: bg-from-white-to-transparent 3.5s;\r\n}\r\n\r\n.main > * {\r\n  animation: fade-in 350ms;\r\n}\r\n\r\n@keyframes bg-from-white-to-transparent {\r\n  from {\r\n    background-color: white;\r\n  }\r\n  to {\r\n    background-color: transparent;\r\n  }\r\n}\r\n\r\n@keyframes fade-in {\r\n  from {\r\n    opacity: 0;\r\n  }\r\n  to {\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\nlabel[for], input[type=\"checkbox\"] {\r\n  cursor: pointer;\r\n}\r\n\r\n.btn-skewed {\r\n  display: inline-block;\r\n  transform: skewX(-0.5rad);\r\n  border-radius: 8px !important;\r\n  padding-left: 20px;\r\n  padding-right: 20px;\r\n}\r\n\r\n.btn-skewed > a {\r\n  display: inline-block;\r\n  transform: skewX(0.5rad);\r\n  width: 100%;\r\n}\r\n\r\n.centerer {\r\n  display: flex;\r\n  justify-content: center;\r\n  align-items: center;\r\n}\r\n\r\n.bar-height {\r\n  height: 64px;\r\n}\r\n\r\n.taptarget-height {\r\n  height: 48px;\r\n}\r\n\r\n.rounded-alot {\r\n  border-radius: 1rem !important;\r\n}\r\n\r\n.rounded-alot-start {\r\n  border-radius: 1rem 0 0 1rem !important;\r\n}\r\n\r\n.rounded-alot-end {\r\n  border-radius: 0 1rem 1rem 0 !important;\r\n}\r\n\r\n.rounded-alot-top {\r\n  border-radius: 1rem 1rem 0 0 !important;\r\n}\r\n\r\n.rounded-alot-bottom {\r\n  border-radius: 0 0 1rem 1rem !important;\r\n}\r\n\r\n.btn-eboxprimary {\r\n  color: white;\r\n  background-image: linear-gradient(to bottom right, #afd0ff 12%, #ff00c5);\r\n  border-color: #afd0ff;\r\n  background-size: 133% 133%;\r\n  transition: all .5s;\r\n}\r\n\r\n.btn-eboxprimary:hover {\r\n  color: white;\r\n  border-color: #7990b0;\r\n  background-position: bottom right;\r\n}\r\n\r\n.btn-outline-eboxprimary {\r\n  color: #7990b0;\r\n  border-color: #7990b0;\r\n  background-image: linear-gradient(to bottom right, #fff 50%, #afd0ff 75%, #dc13af 100%);\r\n  background-size: 333% 333%;\r\n  transition: all .5s;\r\n}\r\n\r\n.btn-outline-eboxprimary:hover {\r\n  color: white;\r\n  border-color: #afd0ff;\r\n  background-position: bottom right;\r\n}\r\n\r\n.btn-eboxpulser {\r\n  animation: pulsing-shadow 2s infinite;\r\n}\r\n\r\n@keyframes pulsing-shadow {\r\n  0% {\r\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\r\n  }\r\n  70% {\r\n    box-shadow: 0 0 0 10px rgba(220, 19, 175, 0);\r\n  }\r\n  100% {\r\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\r\n  }\r\n}\r\n\r\n.bg-eboxprimary {\r\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\r\n}\r\n\r\n.text-eboxprimary {\r\n  line-height: 1.33333;\r\n  background-color: #afd0ff;\r\n  background-image: linear-gradient(to bottom right, #afd0ff, #dc13af);\r\n  background-size: 100%;\r\n  background-clip: text;\r\n  -webkit-background-clip: text;\r\n  -moz-background-clip: text;\r\n  -webkit-text-fill-color: transparent; \r\n  -moz-text-fill-color: transparent;\r\n}\r\n\r\n.bg-eboxdark {\r\n  background: linear-gradient(to bottom right, #2d2f31, #2b1a27);\r\n}\r\n\r\n.bg-lightalpha {\r\n  background-color: rgba(255, 255, 255, 0.9) !important;\r\n}\r\n\r\n.input-nostyle {\r\n  background-color: transparent;\r\n  border: none;\r\n  color: #fff;\r\n  min-width: 0;\r\n  outline: none;\r\n}\r\n\r\n.input-nostyle:disabled {\r\n  color: #B5B0B4;\r\n}\r\n\r\n.container-small {\r\n  max-width: 420px;\r\n  width: 100%;\r\n  margin: 0 auto;\r\n}\r\n\r\n.container-medium {\r\n  max-width: 840px;\r\n  width: 100%;\r\n  margin: 0 auto;\r\n}\r\n\r\n.mb-alot {\r\n  margin-bottom: 9rem;\r\n}\r\n\r\n.parallax {\r\n  background-attachment: fixed;\r\n  background-position: center;\r\n  background-repeat: no-repeat;\r\n  background-size: cover;\r\n}\r\n\r\n.bg-cover {\r\n  background-size: cover;\r\n  background-position: 50% 50%;\r\n}\r\n\r\n.highlight {\r\n  position: absolute;\r\n  z-index: -1;\r\n  width: calc(100% + 2px);\r\n  height: calc(100% + 2px);\r\n  top: -1px;\r\n  left: -1px;\r\n  background: linear-gradient(\r\n    to left,\r\n    #fec803 0%,\r\n    #afd0ff 21.35%,\r\n    #618fba 47.4%,\r\n    #7e75a1 65.1%,\r\n    #dc13af 80.21%,\r\n    #f61bd3 100%\r\n  );\r\n  background-size: 300% 100%;\r\n  filter: blur(8px);\r\n  border-radius: 1rem;\r\n  animation: animate-bg 3s infinite;\r\n}\r\n\r\n@keyframes animate-bg {\r\n  0% {\r\n    background-position: 100% 100%;\r\n  }\r\n  30% {\r\n    background-position: 20% 80%;\r\n  }\r\n  50% {\r\n    background-position: 40% 60%;\r\n  }\r\n  70% {\r\n    background-position: 60% 40%;\r\n  }\r\n  90% {\r\n    background-position: 80% 20%;\r\n  }\r\n  100% {\r\n    background-position: 100% 100%;\r\n  }\r\n}\r\n\r\n.bg-completed {\r\n  background: repeating-linear-gradient(\r\n    -55deg,\r\n    #3a3a3a,\r\n    #3a3a3a 10px,\r\n    #2f2f2f 10px,\r\n    #2f2f2f 20px\r\n  );\r\n}\r\n\r\n.bg-disabled {\r\n  background: repeating-linear-gradient(\r\n    -55deg,\r\n    #fff,\r\n    #fff 10px,\r\n    #f8f9fa 10px,\r\n    #f8f9fa 20px\r\n  );\r\n}\r\n\r\n.scale-on-hover:hover {\r\n  position: relative;\r\n  transform: scale(0.93);\r\n  transition: all 0.15s ease-out;\r\n}\r\n", "",{"version":3,"sources":["webpack://src/styles.css"],"names":[],"mappings":"AAAA;EACE,kCAAkC;AACpC;;AAEA;EACE;AACF;;AAEA;EACE,qCAAqC;AACvC;;AAEA;EACE,+BAA+B;EAC/B,gBAAgB;EAChB,4CAA4C;AAC9C;;AAEA;EACE,wBAAwB;AAC1B;;AAEA;EACE;IACE,uBAAuB;EACzB;EACA;IACE,6BAA6B;EAC/B;AACF;;AAEA;EACE;IACE,UAAU;EACZ;EACA;IACE,UAAU;EACZ;AACF;;AAEA;EACE,eAAe;AACjB;;AAEA;EACE,qBAAqB;EACrB,yBAAyB;EACzB,6BAA6B;EAC7B,kBAAkB;EAClB,mBAAmB;AACrB;;AAEA;EACE,qBAAqB;EACrB,wBAAwB;EACxB,WAAW;AACb;;AAEA;EACE,aAAa;EACb,uBAAuB;EACvB,mBAAmB;AACrB;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,8BAA8B;AAChC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,uCAAuC;AACzC;;AAEA;EACE,YAAY;EACZ,wEAAwE;EACxE,qBAAqB;EACrB,0BAA0B;EAC1B,mBAAmB;AACrB;;AAEA;EACE,YAAY;EACZ,qBAAqB;EACrB,iCAAiC;AACnC;;AAEA;EACE,cAAc;EACd,qBAAqB;EACrB,uFAAuF;EACvF,0BAA0B;EAC1B,mBAAmB;AACrB;;AAEA;EACE,YAAY;EACZ,qBAAqB;EACrB,iCAAiC;AACnC;;AAEA;EACE,qCAAqC;AACvC;;AAEA;EACE;IACE,2CAA2C;EAC7C;EACA;IACE,4CAA4C;EAC9C;EACA;IACE,2CAA2C;EAC7C;AACF;;AAEA;EACE,8DAA8D;AAChE;;AAEA;EACE,oBAAoB;EACpB,yBAAyB;EACzB,oEAAoE;EACpE,qBAAqB;EACrB,qBAAqB;EACrB,6BAA6B;EAC7B,0BAA0B;EAC1B,oCAAoC;EACpC,iCAAiC;AACnC;;AAEA;EACE,8DAA8D;AAChE;;AAEA;EACE,qDAAqD;AACvD;;AAEA;EACE,6BAA6B;EAC7B,YAAY;EACZ,WAAW;EACX,YAAY;EACZ,aAAa;AACf;;AAEA;EACE,cAAc;AAChB;;AAEA;EACE,gBAAgB;EAChB,WAAW;EACX,cAAc;AAChB;;AAEA;EACE,gBAAgB;EAChB,WAAW;EACX,cAAc;AAChB;;AAEA;EACE,mBAAmB;AACrB;;AAEA;EACE,4BAA4B;EAC5B,2BAA2B;EAC3B,4BAA4B;EAC5B,sBAAsB;AACxB;;AAEA;EACE,sBAAsB;EACtB,4BAA4B;AAC9B;;AAEA;EACE,kBAAkB;EAClB,WAAW;EACX,uBAAuB;EACvB,wBAAwB;EACxB,SAAS;EACT,UAAU;EACV;;;;;;;;GAAoK;EACpK,0BAA0B;EAC1B,iBAAiB;EACjB,mBAAmB;EACnB,iCAAiC;AACnC;;AAEA;EACE;IACE,8BAA8B;EAChC;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,4BAA4B;EAC9B;EACA;IACE,8BAA8B;EAChC;AACF;;AAEA;EACE;;;;;;GAA8H;AAChI;;AAEA;EACE;;;;;;GAAwH;AAC1H;;AAEA;EACE,kBAAkB;EAClB,sBAAsB;EACtB,8BAA8B;AAChC","sourcesContent":["html {\r\n  transition: filter .2s ease-in-out;\r\n}\r\n\r\nhtml[theme=\"dark-mode\"] {\r\n  filter: invert(1) hue-rotate(180deg) contrast(0.9) saturate(0.6) brightness(0.8)\r\n}\r\n\r\nhtml[theme=\"dark-mode\"] img {\r\n  filter: invert(1) hue-rotate( 180deg);\r\n}\r\n\r\n.main {\r\n  min-height: calc(100vh - 128px);\r\n  margin-top: 64px;\r\n  animation: bg-from-white-to-transparent 3.5s;\r\n}\r\n\r\n.main > * {\r\n  animation: fade-in 350ms;\r\n}\r\n\r\n@keyframes bg-from-white-to-transparent {\r\n  from {\r\n    background-color: white;\r\n  }\r\n  to {\r\n    background-color: transparent;\r\n  }\r\n}\r\n\r\n@keyframes fade-in {\r\n  from {\r\n    opacity: 0;\r\n  }\r\n  to {\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\nlabel[for], input[type=\"checkbox\"] {\r\n  cursor: pointer;\r\n}\r\n\r\n.btn-skewed {\r\n  display: inline-block;\r\n  transform: skewX(-0.5rad);\r\n  border-radius: 8px !important;\r\n  padding-left: 20px;\r\n  padding-right: 20px;\r\n}\r\n\r\n.btn-skewed > a {\r\n  display: inline-block;\r\n  transform: skewX(0.5rad);\r\n  width: 100%;\r\n}\r\n\r\n.centerer {\r\n  display: flex;\r\n  justify-content: center;\r\n  align-items: center;\r\n}\r\n\r\n.bar-height {\r\n  height: 64px;\r\n}\r\n\r\n.taptarget-height {\r\n  height: 48px;\r\n}\r\n\r\n.rounded-alot {\r\n  border-radius: 1rem !important;\r\n}\r\n\r\n.rounded-alot-start {\r\n  border-radius: 1rem 0 0 1rem !important;\r\n}\r\n\r\n.rounded-alot-end {\r\n  border-radius: 0 1rem 1rem 0 !important;\r\n}\r\n\r\n.rounded-alot-top {\r\n  border-radius: 1rem 1rem 0 0 !important;\r\n}\r\n\r\n.rounded-alot-bottom {\r\n  border-radius: 0 0 1rem 1rem !important;\r\n}\r\n\r\n.btn-eboxprimary {\r\n  color: white;\r\n  background-image: linear-gradient(to bottom right, #afd0ff 12%, #ff00c5);\r\n  border-color: #afd0ff;\r\n  background-size: 133% 133%;\r\n  transition: all .5s;\r\n}\r\n\r\n.btn-eboxprimary:hover {\r\n  color: white;\r\n  border-color: #7990b0;\r\n  background-position: bottom right;\r\n}\r\n\r\n.btn-outline-eboxprimary {\r\n  color: #7990b0;\r\n  border-color: #7990b0;\r\n  background-image: linear-gradient(to bottom right, #fff 50%, #afd0ff 75%, #dc13af 100%);\r\n  background-size: 333% 333%;\r\n  transition: all .5s;\r\n}\r\n\r\n.btn-outline-eboxprimary:hover {\r\n  color: white;\r\n  border-color: #afd0ff;\r\n  background-position: bottom right;\r\n}\r\n\r\n.btn-eboxpulser {\r\n  animation: pulsing-shadow 2s infinite;\r\n}\r\n\r\n@keyframes pulsing-shadow {\r\n  0% {\r\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\r\n  }\r\n  70% {\r\n    box-shadow: 0 0 0 10px rgba(220, 19, 175, 0);\r\n  }\r\n  100% {\r\n    box-shadow: 0 0 0 0 rgba(220, 19, 175, 0.7);\r\n  }\r\n}\r\n\r\n.bg-eboxprimary {\r\n  background: linear-gradient(to bottom right, #afd0ff, #dc13af);\r\n}\r\n\r\n.text-eboxprimary {\r\n  line-height: 1.33333;\r\n  background-color: #afd0ff;\r\n  background-image: linear-gradient(to bottom right, #afd0ff, #dc13af);\r\n  background-size: 100%;\r\n  background-clip: text;\r\n  -webkit-background-clip: text;\r\n  -moz-background-clip: text;\r\n  -webkit-text-fill-color: transparent; \r\n  -moz-text-fill-color: transparent;\r\n}\r\n\r\n.bg-eboxdark {\r\n  background: linear-gradient(to bottom right, #2d2f31, #2b1a27);\r\n}\r\n\r\n.bg-lightalpha {\r\n  background-color: rgba(255, 255, 255, 0.9) !important;\r\n}\r\n\r\n.input-nostyle {\r\n  background-color: transparent;\r\n  border: none;\r\n  color: #fff;\r\n  min-width: 0;\r\n  outline: none;\r\n}\r\n\r\n.input-nostyle:disabled {\r\n  color: #B5B0B4;\r\n}\r\n\r\n.container-small {\r\n  max-width: 420px;\r\n  width: 100%;\r\n  margin: 0 auto;\r\n}\r\n\r\n.container-medium {\r\n  max-width: 840px;\r\n  width: 100%;\r\n  margin: 0 auto;\r\n}\r\n\r\n.mb-alot {\r\n  margin-bottom: 9rem;\r\n}\r\n\r\n.parallax {\r\n  background-attachment: fixed;\r\n  background-position: center;\r\n  background-repeat: no-repeat;\r\n  background-size: cover;\r\n}\r\n\r\n.bg-cover {\r\n  background-size: cover;\r\n  background-position: 50% 50%;\r\n}\r\n\r\n.highlight {\r\n  position: absolute;\r\n  z-index: -1;\r\n  width: calc(100% + 2px);\r\n  height: calc(100% + 2px);\r\n  top: -1px;\r\n  left: -1px;\r\n  background: linear-gradient(\r\n    to left,\r\n    #fec803 0%,\r\n    #afd0ff 21.35%,\r\n    #618fba 47.4%,\r\n    #7e75a1 65.1%,\r\n    #dc13af 80.21%,\r\n    #f61bd3 100%\r\n  );\r\n  background-size: 300% 100%;\r\n  filter: blur(8px);\r\n  border-radius: 1rem;\r\n  animation: animate-bg 3s infinite;\r\n}\r\n\r\n@keyframes animate-bg {\r\n  0% {\r\n    background-position: 100% 100%;\r\n  }\r\n  30% {\r\n    background-position: 20% 80%;\r\n  }\r\n  50% {\r\n    background-position: 40% 60%;\r\n  }\r\n  70% {\r\n    background-position: 60% 40%;\r\n  }\r\n  90% {\r\n    background-position: 80% 20%;\r\n  }\r\n  100% {\r\n    background-position: 100% 100%;\r\n  }\r\n}\r\n\r\n.bg-completed {\r\n  background: repeating-linear-gradient(\r\n    -55deg,\r\n    #3a3a3a,\r\n    #3a3a3a 10px,\r\n    #2f2f2f 10px,\r\n    #2f2f2f 20px\r\n  );\r\n}\r\n\r\n.bg-disabled {\r\n  background: repeating-linear-gradient(\r\n    -55deg,\r\n    #fff,\r\n    #fff 10px,\r\n    #f8f9fa 10px,\r\n    #f8f9fa 20px\r\n  );\r\n}\r\n\r\n.scale-on-hover:hover {\r\n  position: relative;\r\n  transform: scale(0.93);\r\n  transition: all 0.15s ease-out;\r\n}\r\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ __webpack_exports__["default"] = (___CSS_LOADER_EXPORT___);


/***/ })

},[[5,"runtime"]]]);
//# sourceMappingURL=styles.js.map