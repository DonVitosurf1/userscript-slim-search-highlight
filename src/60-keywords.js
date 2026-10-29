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
    hl_ui_transparency: () => uiTransparency,
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

/** A domain setting covers the exact hostname and its real subdomains only. */
function domainMatches(host, domain) {
    const normalized = domain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
    const hostname = host.toLowerCase().replace(/\.$/, '');
    return !!normalized && (hostname === normalized || hostname.endsWith('.' + normalized));
}

function isBlacklisted() {
    return blacklist.some(domain => domainMatches(location.hostname, domain));
}

// Finite official domains: a brand-like label on an arbitrary suffix is not an engine.
// Country variants are explicit; no public-suffix guessing or substring matching.
const GOOGLE_DOMAINS = ('com ad ae com.af com.ag com.ai al am co.ao com.ar as at com.au az '
    + 'ba com.bd be bf bg com.bh bi bj com.bn com.bo com.br bs bt co.bw by com.bz '
    + 'ca cd cf cg ch ci co.ck cl cm cn com.co co.cr com.cu cv com.cy cz '
    + 'de dj dk dm com.do dz com.ec ee com.eg es com.et fi com.fj fm fr ga ge gg com.gh '
    + 'com.gi gl gm gp gr com.gt gy com.hk hn hr ht hu co.id ie co.il im co.in iq is it '
    + 'je com.jm jo co.jp co.ke com.kh ki kg co.kr com.kw kz la com.lb li lk co.ls lt lu lv '
    + 'com.ly co.ma md me mg mk ml mn ms com.mt mu mv mw com.mx com.my co.mz '
    + 'com.na com.ng com.ni ne nl no com.np nr nu co.nz com.om com.pa com.pe com.pg '
    + 'com.ph com.pk pl pn com.pr ps pt com.py com.qa ro ru rw com.sa com.sb sc se '
    + 'com.sg sh si sk com.sl sn so sm sr st com.sv td tg co.th com.tj tl tm tn to com.tr '
    + 'tt com.tw co.tz com.ua co.ug co.uk com.uy co.uz com.vc co.ve vg co.vi com.vn '
    + 'vu ws rs co.za co.zm co.zw cat').split(' ').map(suffix => 'google.' + suffix);
const OFFICIAL_SEARCH_DOMAINS = [
    ...GOOGLE_DOMAINS, 'bing.com', 'duckduckgo.com', 'yahoo.com', 'yahoo.co.jp',
    'yahoo.co.uk', 'yahoo.de', 'yahoo.fr', 'yahoo.it', 'yahoo.es', 'yahoo.ca',
    'yahoo.com.au', 'yahoo.com.br', 'yahoo.com.mx', 'baidu.com', 'yandex.com',
    'yandex.ru', 'yandex.by', 'yandex.kz', 'yandex.uz', 'yandex.com.tr',
    'startpage.com', 'ecosia.org', 'qwant.com'
];

function isSearchEngine(urlStr) {
    if (!urlStr) return false;
    try {
        const url = new URL(urlStr);
        return ['http:', 'https:'].includes(url.protocol)
            && OFFICIAL_SEARCH_DOMAINS.some(domain => domainMatches(url.hostname, domain));
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
        return k.domains.some(domain => domainMatches(host, domain));
    }).map(k => ({ ...k, sourceKeyword: k }));

    getCrossPageTerms().forEach((t, i) => {
        if (!IGNORE_WORDS.has(t.toLowerCase()) && !list.some(k => k.text.toLowerCase() === t.toLowerCase())) {
            list.push({ text: t, color: AUTO_COLORS[i % AUTO_COLORS.length], wholeWord: true, auto: true });
        }
    });
    return list;
}

function isRegexText(text) { return text.startsWith('/') && text.lastIndexOf('/') > 0; }

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const MAX_REGEX_TEXT_LENGTH = 4096;

/**
 * Conservative native-regex subset, not a general ReDoS detector. One variable
 * repetition and one alternation scope avoid combinations of ambiguous paths.
 * Nested/repeated alternation, backreferences and quantified assertions are
 * rejected. The input cap below bounds the remaining unanchored scan cost.
 */
