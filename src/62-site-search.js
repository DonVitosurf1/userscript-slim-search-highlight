// Site queries are opt-in for an exact origin. No query is added to keyword/history storage.
const SITE_SEARCH_REGISTRY_KEY = 'hl_site_search_origins';
const SITE_SEARCH_HANDOFF_KEY = 'hl_site_search_handoffs';
const SITE_SEARCH_TTL = 5 * 60 * 1000;
const SITE_SEARCH_KEYS = ['q', 'query', 'search', 's', 'search_query', 'term', 'terms', 'keyword', 'keywords', 'searchTerm', 'searchterm', 'searchtext', 'search_text'];
let submittedSiteSearch = null;

function siteSearchOrigin(value = location.href) {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.origin : '';
    } catch { return ''; }
}

function siteSearchDestination(value) {
    const target = searchDestination(value);
    return target.length <= 8192 ? target : '';
}

function readSiteSearchRegistry() {
    const data = GM_getValue(SITE_SEARCH_REGISTRY_KEY, null);
    if (data == null) return { version: 1, origins: [] };
    if (data.version !== 1 || !Array.isArray(data.origins) || data.origins.length > 128
        || !data.origins.every(entry => entry && typeof entry.origin === 'string' && entry.origin.length > 0 && entry.origin.length <= 512
            && siteSearchOrigin(entry.origin) === entry.origin
            && typeof entry.generation === 'string' && entry.generation.length <= 100)) throw Error('Unknown site-search registry');
    return data;
}

function siteSearchPreference() {
    const origin = siteSearchOrigin();
    if (!origin) return null;
    try { return readSiteSearchRegistry().origins.find(entry => entry.origin === origin) || null; }
    catch { return null; }
}

function siteSearchEnabled() { return !!siteSearchPreference(); }

function refreshSiteSearchContext() {
    automaticTermsSnapshot = null;
    restartHighlights();
    // Watching must begin even when an opted-in SPA has not searched yet.
    watchPageIdentity();
}

function setSiteSearchEnabled(value) {
    const origin = siteSearchOrigin();
    if (!origin) return false;
    try {
        const registry = readSiteSearchRegistry();
        const current = registry.origins.find(entry => entry.origin === origin);
        if (!!current === !!value) return true;
        const origins = registry.origins.filter(entry => entry.origin !== origin);
        if (value) {
            if (origins.length >= 128) throw Error('Site-search registry is full');
            // New generations prevent a previous opt-in's handoffs from returning after revocation.
            origins.push({ origin, generation: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) });
        }
        GM_setValue(SITE_SEARCH_REGISTRY_KEY, { version: 1, origins });
    } catch { setPanelStatus('siteSearchSaveFailed'); return false; }
    submittedSiteSearch = null;
    refreshSiteSearchContext();
    return true;
}

function siteSearchTerms(value) {
    return splitSearchTerms(String(value).slice(0, 4096)).filter(term => term.length <= 256).slice(0, 64);
}

function siteSearchURLContext(value) {
    try {
        const url = new URL(value);
        for (const key of SITE_SEARCH_KEYS) {
            if (url.searchParams.has(key)) return { terms: siteSearchTerms(url.searchParams.get(key) || '') };
        }
    } catch {}
    return null;
}

function readSiteSearchHandoffs() {
    const data = GM_getValue(SITE_SEARCH_HANDOFF_KEY, null);
    if (data == null) return [];
    if (data.version !== 1 || !Array.isArray(data.entries)) throw Error('Unknown site-search handoffs');
    return data.entries.slice(0, 48).filter(entry => {
        const age = Date.now() - entry?.timestamp;
        return Number.isFinite(entry?.timestamp) && age >= 0 && age < SITE_SEARCH_TTL
            && typeof entry.origin === 'string' && entry.origin.length > 0 && entry.origin.length <= 512
            && typeof entry.target === 'string' && entry.target.length <= 8192
            && siteSearchOrigin(entry.origin) === entry.origin && siteSearchOrigin(entry.target) === entry.origin
            && typeof entry.generation === 'string' && entry.generation.length <= 100
            && Array.isArray(entry.terms) && entry.terms.length <= 64
            && entry.terms.every(term => typeof term === 'string' && term.length > 1 && term.length <= 256)
            && entry.terms.join(' ').length <= 4096
            && (!entry.query || (typeof entry.query.name === 'string' && entry.query.name.length > 0
                && entry.query.name.length <= 128 && typeof entry.query.value === 'string' && entry.query.value.length <= 4096));
    }).slice(0, 12);
}

function getSiteSearchContext() {
    if (!autoSearch) return null;
    const preference = siteSearchPreference();
    if (!preference) { submittedSiteSearch = null; return null; }
    if (submittedSiteSearch?.url === location.href && submittedSiteSearch.generation === preference.generation) {
        return { terms: [...submittedSiteSearch.terms] };
    }
    submittedSiteSearch = null;
    // Presence matters: an explicitly empty query overrides any earlier handoff.
    const fromURL = siteSearchURLContext(location.href);
    if (fromURL) return fromURL;
    try {
        const target = siteSearchDestination(location.href);
        const currentURL = new URL(location.href);
        const entries = readSiteSearchHandoffs().filter(entry => entry.origin === preference.origin
            && entry.generation === preference.generation);
        const entry = entries.find(entry => !entry.query && entry.target === target) || entries.find(entry => entry.query
            && new URL(entry.target).pathname === currentURL.pathname
            && currentURL.searchParams.get(entry.query.name) === entry.query.value);
        return entry ? { terms: [...entry.terms] } : null;
    } catch { return null; }
}

