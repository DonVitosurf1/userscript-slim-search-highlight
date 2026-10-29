// Page passages stay separate from global keywords; only explicitly saved records enter GM storage.
let pageTerms = [];
let pageMatches = [];
let pageIdentity = location.href;
let pageTextDirty = false;
let pageURLTimer = null;
let knownSavedPages = false;
let selectionSnapshot = null;
let selectionTimer;
let recordingShortcut = false;
const DEFAULT_SHORTCUT = { key: 'h', alt: true, ctrl: false, shift: true, meta: false };
const storedShortcut = GM_getValue('hl_selection_shortcut', DEFAULT_SHORTCUT);
let selectionShortcut = storedShortcut === null ? null : validShortcut(storedShortcut) ? storedShortcut : { ...DEFAULT_SHORTCUT };

let pageOptions = { wholeWords: false, articleOnly: false };
let pageUndo = [];
let pageCounts = new Map();
let pageSearchGeneration = 0;
let pageSearchBusy = false;
let nextPageTermId = 1;
let copyFormat = GM_getValue('hl_copy_format', 'plain') === 'markdown' ? 'markdown' : 'plain';
const pagePaintNames = new Set();

function newPageId() {
    let id;
    do { id = 'p' + nextPageTermId++; } while (pageTerms.some(term => term.id === id));
    return id;
}
function readSavedPages() {
    const data = GM_getValue('hl_page_annotations', { version: 1, pages: {} });
    const valid = data && data.version === 1 && data.pages && typeof data.pages === 'object' && !Array.isArray(data.pages);
    knownSavedPages = !!valid && Object.keys(data.pages).length > 0;
    return valid ? data : null;
}
function restorePageRecord() {
    const record = readSavedPages()?.pages[location.href];
    pageTerms = [];
    pageOptions = { wholeWords: !!record?.options?.wholeWords, articleOnly: !!record?.options?.articleOnly };
    if (Array.isArray(record?.terms)) {
        for (const item of record.terms) {
            if (!item || typeof item.text !== 'string') continue;
            const text = normalizePassage(item.text);
            if (!text || pageTerms.some(term => term.text.toLowerCase() === text.toLowerCase())) continue;
            const id = typeof item.id === 'string' && /^[a-z0-9-]{1,64}$/i.test(item.id) && !pageTerms.some(term => term.id === item.id) ? item.id : newPageId();
            pageTerms.push({ id, text, color: /^#[0-9a-f]{6}$/i.test(item.color || '') ? item.color : DEFAULT_COLOR, saved: true, anchor: { exact: text, prefix: String(item.anchor?.prefix || '').slice(-80), suffix: String(item.anchor?.suffix || '').slice(0, 80) } });
        }
    }
    watchPageIdentity();
}
function savePageRecord(force = false) {
    if (pageIdentity !== location.href) return false;
    const terms = pageTerms.filter(term => term.saved).map(term => ({ id: term.id, text: term.text, color: term.color, anchor: term.anchor || { exact: term.text, prefix: '', suffix: '' } }));
    if (!terms.length && !force) return true;
    try {
        const data = readSavedPages();
        if (!data) { setPanelStatus('storageUnsupported'); return false; }
        if (terms.length) data.pages[pageIdentity] = { title: document.title.replace(titlePrefix || '', ''), options: { ...pageOptions }, terms };
        else delete data.pages[pageIdentity];
        const previous = GM_getValue('hl_page_annotations', null);
        if (JSON.stringify(previous) !== JSON.stringify(data)) GM_setValue('hl_page_annotations', data);
        knownSavedPages = Object.keys(data.pages).length > 0;
        return true;
    } catch { setPanelStatus('pageSaveFailed'); return false; }
}
function rememberPageChange() {
    pageUndo.push(JSON.parse(JSON.stringify({ terms: pageTerms, options: pageOptions })));
    if (pageUndo.length > 20) pageUndo.shift();
}
function undoPageChange() {
    if (!ensurePageIdentity()) return;
    const previous = pageUndo.pop();
    if (!previous) return;
    const current = { terms: pageTerms, options: pageOptions };
    pageTerms = previous.terms; pageOptions = previous.options; currentIdx = -1;
    if (!savePageRecord(current.terms.some(term => term.saved))) { pageTerms = current.terms; pageOptions = current.options; pageUndo.push(previous); return; } watchPageIdentity(); refreshPageResults(); setPanelStatus('pageUndone');
    uiById('page-heading')?.focus({ preventScroll: true });
}
function watchPageIdentity() {
    if (!pageTerms.length && !knownSavedPages && pageURLTimer) { clearInterval(pageURLTimer); pageURLTimer = null; }
    if ((pageTerms.length || knownSavedPages) && !pageURLTimer) pageURLTimer = setInterval(() => {
        if (pageIdentity !== location.href) { resetPageIdentity(); refreshPageResults(); }
    }, 250);
}
function ensurePageIdentity() {
    if (pageIdentity === location.href) return true;
    resetPageIdentity(); refreshPageResults(); return false;
}
function searchRoot() {
    if (!pageOptions.articleOnly) return document.body;
    return document.querySelector('article') || document.querySelector('main, [role="main"]');
}
function renderSearchState() {
    const panel = uiById('page-list');
    panel?.setAttribute('aria-busy', String(pageSearchBusy));
    const state = uiById('page-search-status');
    if (state) state.textContent = pageSearchBusy ? t('searching') : pageOptions.articleOnly && !searchRoot() ? t('articleMissing') : '';
    const whole = uiById('page-whole'); if (whole) whole.checked = pageOptions.wholeWords;
    const scope = uiById('page-scope'); if (scope) scope.value = pageOptions.articleOnly ? 'article' : 'all';
}

function validShortcut(value) {
    return value && /^[a-z0-9]$/i.test(value.key || '') && (value.alt || value.ctrl || value.meta);
}

const normalizePassage = text => String(text).replace(/\s+/g, ' ').trim();
const supportsPageHighlights = () => !!globalThis.CSS?.highlights && typeof globalThis.Highlight === 'function';
const navigationMatches = () => pageTerms.length ? pageMatches : document.getElementsByClassName('slim-hl');
const matchText = match => match.range ? match.text : match.textContent;
const matchColor = match => match.range ? match.color || DEFAULT_COLOR : match.style.backgroundColor || DEFAULT_COLOR;
const matchRect = match => (match.range || match).getBoundingClientRect();

function clearPagePaint(cancel = true) {
    if (cancel) { pageSearchGeneration++; pageSearchBusy = false; }
    globalThis.CSS?.highlights?.delete('slim-page');
    globalThis.CSS?.highlights?.delete('slim-page-current');
    for (const name of pagePaintNames) globalThis.CSS?.highlights?.delete(name);
    pagePaintNames.clear(); pageMatches = []; pageCounts = new Map();
    document.getElementById('slim-page-colors')?.remove();
}
function resetPageIdentity() {
    if (pageIdentity === location.href) return;
    pageIdentity = location.href; pageUndo = []; clearPagePaint(); hideSelectionTools(); currentIdx = -1;
    restorePageRecord();
}
