"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._checkUserAgent = void 0;
function _checkUserAgent(ua) {
    const userAgent = ua.replace(/\u03b1/, 'alpha').replace(/\u03b2/, 'beta');
    return userAgent;
}
exports._checkUserAgent = _checkUserAgent;
;