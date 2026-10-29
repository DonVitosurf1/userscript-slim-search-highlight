// UI data stays in the isolated userscript realm and its closed shadow tree.
const attachPrivateShadow = Element.prototype.attachShadow;
let privateUIRoot = null;
function ensureUIRoot() {
    if (privateUIRoot) return privateUIRoot;
    const host = document.createElement('div'); host.id = 'slim-hl-ui';
    host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646;';
    privateUIRoot = attachPrivateShadow.call(host, { mode: 'closed' });
    const style = document.createElement('style'); style.textContent = UI_CSS;
    privateUIRoot.append(style);
    for (const type of ['click', 'auxclick', 'submit', 'keydown', 'pointerdown', 'pointerup', 'pointercancel']) {
        privateUIRoot.addEventListener(type, event => {
            if (event.isTrusted) return;
            event.preventDefault(); event.stopImmediatePropagation();
        }, true);
    }
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click', 'keydown', 'input', 'change', 'submit']) {
        privateUIRoot.addEventListener(type, event => {
            if (type === 'keydown' && handlePanelShortcut(event)) { event.stopPropagation(); return; }
            if (type === 'keydown' && event.key === 'Escape' && event.target.closest?.('#slim-selection-tools')) {
                hideSelectionTools(true); event.preventDefault();
            }
            event.stopPropagation();
        });
    }
    document.documentElement.append(host);
    return privateUIRoot;
}
const uiById = id => privateUIRoot?.getElementById(id) || null;
const uiQueryAll = selector => privateUIRoot?.querySelectorAll(selector) || [];
const uiActiveElement = () => privateUIRoot?.activeElement || document.activeElement;