function explicitRegexAllowed(pattern, flags = '') {
    if (pattern.length > 256 || !/^[dgimsuy]*$/.test(flags)) return false;
    const scopes = [{ repeated: false, alternation: false, assertion: false }];
    let atom = null, variableRepeats = 0, alternationScope = null, fixedWidth = 0;
    for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i];
        const scope = scopes[scopes.length - 1];
        if (ch === '\\') {
            const next = pattern[++i];
            if (!next || /[1-9k]/.test(next)) return false;
            if ((next === 'p' || next === 'P') && pattern[i + 1] === '{') {
                const end = pattern.indexOf('}', i + 2);
                if (end < 0) return false;
                i = end;
            } else if (next === 'u' && pattern[i + 1] === '{') {
                const end = pattern.indexOf('}', i + 2);
                if (end < 0) return false;
                i = end;
            }
            atom = { repeated: false, alternation: false, assertion: next === 'b' || next === 'B' };
        } else if (ch === '[') {
            // Character classes are one atom, including escaped closing brackets.
            let closed = false;
            for (++i; i < pattern.length; i++) {
                if (pattern[i] === '\\') i++;
                else if (pattern[i] === ']') { closed = true; break; }
            }
            if (!closed) return false;
            atom = { repeated: false, alternation: false, assertion: false };
        } else if (ch === '(') {
            let assertion = false;
            if (pattern[i + 1] === '?') {
                const prefix = pattern.slice(i + 2);
                if (prefix.startsWith(':')) i += 2;
                else if (prefix.startsWith('=') || prefix.startsWith('!')) { assertion = true; i += 2; }
                else if (prefix.startsWith('<=') || prefix.startsWith('<!')) { assertion = true; i += 3; }
                else if (prefix.startsWith('<')) {
                    const end = pattern.indexOf('>', i + 3);
                    if (end < 0) return false;
                    i = end;
                } else return false;
            }
            scopes.push({ repeated: false, alternation: false, assertion });
            atom = null;
        } else if (ch === ')') {
            if (scopes.length === 1) return false;
            atom = scopes.pop();
            if (atom.assertion && atom.repeated) return false;
            const parent = scopes[scopes.length - 1];
            parent.repeated ||= atom.repeated;
            parent.alternation ||= atom.alternation;
        } else if (ch === '|') {
            if (alternationScope && alternationScope !== scope) return false;
            alternationScope = scope;
            scope.alternation = true;
            atom = null;
        } else if (ch === '*' || ch === '+' || ch === '?' || ch === '{') {
            let variable = true, width = 0;
            if (ch === '{') {
                const quantifier = pattern.slice(i).match(/^\{(\d+)(?:,(\d*))?\}/);
                if (!quantifier) return false;
                const min = Number(quantifier[1]);
                const max = quantifier[2] === undefined ? min : quantifier[2] === '' ? Infinity : Number(quantifier[2]);
                if (min > 100 || (Number.isFinite(max) && max > 100)) return false;
                variable = min !== max;
                width = Number.isFinite(max) ? max : min;
                i += quantifier[0].length - 1;
            }
            if (!atom || atom.repeated || atom.alternation || atom.assertion) return false;
            if (variable && ++variableRepeats > 1) return false;
            fixedWidth += width;
            if (fixedWidth > 1000) return false;
            scope.repeated = true;
            atom = { repeated: true, alternation: false, assertion: false };
            if (pattern[i + 1] === '?') i++; // Lazy quantifier, not a second repetition.
        } else {
            atom = { repeated: false, alternation: false, assertion: ch === '^' || ch === '$' };
        }
    }
    return scopes.length === 1;
}

function buildMatchers() {
    lastErrors = [];
    return getActiveKeywords().map(k => {
        let pattern, flags = 'gi';
        if (!k.auto && isRegexText(k.text)) {
            const last = k.text.lastIndexOf('/');
            pattern = k.text.slice(1, last);
            flags = k.text.slice(last + 1) || 'gi';
            if (!explicitRegexAllowed(pattern, flags)) {
                lastErrors.push(t('unsafeRegex', k.text));
                return null;
            }
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
            return { re: new RegExp(pattern, flags), color: k.color || DEFAULT_COLOR, text: k.text, sourceKeyword: k.auto ? null : k.sourceKeyword, explicitRegex: !k.auto && isRegexText(k.text) };
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
        if (m.explicitRegex && currentText.length > MAX_REGEX_TEXT_LENGTH) continue;
        m.re.lastIndex = 0;
        let match;
        while ((match = m.re.exec(currentText)) !== null) {
            if (match[0].length === 0) {
                // AdvanceStringIndex: /u may rewind an index inside a surrogate pair.
                const index = m.re.lastIndex;
                const point = currentText.codePointAt(index);
                m.re.lastIndex = index + (m.re.unicode && point > 0xffff ? 2 : 1);
                continue;
            }
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0],
                color: m.color,
                kw: m.text, sourceKeyword: m.sourceKeyword
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
            ownedMarkKeywords.set(mark, m.sourceKeyword || null);
            ownNodes.add(mark);
            middle.parentNode.replaceChild(mark, middle);
            keywordCounts[m.kw] = (keywordCounts[m.kw] || 0) + 1;
        } catch {}
    }
    return tail;
    });
}
