// ==UserScript==
// @name         Slim Search Highlight
// @namespace    https://github.com/DonVitosurf1/userscript-slim-search-highlight
// @version      4.0.3
// @author       DonVitosurf1
// @license      MIT
// @homepageURL  https://github.com/DonVitosurf1/userscript-slim-search-highlight
// @supportURL   https://github.com/DonVitosurf1/userscript-slim-search-highlight/issues
// @updateURL    https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js
// @downloadURL  https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js
// @description  Keyword highlighting with position bar, navigation and keyword search
// @description:de  Keyword-Hervorhebung mit Positionsanzeige, Navigation und Keyword-Suche
// @icon         https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/assets/icon.svg
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const DEFAULT_PROFILE = 'Default';
    // Profile: benannte Keyword-Sätze. Vorhandene Keywords (hl_keywords) wandern ins Profil „Default“.
    let profiles = GM_getValue('hl_profiles', null);
    if (!profiles || typeof profiles !== 'object' || !Object.keys(profiles).length) {
        profiles = { [DEFAULT_PROFILE]: GM_getValue('hl_keywords', []) };
    }
    let activeProfile = GM_getValue('hl_profile', null);
    if (!profiles[activeProfile]) activeProfile = Object.keys(profiles)[0];
    let keywords = profiles[activeProfile];
    let enabled = GM_getValue('hl_enabled', true);
    let autoSearch = GM_getValue('hl_auto_search', true);
    let panelPos = GM_getValue('hl_panel_pos', { x: 20, y: 80 });
    let panelState = GM_getValue('hl_panel_state', { open: false, minimized: false });
    let searchHistory = GM_getValue('hl_search_history', []);
    let blacklist = GM_getValue('hl_blacklist', ['docs.google.com', 'youtube.com', 'netflix.com']);
    let searchEngine = GM_getValue('hl_search_engine', 'google');
    let showPosBar = GM_getValue('hl_show_posbar', true);
    let lang = GM_getValue('hl_lang', 'auto');

    const LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' rx='28' fill='%23263238'/%3E%3Crect x='20' y='30' width='52' height='16' rx='4' fill='%23ffe082'/%3E%3Crect x='34' y='56' width='44' height='16' rx='4' fill='%2390caf9'/%3E%3Crect x='20' y='82' width='36' height='16' rx='4' fill='%23a5d6a7'/%3E%3Cg fill='%23eceff1'%3E%3Crect x='24' y='35' width='44' height='6' rx='3' fill='%23263238'/%3E%3Crect x='38' y='61' width='36' height='6' rx='3' fill='%23263238'/%3E%3Crect x='24' y='87' width='28' height='6' rx='3' fill='%23263238'/%3E%3Crect x='78' y='35' width='16' height='6' rx='3'/%3E%3Crect x='20' y='61' width='10' height='6' rx='3'/%3E%3Crect x='82' y='61' width='12' height='6' rx='3'/%3E%3Crect x='62' y='87' width='32' height='6' rx='3'/%3E%3C/g%3E%3Crect x='104' y='20' width='6' height='88' rx='3' fill='%23455a64'/%3E%3Crect x='104' y='32' width='6' height='5' rx='2' fill='%23ffe082'/%3E%3Crect x='104' y='60' width='6' height='5' rx='2' fill='%2390caf9'/%3E%3Crect x='104' y='86' width='6' height='5' rx='2' fill='%23a5d6a7'/%3E%3C/svg%3E`;

    const I18N = {
        en: {
            openPanel: 'Open highlight panel', minimize: 'Minimize', close: 'Close',
            prev: 'Previous highlight (Alt + ←)', next: 'Next highlight (Alt + →)',
            kwSearch: 'Search keywords…', kwPlaceholder: 'Keyword or /regex/',
            wholeWords: 'Whole words only', domains: 'Only on domains (optional, comma-separated)', add: 'Add',
            keywords: 'Keywords', settings: 'Settings', recent: 'Recent searches',
            profileNew: 'New profile', profileDelete: 'Delete profile', profileName: 'Name of the new profile:',
            profileExists: 'A profile with this name already exists.',
            profileConfirm: n => `Delete the profile “${n}” and all its keywords?`,
            enabled: 'Highlights enabled', autoSearch: 'Take over terms from search', posBar: 'Show position bar',
            engine: 'Search engine for right-click:', language: 'Language:', langAuto: 'Auto',
            noMatches: 'No matches on this page', noKwMatches: 'No keywords match your search', noKeywords: 'No keywords saved yet',
            more: n => `… and ${n} more (use Alt + → / ← to step through)`,
            changeColor: 'Change color', countTitle: 'Matches on this page', remove: 'Delete',
            invalidRegex: k => `Invalid regex in “${k}”`, exists: 'Keyword already exists.',
            menuOpen: 'Open panel', menuBlacklist: 'Add current domain to blacklist',
            blacklisted: h => `${h} added to the blacklist`
        },
        de: {
            openPanel: 'Highlight-Panel öffnen', minimize: 'Minimieren', close: 'Schließen',
            prev: 'Vorheriges Highlight (Alt + ←)', next: 'Nächstes Highlight (Alt + →)',
            kwSearch: 'Keywords suchen…', kwPlaceholder: 'Keyword oder /regex/',
            wholeWords: 'Nur ganze Wörter', domains: 'Nur auf Domains (optional, kommagetrennt)', add: 'Hinzufügen',
            keywords: 'Keywords', settings: 'Einstellungen', recent: 'Letzte Suchen',
            profileNew: 'Neues Profil', profileDelete: 'Profil löschen', profileName: 'Name des neuen Profils:',
            profileExists: 'Ein Profil mit diesem Namen gibt es schon.',
            profileConfirm: n => `Profil „${n}“ mit allen Keywords löschen?`,
            enabled: 'Highlights aktiv', autoSearch: 'Automatisch von Suche übernehmen', posBar: 'Positionsanzeige anzeigen',
            engine: 'Suchmaschine für Rechtsklick:', language: 'Sprache:', langAuto: 'Automatisch',
            noMatches: 'Keine Treffer auf dieser Seite', noKwMatches: 'Keine Treffer für die Suche', noKeywords: 'Noch keine Keywords gespeichert',
            more: n => `… und ${n} weitere (Alt + → / ← zum Durchblättern)`,
            changeColor: 'Farbe ändern', countTitle: 'Treffer auf dieser Seite', remove: 'Löschen',
            invalidRegex: k => `Ungültiger Regex bei „${k}“`, exists: 'Keyword existiert bereits.',
            menuOpen: 'Panel öffnen', menuBlacklist: 'Aktuelle Domain zur Blacklist',
            blacklisted: h => `${h} zur Blacklist hinzugefügt`
        }
    };

    function currentLang() {
        if (lang === 'de' || lang === 'en') return lang;
        return String(navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
    }

    function t(key, ...args) {
        const v = (I18N[currentLang()] || I18N.en)[key] ?? I18N.en[key] ?? key;
        return typeof v === 'function' ? v(...args) : v;
    }
    const DEFAULT_COLOR = '#ffe082';
    const AUTO_COLORS = ['#90caf9', '#a5d6a7', '#ef9a9a', '#ffcc80', '#ce93d8', '#80cbc4', '#fff176', '#b0bec5'];
    const SEARCH_ENGINES = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'baidu.', 'yandex.', 'startpage.', 'ecosia.', 'qwant.'];
    const CROSS_TTL = 10 * 60 * 1000;
    const IGNORE_WORDS = new Set(['the','and','for','with','von','der','die','das','und','für','in','on','at','to','of','a','an','or','as','by','is','it','be','are','was','were','this','that','these','those','from','into','about','under','over']);

    const SEARCH_URLS = {
        google: 'https://www.google.com/search?q=',
        ddg: 'https://duckduckgo.com/?q=',
        brave: 'https://search.brave.com/search?q=',
        bing: 'https://www.bing.com/search?q='
    };

    let currentIdx = -1;
    let highlightCount = 0;
    let isSelecting = false;
    let isHighlighting = false;
    let keywordCounts = {};
    let lastErrors = [];
    let observer = null;
    let kwFilter = '';

    GM_addStyle(`
        .slim-hl { border-radius: 3px; padding: 0 2px; cursor: pointer; }
        #slim-hl-panel { all: initial; display: block; position: fixed; z-index: 2147483647; }
        #slim-hl-toggle {
            position: fixed; z-index: 2147483646; bottom: 20px; right: 20px;
            width: 48px; height: 48px; border-radius: 14px; padding: 0;
            background: url("${LOGO}") center / cover no-repeat;
            border: none; cursor: pointer;
            box-shadow: 0 4px 18px rgba(0,0,0,0.4);
            transition: transform 0.15s;
        }
        #slim-hl-toggle:hover { transform: scale(1.1); }
        /* Positionsanzeige */
        #slim-pos-bar {
            position: fixed;
            right: 4px;
            top: 0;
            bottom: 0;
            width: 10px;
            z-index: 2147483645;
            pointer-events: none;
        }
        #slim-pos-bar .mark {
            position: absolute;
            left: 0;
            width: 8px;
            height: 4px;
            border-radius: 2px;
            pointer-events: auto;
            cursor: pointer;
            opacity: 0.75;
            transition: opacity 0.15s, transform 0.15s;
        }
        #slim-pos-bar .mark:hover {
            opacity: 1;
            transform: scaleX(1.6);
        }
        #slim-pos-bar .mark.active {
            opacity: 1;
            transform: scaleX(1.8);
            box-shadow: 0 0 4px #ffca28;
        }
    `);

    // Panel-Styles liegen im Shadow DOM und sind von der Seite getrennt.
    const PANEL_CSS = `
    .panel {
        background: #1a1a1a; color: #f0f0f0;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08);
        font: 13.5px/1.45 system-ui, -apple-system, sans-serif;
        min-width: 320px; max-width: 440px;
        user-select: none;
    }
    :host(.minimized) .panel-body { display: none; }
    #slim-hl-header {
        padding: 12px 16px; background: #242424;
        border-radius: 10px 10px 0 0; cursor: move;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #333;
    }
    #slim-hl-header span { font-weight: 650; letter-spacing: 0.2px; display: flex; align-items: center; gap: 8px; }
    #slim-hl-header img { width: 20px; height: 20px; }
    #slim-hl-header button {
        background: none; border: none; color: #bbb; cursor: pointer;
        font-size: 18px; width: 32px; height: 32px; border-radius: 6px;
    }
    #slim-hl-header button:hover { background: #333; color: #fff; }
    .panel-body { padding: 14px; max-height: 580px; overflow-y: auto; }
    .counter {
        font-weight: 700; color: #ffca28; margin: 0 0 12px;
        font-size: 18px; letter-spacing: 0.4px;
    }
    .nav-btns { display: flex; gap: 10px; margin-bottom: 12px; }
    .nav-btns button, #add-kw-btn, .btn {
        background: #2d2d2d; color: #fff; border: 1px solid #444;
        padding: 8px 12px; border-radius: 7px; cursor: pointer;
        transition: all 0.15s ease; font-size: 13px;
    }
    .nav-btns button:hover, #add-kw-btn:hover, .btn:hover {
        background: #3a3a3a; border-color: #555;
    }
    .nav-btns button:focus, #add-kw-btn:focus, .btn:focus {
        outline: 2px solid #ffca28; outline-offset: 2px;
    }
    .kw-item, .match-item {
        display: flex; align-items: center; gap: 8px;
        margin: 5px 0; padding: 4px 0; font-size: 13px;
    }
    .kw-count { color: #aaa; font-size: 12px; min-width: 36px; text-align: right; }
    .kw-item input[type=color] { width: 26px; height: 22px; border-radius: 5px; border: none; cursor: pointer; }
    .kw-item input[type=text] {
        flex: 1; background: #222; border: 1px solid #444; color: #eee;
        padding: 5px 8px; border-radius: 6px;
    }
    .kw-item button {
        background: #333; color: #ddd; border: none; border-radius: 6px;
        cursor: pointer; padding: 4px 10px; font-size: 15px; min-width: 32px;
    }
    .kw-item button:hover { background: #c62828; color: #fff; }
    .match-item { cursor: pointer; padding: 5px 8px; border-radius: 6px; }
    .match-item:hover { background: #252525; }
    .match-item.active { background: #333; outline: 1px solid #ffca28; }
    #match-list { max-height: 160px; overflow-y: auto; margin: 8px 0 12px; border-top: 1px solid #333; padding-top: 10px; }
    .empty { color: #888; font-size: 12.5px; padding: 8px 0; text-align: center; }
    .error { color: #ef5350; font-size: 12px; margin: 6px 0; white-space: pre-line; }
    select#search-engine, select#ui-lang, select#profile-select, input[type=text] {
        background: #222; color: #eee; border: 1px solid #444;
        border-radius: 6px; padding: 7px 9px; width: 100%; margin-top: 4px;
    }
    label { font-size: 13px; display: flex; align-items: center; gap: 8px; margin: 8px 0; }
    .profile-row { display: flex; gap: 6px; align-items: center; }
    .profile-row select { flex: 1; margin-top: 0 !important; }
    .profile-row button {
        background: #2d2d2d; color: #fff; border: 1px solid #444; border-radius: 6px;
        cursor: pointer; width: 32px; height: 32px; font-size: 16px; padding: 0;
    }
    .profile-row button:hover:not(:disabled) { background: #3a3a3a; }
    .profile-row button:disabled { opacity: 0.4; cursor: default; }
    .section-title { font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.6px; margin: 16px 0 8px; font-weight: 600; }
    #kw-search {
        width: 100%;
        margin-bottom: 8px;
        background: #222;
        color: #eee;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 7px 9px;
    }
    `;

    const PERSISTED = {
        hl_profiles: () => profiles,
        hl_profile: () => activeProfile,
        hl_enabled: () => enabled,
        hl_auto_search: () => autoSearch,
        hl_panel_pos: () => panelPos,
        hl_panel_state: () => panelState,
        hl_search_history: () => searchHistory.slice(0, 8),
        hl_blacklist: () => blacklist,
        hl_search_engine: () => searchEngine,
        hl_show_posbar: () => showPosBar,
        hl_lang: () => lang
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

    function setKeywords(list) {
        profiles[activeProfile] = list;
        keywords = list;
    }

    function switchProfile(name) {
        if (!profiles[name]) return;
        activeProfile = name;
        keywords = profiles[name];
        save();
        renderProfiles();
        renderKeywordList();
        refreshHighlights();
    }

    function renderProfiles() {
        const select = ui('profile-select');
        if (!select) return;
        select.replaceChildren(...Object.keys(profiles).map(name => {
            const o = document.createElement('option');
            o.value = name;
            o.textContent = name;
            o.selected = name === activeProfile;
            return o;
        }));
        const del = ui('profile-del');
        if (del) del.disabled = Object.keys(profiles).length < 2;
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

    function getSearchTerms() {
        const q = extractQuery(location.href);
        if (!q) return [];
        return q.split(/\s+/).filter(w => w.length > 1 && !IGNORE_WORDS.has(w.toLowerCase()));
    }

    function updateCrossPageTerms() {
        if (!isSearchEngine(location.href)) return;
        const terms = getSearchTerms();
        if (terms.length) {
            GM_setValue('hl_cross_terms', { terms, timestamp: Date.now() });
            const joined = terms.join(' ');
            if (joined && !searchHistory.includes(joined)) {
                searchHistory.unshift(joined);
                searchHistory = searchHistory.slice(0, 8);
                save();
            }
        }
    }

    let manualTerms = [];

    function getCrossPageTerms() {
        const result = [];
        const m = location.hash.match(/[#&](?:sjhl|hl)=([^&]+)/i);
        if (m) {
            try { decodeURIComponent(m[1]).split(/[,+]/).forEach(t => t.trim() && result.push(t.trim())); } catch {}
        }

        result.push(...manualTerms);
        if (autoSearch) {
            const stored = GM_getValue('hl_cross_terms', null);
            if (stored && stored.terms && (Date.now() - stored.timestamp) < CROSS_TTL) {
                result.push(...stored.terms);
            }
            if (isSearchEngine(document.referrer)) {
                const q = extractQuery(document.referrer);
                if (q) q.split(/\s+/).forEach(w => w.length > 1 && !IGNORE_WORDS.has(w.toLowerCase()) && result.push(w));
            }
        }
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

    function cleanupHighlights(root = document.body) {
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
                mark.style.color = '#000';
                mark.textContent = m.text;
                mark.dataset.kw = m.kw;
                ownNodes.add(mark);
                middle.parentNode.replaceChild(mark, middle);
                keywordCounts[m.kw] = (keywordCounts[m.kw] || 0) + 1;
            } catch {}
        }
        return tail;
    }

    function updatePosBar() {
        let bar = document.getElementById('slim-pos-bar');
        if (!showPosBar || highlightCount === 0) {
            if (bar) bar.remove();
            return;
        }
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'slim-pos-bar';
            bar.addEventListener('click', e => {
                const i = e.target.dataset && e.target.dataset.i;
                if (i === undefined) return;
                e.stopPropagation();
                currentIdx = +i;
                goTo(0);
            });
            document.body.appendChild(bar);
        }

        // Erst alle Positionen lesen, dann einmal schreiben: sonst erzwingt jedes
        // getBoundingClientRect() nach einem appendChild() ein komplettes Layout.
        const hls = document.getElementsByClassName('slim-hl');
        const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 1);
        const scrollY = window.scrollY;
        const tops = new Array(hls.length);
        for (let i = 0; i < hls.length; i++) tops[i] = hls[i].getBoundingClientRect().top + scrollY;

        const frag = document.createDocumentFragment();
        for (let i = 0; i < hls.length; i++) {
            const mark = document.createElement('div');
            mark.className = 'mark' + (i === currentIdx ? ' active' : '');
            mark.style.top = Math.min(98, Math.max(0, (tops[i] / docHeight) * 100)) + '%';
            mark.style.backgroundColor = hls[i].style.backgroundColor || DEFAULT_COLOR;
            mark.title = hls[i].textContent.slice(0, 40);
            mark.dataset.i = i;
            frag.appendChild(mark);
        }
        bar.replaceChildren(frag);
    }

    const SKIP_SELECTOR = 'script, style, textarea, input, noscript, code, pre, select, option, [contenteditable=""], [contenteditable="true"]';
    const OWN_UI = '#slim-hl-panel, #slim-hl-toggle, #slim-pos-bar';
    const FRAME_BUDGET_MS = 10;
    let matchers = [];
    let panelRoot = null; // ShadowRoot des Panels
    const ui = id => (panelRoot ? panelRoot.getElementById(id) : null);
    let ownNodes = new WeakSet(); // Markierungen und Textstücke, die dieses Skript selbst erzeugt hat
    let refreshQueued = false;
    let refreshRetryTimer;

    function isOwnNode(node) {
        const el = node.nodeType === 1 ? node : node.parentElement;
        return !el || !!el.closest('.slim-hl, ' + OWN_UI);
    }

    /** Markiert alle Textknoten unterhalb der Wurzeln, in Zeitscheiben von ~10 ms pro Frame. */
    function highlightRoots(roots, done) {
        const queue = roots.slice();
        let walker = null;
        function step() {
            const deadline = performance.now() + FRAME_BUDGET_MS;
            while (performance.now() < deadline) {
                if (!walker) {
                    const root = queue.shift();
                    if (!root) return done();
                    if (!root.isConnected || isOwnNode(root)) continue;
                    if (root.nodeType === 3) {
                        if (!root.parentElement.closest(SKIP_SELECTOR)) highlightInTextNode(root, matchers);
                        continue;
                    }
                    if (root.closest(SKIP_SELECTOR)) continue;
                    walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                        acceptNode(n) {
                            const p = n.parentElement;
                            if (!p || ownNodes.has(n) || p.closest(SKIP_SELECTOR + ', .slim-hl, ' + OWN_UI)) return NodeFilter.FILTER_REJECT;
                            return NodeFilter.FILTER_ACCEPT;
                        }
                    });
                }
                const node = walker.nextNode();
                if (!node) { walker = null; continue; }
                const tail = highlightInTextNode(node, matchers);
                if (tail) walker.currentNode = tail;
            }
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function afterHighlight() {
        isHighlighting = false;
        updateCounterAndTitle();
        if (ui('kw-list')) updateKeywordCounts();
        if (ui('match-list')) renderMatchList();
        updatePosBar();
        if (observer && enabled) observer.observe(document.body, { childList: true, subtree: true });
        if (refreshQueued) { refreshQueued = false; refreshHighlights(); return; }
        if (pendingNodes.size) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(highlightAdded, 280);
        }
    }

    /** Vollständiger Neuaufbau, nur nötig wenn sich Keywords oder Einstellungen ändern. */
    function refreshHighlights() {
        if (!enabled || isBlacklisted()) return;
        if (isSelecting) {
            clearTimeout(refreshRetryTimer);
            refreshRetryTimer = setTimeout(refreshHighlights, 100);
            return;
        }
        if (isHighlighting) { refreshQueued = true; return; }
        isHighlighting = true;
        keywordCounts = {};
        currentIdx = -1;
        ownNodes = new WeakSet();

        const savedRange = saveSelection();
        cleanupHighlights(document.body);
        // Der Observer bleibt verbunden; nur die eigenen Änderungen des Aufräumens werden verworfen.
        if (observer) observer.takeRecords();
        pendingNodes.clear();

        try { matchers = buildMatchers(); } catch (e) { matchers = []; lastErrors = [String(e && e.message || e)]; }
        const errorEl = ui('regex-error');
        if (errorEl) errorEl.textContent = lastErrors.join('\n');

        if (!matchers.length) {
            restoreSelection(savedRange);
            afterHighlight();
            return;
        }
        highlightRoots([document.body], () => {
            restoreSelection(savedRange);
            afterHighlight();
        });
    }

    /** Inkrementell: nur von der Seite neu hinzugefügte Knoten durchsuchen. */
    function highlightAdded() {
        if (!enabled || isHighlighting || isBlacklisted()) return;
        if (isSelecting) { debounceTimer = setTimeout(highlightAdded, 280); return; }
        const roots = [...pendingNodes];
        pendingNodes.clear();
        if (!roots.length || !matchers.length) return;
        isHighlighting = true;
        highlightRoots(roots, afterHighlight);
    }

    let titlePrefix = '';

    function updateCounterAndTitle() {
        highlightCount = document.getElementsByClassName('slim-hl').length;
        const counter = ui('hl-counter');
        if (counter) counter.textContent = highlightCount ? `${Math.max(0, currentIdx) + 1} / ${highlightCount}` : '0 / 0';
        let baseTitle = document.title;
        if (titlePrefix && baseTitle.startsWith(titlePrefix)) baseTitle = baseTitle.slice(titlePrefix.length);
        titlePrefix = highlightCount ? `(${highlightCount}) ` : '';
        if (document.title !== titlePrefix + baseTitle) document.title = titlePrefix + baseTitle;
    }

    let outlined = null;
    let outlineTimer;

    function goTo(delta) {
        const hls = document.getElementsByClassName('slim-hl');
        if (!hls.length) return;
        if (currentIdx < 0 && delta < 0) currentIdx = 0;
        currentIdx = (currentIdx + delta + hls.length) % hls.length;
        const target = hls[currentIdx];
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (outlined && outlined !== target) outlined.style.outline = '';
        clearTimeout(outlineTimer);
        outlined = target;
        target.style.outline = '2px solid #ffca28';
        outlineTimer = setTimeout(() => { target.style.outline = ''; outlined = null; }, 700);
        updateCounterAndTitle();
        const bar = document.getElementById('slim-pos-bar');
        if (bar) {
            const prev = bar.querySelector('.active');
            if (prev) prev.classList.remove('active');
            if (bar.children[currentIdx]) bar.children[currentIdx].classList.add('active');
        } else {
            updatePosBar();
        }
        const items = panelRoot ? panelRoot.querySelectorAll('.match-item') : [];
        if (items.length) items.forEach((el, i) => el.classList.toggle('active', i === currentIdx));
    }

    const MATCH_LIST_MAX = 300;

    function renderMatchList() {
        const list = ui('match-list');
        if (!list) return;
        const hls = document.getElementsByClassName('slim-hl');
        if (!hls.length) {
            list.innerHTML = `<div class="empty">${t('noMatches')}</div>`;
            return;
        }
        const frag = document.createDocumentFragment();
        const shown = Math.min(hls.length, MATCH_LIST_MAX);
        for (let i = 0; i < shown; i++) {
            const el = hls[i];
            const div = document.createElement('div');
            div.className = 'match-item' + (i === currentIdx ? ' active' : '');
            const dot = document.createElement('span');
            dot.style.cssText = `display:inline-block;width:16px;height:16px;border-radius:4px;background:${el.style.backgroundColor};margin-right:8px;`;
            div.append(dot, el.textContent.slice(0, 44));
            div.onclick = () => { currentIdx = i; goTo(0); };
            frag.appendChild(div);
        }
        if (hls.length > shown) {
            const more = document.createElement('div');
            more.className = 'empty';
            more.textContent = t('more', hls.length - shown);
            frag.appendChild(more);
        }
        list.replaceChildren(frag);
    }

    function createPanel() {
        if (document.getElementById('slim-hl-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'slim-hl-panel';
        panel.style.left = panelPos.x + 'px';
        panel.style.top = panelPos.y + 'px';
        if (panelState.minimized) panel.classList.add('minimized');
        const root = panel.attachShadow({ mode: 'open' });
        panelRoot = root;
        root.innerHTML = `
            <style>${PANEL_CSS}</style>
            <div class="panel">
            <div id="slim-hl-header">
                <span><img src="${LOGO}" alt="">Highlight</span>
                <div>
                    <button id="btn-min" title="${t('minimize')}">−</button>
                    <button id="btn-close" title="${t('close')}">×</button>
                </div>
            </div>
            <div class="panel-body">
                <div class="counter" id="hl-counter">0 / 0</div>
                <div class="nav-btns">
                    <button id="btn-prev" title="${t('prev')}">◀</button>
                    <button id="btn-next" title="${t('next')}">▶</button>
                </div>
                <div id="match-list"></div>
                <div class="section-title">${t('keywords')}</div>
                <div class="profile-row">
                    <select id="profile-select"></select>
                    <button id="profile-new" title="${t('profileNew')}">+</button>
                    <button id="profile-del" title="${t('profileDelete')}">×</button>
                </div>
                <input type="text" id="kw-search" placeholder="${t('kwSearch')}" value="${kwFilter}">
                <div id="kw-list"></div>
                <div id="regex-error" class="error"></div>
                <div style="display:flex;gap:8px;margin-top:10px;">
                    <input type="text" id="new-kw" placeholder="${t('kwPlaceholder')}" style="flex:1;">
                    <input type="color" id="new-color" value="${DEFAULT_COLOR}">
                </div>
                <label style="margin-top:8px;"><input type="checkbox" id="new-whole" checked> ${t('wholeWords')}</label>
                <input type="text" id="new-domains" placeholder="${t('domains')}">
                <button id="add-kw-btn" style="margin-top:10px;width:100%;">${t('add')}</button>
                <div id="history-container"></div>
                <div class="section-title">${t('settings')}</div>
                <label><input type="checkbox" id="chk-enabled" ${enabled?'checked':''}> ${t('enabled')}</label>
                <label><input type="checkbox" id="chk-auto" ${autoSearch?'checked':''}> ${t('autoSearch')}</label>
                <label><input type="checkbox" id="chk-posbar" ${showPosBar?'checked':''}> ${t('posBar')}</label>
                <div style="margin-top:10px;font-size:12.5px;">${t('engine')}</div>
                <select id="search-engine">
                    <option value="google" ${searchEngine==='google'?'selected':''}>Google</option>
                    <option value="ddg" ${searchEngine==='ddg'?'selected':''}>DuckDuckGo</option>
                    <option value="brave" ${searchEngine==='brave'?'selected':''}>Brave</option>
                    <option value="bing" ${searchEngine==='bing'?'selected':''}>Bing</option>
                </select>
                <div style="margin-top:10px;font-size:12.5px;">${t('language')}</div>
                <select id="ui-lang">
                    <option value="auto" ${lang==='auto'?'selected':''}>${t('langAuto')}</option>
                    <option value="de" ${lang==='de'?'selected':''}>Deutsch</option>
                    <option value="en" ${lang==='en'?'selected':''}>English</option>
                </select>
            </div>
            </div>`;
        // Tastendrücke im Panel (ohne Alt/Strg/Cmd) sollen keine Tastenkürzel der Seite auslösen.
        ['keydown', 'keyup', 'keypress'].forEach(type => panel.addEventListener(type, e => {
            if (!e.altKey && !e.ctrlKey && !e.metaKey) e.stopPropagation();
        }));
        document.body.appendChild(panel);
        if (panelState.open) panel.style.display = 'block';

        let dx, dy;
        const onMove = e => {
            panel.style.left = (e.clientX - dx) + 'px';
            panel.style.top = (e.clientY - dy) + 'px';
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            panelPos = { x: panel.offsetLeft, y: panel.offsetTop };
            save();
        };
        root.querySelector('#slim-hl-header').onmousedown = e => {
            if (e.target.tagName === 'BUTTON') return;
            dx = e.clientX - panel.offsetLeft;
            dy = e.clientY - panel.offsetTop;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };

        root.querySelector('#btn-min').onclick = () => {
            panel.classList.toggle('minimized');
            panelState.minimized = panel.classList.contains('minimized');
            save();
        };
        root.querySelector('#btn-close').onclick = () => {
            panel.style.display = 'none';
            panelState.open = false;
            save();
        };
        root.querySelector('#btn-prev').onclick = () => goTo(-1);
        root.querySelector('#btn-next').onclick = () => goTo(1);

        root.querySelector('#profile-select').onchange = e => switchProfile(e.target.value);
        root.querySelector('#profile-new').onclick = () => {
            const name = (prompt(t('profileName')) || '').trim();
            if (!name) return;
            if (profiles[name]) { alert(t('profileExists')); return; }
            profiles[name] = [];
            switchProfile(name);
        };
        root.querySelector('#profile-del').onclick = () => {
            if (Object.keys(profiles).length < 2 || !confirm(t('profileConfirm', activeProfile))) return;
            delete profiles[activeProfile];
            switchProfile(Object.keys(profiles)[0]);
        };
        root.querySelector('#kw-search').oninput = e => {
            kwFilter = e.target.value.trim().toLowerCase();
            renderKeywordList();
        };

        root.querySelector('#add-kw-btn').onclick = () => {
            const text = root.querySelector('#new-kw').value.trim();
            if (!text) return;
            if (keywords.some(k => k.text.toLowerCase() === text.toLowerCase())) {
                alert(t('exists'));
                return;
            }
            const domainsRaw = root.querySelector('#new-domains').value.trim();
            const domains = domainsRaw ? domainsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];
            keywords.push({
                text,
                color: root.querySelector('#new-color').value,
                regex: isRegexText(text),
                wholeWord: root.querySelector('#new-whole').checked,
                domains
            });
            save();
            root.querySelector('#new-kw').value = '';
            root.querySelector('#new-domains').value = '';
            refreshHighlights();
        };
        root.querySelector('#chk-enabled').onchange = e => {
            enabled = e.target.checked;
            save();
            if (enabled) {
                if (!observer) setupObserver();
                refreshHighlights();
            } else {
                pendingNodes.clear();
                cleanupHighlights();
                updateCounterAndTitle();
                updatePosBar();
                if (observer) observer.disconnect();
            }
        };
        root.querySelector('#chk-auto').onchange = e => { autoSearch = e.target.checked; save(); refreshHighlights(); };
        root.querySelector('#chk-posbar').onchange = e => {
            showPosBar = e.target.checked;
            save();
            updatePosBar();
        };
        root.querySelector('#search-engine').onchange = e => { searchEngine = e.target.value; save(); };
        root.querySelector('#ui-lang').onchange = e => {
            lang = e.target.value;
            save();
            const toggle = document.getElementById('slim-hl-toggle');
            if (toggle) toggle.title = t('openPanel');
            panel.remove();
            createPanel();
            refreshHighlights();
        };

        renderProfiles();
        renderKeywordList();
        renderHistory();
        setTimeout(() => { updateCounterAndTitle(); renderMatchList(); updatePosBar(); }, 200);
    }

    /** Aktualisiert nur die Trefferzahlen, damit ein gerade bearbeitetes Feld nicht neu aufgebaut wird. */
    function updateKeywordCounts() {
        const list = ui('kw-list');
        if (!list) return;
        const filtered = keywords.filter(k => !kwFilter || k.text.toLowerCase().includes(kwFilter));
        const items = list.querySelectorAll('.kw-item');
        if (!items.length || items.length !== filtered.length) { renderKeywordList(); return; }
        items.forEach((el, i) => { el.querySelector('.kw-count').textContent = keywordCounts[filtered[i].text] || 0; });
    }

    function renderKeywordList() {
        const list = ui('kw-list');
        if (!list) return;
        const filtered = keywords.filter(k => !kwFilter || k.text.toLowerCase().includes(kwFilter));
        if (!filtered.length) {
            list.innerHTML = `<div class="empty">${keywords.length ? t('noKwMatches') : t('noKeywords')}</div>`;
            return;
        }
        list.innerHTML = '';
        filtered.forEach(k => {
            const originalIndex = keywords.indexOf(k);
            const count = keywordCounts[k.text] || 0;
            const div = document.createElement('div');
            div.className = 'kw-item';
            div.innerHTML = `
                <input type="color" value="${k.color}" data-i="${originalIndex}" title="${t('changeColor')}">
                <input type="text" value="${k.text.replace(/"/g,'&quot;')}" data-i="${originalIndex}">
                <span class="kw-count" title="${t('countTitle')}">${count}</span>
                <button data-i="${originalIndex}" title="${t('remove')}">×</button>`;
            list.appendChild(div);
        });
        list.querySelectorAll('input[type=color]').forEach(el => el.onchange = () => {
            keywords[+el.dataset.i].color = el.value;
            save();
            refreshHighlights();
        });
        list.querySelectorAll('input[type=text]').forEach(el => el.onchange = () => {
            keywords[+el.dataset.i].text = el.value;
            keywords[+el.dataset.i].regex = isRegexText(el.value);
            save();
            refreshHighlights();
        });
        list.querySelectorAll('button').forEach(el => el.onclick = () => {
            keywords.splice(+el.dataset.i, 1);
            save();
            refreshHighlights();
        });
    }

    function renderHistory() {
        const container = ui('history-container');
        if (!container || !searchHistory.length) return;
        container.innerHTML = `<div class="section-title">${t('recent')}</div>`;
        searchHistory.forEach(h => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.margin = '4px 0';
            btn.style.width = '100%';
            btn.textContent = h.slice(0, 38) + (h.length > 38 ? '…' : '');
            btn.title = h;
            btn.onclick = () => {
                manualTerms = h.split(/\s+/).filter(Boolean);
                GM_setValue('hl_cross_terms', { terms: manualTerms, timestamp: Date.now() });
                refreshHighlights();
            };
            container.appendChild(btn);
        });
    }

    function createToggle() {
        if (document.getElementById('slim-hl-toggle')) return;
        const btn = document.createElement('button');
        btn.id = 'slim-hl-toggle';
        btn.title = t('openPanel');
        btn.onclick = () => {
            let p = document.getElementById('slim-hl-panel');
            if (!p) {
                createPanel();
                p = document.getElementById('slim-hl-panel');
            }
            const isHidden = p.style.display === 'none' || !p.style.display;
            p.style.display = isHidden ? 'block' : 'none';
            panelState.open = isHidden;
            save();
        };
        document.body.appendChild(btn);
    }

    /** Nur auf Seiten registrieren, auf denen das Skript aktiv ist (nicht auf der Blacklist). */
    function bindGlobalHandlers() {
        document.addEventListener('mousedown', e => { if (!isOwnNode(e.target)) isSelecting = true; });
        document.addEventListener('mouseup', () => { setTimeout(() => { isSelecting = false; }, 80); });

        document.addEventListener('click', e => {
            const hl = e.target.closest('.slim-hl');
            if (!hl || !e.altKey) return;
            e.preventDefault();
            const kw = hl.dataset.kw;
            setKeywords(keywords.filter(k => k.text !== kw));
            save();
            refreshHighlights();
        });

        document.addEventListener('dblclick', e => {
            if (e.target.closest('.slim-hl')) goTo(1);
        });

        document.addEventListener('contextmenu', e => {
            const hl = e.target.closest('.slim-hl');
            if (!hl) return;
            e.preventDefault();
            const term = hl.textContent.trim();
            if (term) {
                const url = SEARCH_URLS[searchEngine] || SEARCH_URLS.google;
                window.open(url + encodeURIComponent(term), '_blank');
            }
        });

        document.addEventListener('keydown', e => {
            if (e.altKey && e.key.toLowerCase() === 'h' && !e.repeat) {
                const sel = window.getSelection().toString().trim();
                if (sel && !IGNORE_WORDS.has(sel.toLowerCase())) {
                    if (!keywords.some(k => k.text.toLowerCase() === sel.toLowerCase())) {
                        keywords.push({ text: sel, color: DEFAULT_COLOR, wholeWord: true });
                        save();
                        refreshHighlights();
                    }
                }
            }
            if (!document.getElementsByClassName('slim-hl').length) return;
            if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goTo(1); }
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goTo(-1); }
        });


    }

    const pendingNodes = new Set();
    let debounceTimer;
    function setupObserver() {
        observer = new MutationObserver(records => {
            if (isBlacklisted()) return;
            for (const r of records) {
                if (isOwnNode(r.target)) continue;
                r.addedNodes.forEach(n => {
                    if ((n.nodeType === 1 || n.nodeType === 3) && !ownNodes.has(n) && !isOwnNode(n)) pendingNodes.add(n);
                });
            }
            if (!pendingNodes.size || isHighlighting) return; // läuft gerade ein Durchlauf, holt afterHighlight() das nach
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(highlightAdded, 280);
        });
        if (enabled) observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        if (isBlacklisted()) return;
        bindGlobalHandlers();
        if (window.ResizeObserver) {
            let resizeTimer;
            new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(updatePosBar, 200); }).observe(document.documentElement);
        }
        updateCrossPageTerms();
        createToggle();
        if (panelState.open) createPanel();
        if (enabled) {
            refreshHighlights();
            setupObserver();
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    GM_registerMenuCommand(t('menuOpen'), () => {
        let p = document.getElementById('slim-hl-panel');
        if (!p) createPanel();
        else p.style.display = 'block';
        panelState.open = true;
        save();
    });

    GM_registerMenuCommand(t('menuBlacklist'), () => {
        const host = location.hostname;
        if (!blacklist.includes(host)) {
            blacklist.push(host);
            save();
            alert(t('blacklisted', host));
            location.reload();
        }
    });
})();