function storeSiteSearchHandoff(target, terms, preference, query = null) {
    if (!target || siteSearchOrigin(target) !== preference.origin) return;
    try {
        const entries = readSiteSearchHandoffs().filter(entry => entry.target !== target || entry.origin !== preference.origin
            || JSON.stringify(entry.query || null) !== JSON.stringify(query));
        if (terms.length) entries.unshift({ origin: preference.origin, generation: preference.generation,
            target, terms: [...terms], timestamp: Date.now(), ...(query ? { query } : {}) });
        GM_setValue(SITE_SEARCH_HANDOFF_KEY, { version: 1, entries: entries.slice(0, 12) });
    } catch { setPanelStatus('siteSearchTransferFailed'); }
}

function captureSiteSearchNavigation(event) {
    if (!event.isTrusted || !enabled || !autoSearch || isBlacklisted()) return;
    if (!['click', 'auxclick', 'contextmenu'].includes(event.type)
        || (event.type === 'click' && event.button !== 0) || (event.type === 'auxclick' && event.button !== 1)) return;
    const preference = siteSearchPreference();
    if (!preference) return;
    const link = event.target?.closest?.('a[href]');
    if (!link || isOwnNode(link) || link.closest(OWN_UI) || link.hasAttribute('download')) return;
    const target = siteSearchDestination(link.href);
    if (!target || siteSearchOrigin(target) !== preference.origin) return;
    const context = getSiteSearchContext();
    if (context) storeSiteSearchHandoff(target, context.terms, preference);
}

// requestSubmit() emits isTrusted submit events too; require a preceding user submit gesture.
const siteSubmitActivations = new WeakMap();
function recordSiteSearchActivation(event) {
    if (!event.isTrusted || !enabled || !autoSearch || isBlacklisted()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (event.type === 'input') { if (target.form) siteSubmitActivations.delete(target.form); return; }
    if (event.isComposing || event.repeat) return;
    const button = target.closest('button, input[type="submit"], input[type="image"]');
    const submitButton = button && ['submit', 'image'].includes(button.type) ? button : null;
    let form = null;
    if (event.type === 'pointerdown' && event.button === 0 && submitButton) form = submitButton.form;
    if (event.type === 'keydown' && (event.key === 'Enter' || (event.key === ' ' && submitButton))) {
        form = submitButton?.form || (target instanceof HTMLInputElement ? target.form : null);
    }
    const preference = form && siteSearchPreference();
    if (preference) siteSubmitActivations.set(form, { time: Date.now(), url: location.href, generation: preference.generation });
}

function captureSiteSearchSubmit(event) {
    if (!event.isTrusted || event.type !== 'submit' || !enabled || !autoSearch || isBlacklisted()) return;
    const preference = siteSearchPreference();
    const form = event.target;
    if (!preference || !(form instanceof HTMLFormElement) || isOwnNode(form) || form.closest(OWN_UI)
        || [...form.elements].some(control => control instanceof HTMLInputElement && control.type === 'password')) return;
    const intent = siteSubmitActivations.get(form);
    siteSubmitActivations.delete(form);
    if (!intent || intent.generation !== preference.generation || intent.url !== location.href || Date.now() - intent.time < 0 || Date.now() - intent.time > 2000) return;
    const submitter = event.submitter;
    const action = siteSearchDestination(submitter?.hasAttribute('formaction') ? submitter.formAction : form.action);
    if (!action || siteSearchOrigin(action) !== preference.origin) return;
    // Only actual search controls are read, and only following native confirmed submission.
    const controls = [...form.elements].filter(control => control instanceof HTMLInputElement
        && ['search', 'text'].includes(control.type) && !control.disabled
        && !control.closest('[contenteditable]') && control.getClientRects().length
        && (control.type === 'search' || SITE_SEARCH_KEYS.includes(control.name)));
    if (controls.length !== 1) return;
    const input = controls[0];
    const terms = siteSearchTerms(input.value);
    submittedSiteSearch = { url: location.href, generation: preference.generation, terms };
    // POST/AJAX searches can keep their URL; exact action matching also covers normal POST results.
    const method = submitter?.hasAttribute('formmethod') ? submitter.formMethod : form.method;
    const query = method === 'get' && input.name && input.name.length <= 128 && input.value.length <= 4096
        ? { name: input.name, value: input.value } : null;
    // A GET form may carry hidden routing fields. Match only its confirmed query on the exact
    // action path; unrelated field values are never read or copied into storage.
    storeSiteSearchHandoff(action, terms, preference, query);
    // MediaWiki can redirect a submitted search directly to a title, removing the query entirely.
    // Only Wikipedia's known same-origin /w/index.php -> /wiki/Title route is inferred.
    const actionURL = new URL(action);
    if (domainMatches(actionURL.hostname, 'wikipedia.org') && actionURL.pathname === '/w/index.php'
        && input.name === 'search' && input.value.length <= 4096 && input.value.trim()) {
        const title = input.value.trim().replace(/ /g, '_');
        const canonical = title[0].toUpperCase() + title.slice(1);
        const target = new URL('/wiki/' + encodeURIComponent(canonical).replace(/%2F/gi, '/'), actionURL.origin);
        storeSiteSearchHandoff(siteSearchDestination(target.href), terms, preference);
    }
    refreshSiteSearchContext();
}
