'use strict';

// Functional fixtures need to inspect UI state. This adapter opens only the
// fixture shadow tree and extends fixture document queries; it does not alter
// isTrusted or production code. Security tests never load this adapter.
module.exports = function installUIDriver() {
    let root;
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
        const result = attach.call(this, this.id === 'slim-hl-ui' ? { ...options, mode: 'open' } : options);
        if (this.id === 'slim-hl-ui') root = result;
        return result;
    };
    const byId = document.getElementById.bind(document);
    const query = document.querySelector.bind(document);
    const all = document.querySelectorAll.bind(document);
    const active = Object.getOwnPropertyDescriptor(Document.prototype, 'activeElement').get;
    document.getElementById = id => byId(id) || root?.getElementById(id) || null;
    document.querySelector = selector => query(selector) || root?.querySelector(selector) || null;
    document.querySelectorAll = selector => [...all(selector), ...(root?.querySelectorAll(selector) || [])];
    Object.defineProperty(document, 'activeElement', { get: () => root?.activeElement || active.call(document) });
};
