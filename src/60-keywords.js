const PERSISTED = {
    hl_keywords: () => keywords,
    hl_enabled: () => enabled,
    hl_auto_search: () => autoSearch,
    hl_panel_pos: () => panelPos,
    hl_panel_state: () => panelState,
    hl_search_history: () => searchHistory.slice(0, 8),
    hl_blacklist: () => blacklist,
    hl_search_engine: () => searchEngine,
    hl_show_posbar: () => showPosBar,
    hl_lang: () => lang,
    hl_selection_shortcut: () => selectionShortcut,
    hl_copy_format: () => copyFormat,
    hl_ui_theme: () => uiTheme,
    hl_launcher_size: () => launcherSize,
    hl_launcher_position: () => launcherPosition,
    hl_launcher_inset: () => launcherInset
};
const lastSaved = {};
for (const key in PERSISTED) lastSaved[key] = JSON.stringify(PERSISTED[key]());

/** Schreibt nur Werte, die dieser Tab geändert hat; andere Tabs behalten ihre Änderungen. */
function save() {
    for (const key in PERSISTED) {
        const value = PERSISTED[key]();
        const json = JSON.stringify(value);
        if (json === lastSaved[key]) continue;
        GM_setValue(key, value);
        lastSaved[key] = json;
    }
}

function isBlacklisted() {
    const host = location.hostname.toLowerCase();
    return blacklist.some(b => host.includes(b.toLowerCase()));
}

function isSearchEngine(urlStr) {
    if (!urlStr) return false;
    try {
        const host = '.' + new URL(urlStr).hostname.toLowerCase() + '.';
        return SEARCH_ENGINES.some(s => host.includes('.' + s));
    } catch { return false; }
}

function extractQuery(urlStr) {
    try {
        const url = new URL(urlStr);
        for (const p of ['q', 'query', 'p', 'wd', 'text', 'search']) {
            const val = url.searchParams.get(p);
            if (val) return val;
        }
    } catch {}
    return '';
}

function splitSearchTerms(q) {
    return q.split(/\s+/).filter(w => w.length > 1 && !IGNORE_WORDS.has(w.toLowerCase()));
}

function getSearchTerms() {
    const url = new URL(location.href);
    // A submitted URL query wins over an unfinished edit in the search box.
    const hasQuery = ['q', 'query', 'p', 'wd', 'text', 'search'].some(key => url.searchParams.has(key));
    const q = hasQuery ? extractQuery(url.href) : document.querySelector('textarea[name="q"], input[name="q"], input[name="query"]')?.value || '';
    return splitSearchTerms(q);
}

function updateCrossPageTerms() {
    if (!autoSearch || !isSearchEngine(location.href)) return [];
    const terms = getSearchTerms();
    try {
        GM_setValue('hl_cross_terms', { terms, timestamp: Date.now(), source: location.origin });
        const joined = terms.join(' ');
        if (joined && !searchHistory.includes(joined)) {
            searchHistory.unshift(joined);
            searchHistory = searchHistory.slice(0, 8);
            save();
        }
    } catch { setPanelStatus('searchTransferFailed'); }
    return terms;
}

function searchDestination(value) {
    try {
        const url = new URL(value, location.href);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        url.hash = '';
        return url.href;
    } catch { return ''; }
}

function freshSearchRecord(record) {
    const age = Date.now() - record?.timestamp;
    return Number.isFinite(record?.timestamp) && age >= 0 && age < CROSS_TTL
        && Array.isArray(record.terms) && record.terms.every(term => typeof term === 'string');
}

function readSearchHandoffs() {
    const data = GM_getValue('hl_search_handoffs', null);
    return data?.version === 1 && Array.isArray(data.entries)
        ? data.entries.filter(entry => freshSearchRecord(entry) && typeof entry.target === 'string') : [];
}

function captureSearchNavigation(event) {
    if (!autoSearch || !isSearchEngine(location.href)) return;
    if (event.type === 'auxclick' && event.button !== 1) return;
    if (event.type === 'click' && event.button !== 0) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.closest(OWN_UI)) return;
    let target = searchDestination(link.href);
    if (!target) return;
    // Google's /url wrapper may carry the actual destination in either parameter.
    const wrapped = new URL(target);
    if (isSearchEngine(target) && wrapped.pathname === '/url') {
        target = searchDestination(wrapped.searchParams.get('url') || wrapped.searchParams.get('q') || '');
    }
    if (!target || isSearchEngine(target)) return;
    const terms = updateCrossPageTerms();
    try {
        const data = GM_getValue('hl_search_handoffs', null);
        if (data != null && (data.version !== 1 || !Array.isArray(data.entries))) throw Error('Unknown handoff format');
        const entries = readSearchHandoffs().filter(entry => entry.target !== target);
        if (terms.length) entries.unshift({ target, source: location.origin, terms, timestamp: Date.now() });
        GM_setValue('hl_search_handoffs', { version: 1, entries: entries.slice(0, 12) });
    } catch { setPanelStatus('searchTransferFailed'); }
}

function automaticSearchTerms() {
    if (isSearchEngine(location.href)) return getSearchTerms();
    try {
        const handoff = readSearchHandoffs().find(entry => entry.target === searchDestination(location.href));
        if (handoff) return handoff.terms;
        const fromSearch = isSearchEngine(document.referrer);
        if (fromSearch) {
            const query = extractQuery(document.referrer);
            if (query) return splitSearchTerms(query);
        }
        const stored = GM_getValue('hl_cross_terms', null);
        if (freshSearchRecord(stored) && (!stored.source || (fromSearch && new URL(document.referrer).origin === stored.source))) return stored.terms;
    } catch { /* Storage may be unavailable; permanent keywords must still work. */ }
    return [];
}

let manualTerms = [];

function getCrossPageTerms() {
    const result = [];
    const m = location.hash.match(/[#&](?:sjhl|hl)=([^&]+)/i);
    if (m) {
        try { decodeURIComponent(m[1]).split(/[,+]/).forEach(t => t.trim() && result.push(t.trim())); } catch {}
    }

    result.push(...manualTerms);
    if (autoSearch) result.push(...automaticSearchTerms());
    return [...new Set(result)];
}

function getActiveKeywords() {
    const host = location.hostname.toLowerCase();
    const list = keywords.filter(k => {
        if (!k.domains || k.domains.length === 0) return true;
        return k.domains.some(d => host.includes(d.toLowerCase()));
    }).map(k => ({ ...k }));

    getCrossPageTerms().forEach((t, i) => {
        if (!IGNORE_WORDS.has(t.toLowerCase()) && !list.some(k => k.text.toLowerCase() === t.toLowerCase())) {
            list.push({ text: t, color: AUTO_COLORS[i % AUTO_COLORS.length], wholeWord: true, auto: true });
        }
    });
    return list;
}

function isRegexText(text) { return text.startsWith('/') && text.lastIndexOf('/') > 0; }

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function buildMatchers() {
    lastErrors = [];
    return getActiveKeywords().map(k => {
        let pattern, flags = 'gi';
        if (isRegexText(k.text)) {
            const last = k.text.lastIndexOf('/');
            pattern = k.text.slice(1, last);
            flags = k.text.slice(last + 1) || 'gi';
            if (!flags.includes('g')) flags += 'g';
        } else {
            const escaped = escapeRegExp(k.text);
            if (k.wholeWord !== false && !k.text.includes(' ')) {
                // \b kennt nur ASCII; Umlaute und Zeichen wie + oder # brauchen Unicode-Lookarounds.
                pattern = '(?<![\\p{L}\\p{N}_])' + escaped + '(?![\\p{L}\\p{N}_])';
                flags = 'giu';
            } else {
                pattern = escaped;
            }
        }
        try {
            return { re: new RegExp(pattern, flags), color: k.color || DEFAULT_COLOR, text: k.text };
        } catch (e) {
            lastErrors.push(t('invalidRegex', k.text));
            return null;
        }
    }).filter(Boolean);
}

function ownDOMChanges(action) {
    if (observer) handleMutations(observer.takeRecords());
    try { return action(); }
    finally { observer?.takeRecords(); }
}

function cleanupHighlights(root = document.body) {
    return ownDOMChanges(() => {
    const parents = new Set();
    root.querySelectorAll('.slim-hl').forEach(span => {
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
        parents.add(parent);
    });
    parents.forEach(p => p.normalize());
    const bar = document.getElementById('slim-pos-bar');
    if (bar) bar.remove();
    });
}

function saveSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    try { return sel.getRangeAt(0).cloneRange(); } catch { return null; }
}

function restoreSelection(saved) {
    if (!saved) return;
    try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(saved);
    } catch {}
}

function highlightInTextNode(textNode, matchers) {
    return ownDOMChanges(() => {
    if (!textNode || textNode.nodeType !== 3 || textNode.parentElement?.closest('.slim-hl')) return;
    let currentText = textNode.textContent;
    if (!currentText || currentText.length < 2) return;

    const matches = [];
    for (const m of matchers) {
        m.re.lastIndex = 0;
        let match;
        while ((match = m.re.exec(currentText)) !== null) {
            if (match[0].length === 0) { m.re.lastIndex++; continue; }
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                color: m.color,
                kw: m.text
            });
        }
    }
    if (!matches.length) return null;

    // Überlappende Treffer verschiedener Keywords verwerfen, den längeren zuerst behalten.
    matches.sort((a, b) => a.start - b.start || b.end - a.end);
    const kept = [];
    for (const m of matches) {
        if (!kept.length || m.start >= kept[kept.length - 1].end) kept.push(m);
    }

    // Von hinten nach vorne splitten: der Ausgangsknoten bleibt der vordere Rest,
    // so bleiben die Offsets der weiter vorne liegenden Treffer gültig.
    let tail = null;
    for (let i = kept.length - 1; i >= 0; i--) {
        const m = kept[i];
        try {
            const middle = textNode.splitText(m.start);
            const after = middle.splitText(m.end - m.start);
            if (!tail) tail = after;
            ownNodes.add(textNode).add(middle).add(after);
            const mark = document.createElement('span');
            mark.className = 'slim-hl';
            mark.style.backgroundColor = m.color;
            mark.style.color = highlightTextColor(m.color);
            mark.textContent = m.text;
            mark.dataset.kw = m.kw;
            ownNodes.add(mark);
            middle.parentNode.replaceChild(mark, middle);
            keywordCounts[m.kw] = (keywordCounts[m.kw] || 0) + 1;
        } catch {}
    }
    return tail;
    });
}
