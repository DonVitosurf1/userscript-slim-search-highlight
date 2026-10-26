// ==UserScript==
// @name         Slim Search Highlight Pro v3.10
// @namespace    https://github.com/DonVitosurf1/userscript-slim-search-highlight
// @version      3.10
// @description  Positionsanzeige + Keyword-Suchfeld
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let keywords = GM_getValue('hl_keywords', []);
    let enabled = GM_getValue('hl_enabled', true);
    let autoSearch = GM_getValue('hl_auto_search', true);
    let panelPos = GM_getValue('hl_panel_pos', { x: 20, y: 80 });
    let panelState = GM_getValue('hl_panel_state', { open: false, minimized: false });
    let searchHistory = GM_getValue('hl_search_history', []);
    let blacklist = GM_getValue('hl_blacklist', ['docs.google.com', 'youtube.com', 'netflix.com']);
    let searchEngine = GM_getValue('hl_search_engine', 'google');
    let showPosBar = GM_getValue('hl_show_posbar', true);

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
        #slim-hl-panel {
            position: fixed; z-index: 2147483647;
            background: #1a1a1a; color: #f0f0f0;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08);
            font: 13.5px/1.45 system-ui, -apple-system, sans-serif;
            min-width: 320px; max-width: 440px;
            user-select: none;
        }
        #slim-hl-panel.minimized .panel-body { display: none; }
        #slim-hl-header {
            padding: 12px 16px; background: #242424;
            border-radius: 10px 10px 0 0; cursor: move;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #333;
        }
        #slim-hl-header span { font-weight: 650; letter-spacing: 0.2px; }
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
        #slim-hl-toggle {
            position: fixed; z-index: 2147483646; bottom: 20px; right: 20px;
            width: 48px; height: 48px; border-radius: 50%; background: #ffca28;
            color: #000; border: none; font-size: 22px; cursor: pointer;
            box-shadow: 0 4px 18px rgba(0,0,0,0.4);
            transition: transform 0.15s;
        }
        #slim-hl-toggle:hover { transform: scale(1.1); }
        select#search-engine, input[type=text] {
            background: #222; color: #eee; border: 1px solid #444;
            border-radius: 6px; padding: 7px 9px; width: 100%; margin-top: 4px;
        }
        label { font-size: 13px; display: flex; align-items: center; gap: 8px; margin: 8px 0; }
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

    function save() {
        GM_setValue('hl_keywords', keywords);
        GM_setValue('hl_enabled', enabled);
        GM_setValue('hl_auto_search', autoSearch);
        GM_setValue('hl_panel_pos', panelPos);
        GM_setValue('hl_panel_state', panelState);
        GM_setValue('hl_search_history', searchHistory.slice(0, 8));
        GM_setValue('hl_blacklist', blacklist);
        GM_setValue('hl_search_engine', searchEngine);
        GM_setValue('hl_show_posbar', showPosBar);
    }

    function isBlacklisted() {
        const host = location.hostname.toLowerCase();
        return blacklist.some(b => host.includes(b.toLowerCase()));
    }

    function isSearchEngine(url) {
        return url && SEARCH_ENGINES.some(s => url.toLowerCase().includes(s));
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

    function getCrossPageTerms() {
        const result = [];
        const m = location.hash.match(/(?:sjhl|hl)=([^&]+)/i);
        if (m) decodeURIComponent(m[1]).split(/[,+]/).forEach(t => t.trim() && result.push(t.trim()));

        const stored = GM_getValue('hl_cross_terms', null);
        if (stored && stored.terms && (Date.now() - stored.timestamp) < CROSS_TTL) {
            result.push(...stored.terms);
        }
        if (isSearchEngine(document.referrer)) {
            const q = extractQuery(document.referrer);
            if (q) q.split(/\s+/).forEach(w => w.length > 1 && !IGNORE_WORDS.has(w.toLowerCase()) && result.push(w));
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

    function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function buildMatchers() {
        lastErrors = [];
        return getActiveKeywords().map(k => {
            let pattern, flags = 'gi';
            if (k.regex || (k.text.startsWith('/') && k.text.lastIndexOf('/') > 0)) {
                const last = k.text.lastIndexOf('/');
                pattern = k.text.slice(1, last);
                flags = k.text.slice(last + 1) || 'gi';
            } else {
                const escaped = escapeRegExp(k.text);
                pattern = (k.wholeWord !== false && !k.text.includes(' ')) ? '\\b' + escaped + '\\b' : escaped;
            }
            try {
                return { re: new RegExp(pattern, flags), color: k.color || DEFAULT_COLOR, text: k.text };
            } catch (e) {
                lastErrors.push(`Ungültiger Regex bei „${k.text}“`);
                return null;
            }
        }).filter(Boolean);
    }

    function cleanupHighlights(root = document.body) {
        root.querySelectorAll('.slim-hl').forEach(span => {
            const parent = span.parentNode;
            if (!parent) return;
            while (span.firstChild) parent.insertBefore(span.firstChild, span);
            parent.removeChild(span);
            parent.normalize();
        });
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
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    color: m.color,
                    kw: m.text
                });
                if (!m.re.global) break;
            }
        }
        if (!matches.length) return;

        matches.sort((a, b) => b.start - a.start);

        let node = textNode;
        for (const m of matches) {
            try {
                if (m.start >= node.textContent.length) continue;
                const middle = node.splitText(m.start);
                const after = middle.splitText(m.end - m.start);
                const mark = document.createElement('span');
                mark.className = 'slim-hl';
                mark.style.backgroundColor = m.color;
                mark.style.color = '#000';
                mark.textContent = m.text;
                mark.dataset.kw = m.kw;
                middle.parentNode.replaceChild(mark, middle);
                keywordCounts[m.kw] = (keywordCounts[m.kw] || 0) + 1;
                node = after;
            } catch {}
        }
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
            document.body.appendChild(bar);
        }
        bar.innerHTML = '';

        const hls = [...document.querySelectorAll('.slim-hl')];
        const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 1);

        hls.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            const absTop = rect.top + window.scrollY;
            const percent = Math.min(98, Math.max(0, (absTop / docHeight) * 100));
            const mark = document.createElement('div');
            mark.className = 'mark' + (i === currentIdx ? ' active' : '');
            mark.style.top = percent + '%';
            mark.style.backgroundColor = el.style.backgroundColor || DEFAULT_COLOR;
            mark.title = el.textContent.slice(0, 40);
            mark.onclick = (e) => {
                e.stopPropagation();
                currentIdx = i;
                goTo(0);
            };
            bar.appendChild(mark);
        });
    }

    function refreshHighlights() {
        if (!enabled || isSelecting || isHighlighting || isBlacklisted()) return;
        isHighlighting = true;
        keywordCounts = {};
        currentIdx = -1;

        if (observer) observer.disconnect();

        const savedRange = saveSelection();
        cleanupHighlights(document.body);

        const matchers = buildMatchers();
        const errorEl = document.getElementById('regex-error');
        if (errorEl) errorEl.textContent = lastErrors.join('\n');

        if (!matchers.length) {
            isHighlighting = false;
            restoreSelection(savedRange);
            updateCounterAndTitle();
            if (document.getElementById('kw-list')) renderKeywordList();
            if (document.getElementById('match-list')) renderMatchList();
            updatePosBar();
            if (observer && enabled) observer.observe(document.body, { childList: true, subtree: true });
            return;
        }

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                const p = n.parentElement;
                if (!p || ['SCRIPT','STYLE','TEXTAREA','INPUT','NOSCRIPT','CODE','PRE','SELECT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
                if (p.closest('.slim-hl') || p.closest('#slim-hl-panel') || p.closest('#slim-pos-bar')) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        let processed = 0;
        const chunkSize = 80;
        function processChunk() {
            let count = 0;
            let node;
            while (count < chunkSize && (node = walker.nextNode())) {
                highlightInTextNode(node, matchers);
                count++;
                processed++;
            }
            if (node) {
                requestAnimationFrame(processChunk);
            } else {
                restoreSelection(savedRange);
                isHighlighting = false;
                updateCounterAndTitle();
                if (document.getElementById('kw-list')) renderKeywordList();
                if (document.getElementById('match-list')) renderMatchList();
                updatePosBar();
                if (observer && enabled) observer.observe(document.body, { childList: true, subtree: true });
            }
        }
        requestAnimationFrame(processChunk);
    }

    function updateCounterAndTitle() {
        const hls = document.querySelectorAll('.slim-hl');
        highlightCount = hls.length;
        const counter = document.getElementById('hl-counter');
        if (counter) counter.textContent = highlightCount ? `${Math.max(0, currentIdx) + 1} / ${highlightCount}` : '0 / 0';
        const baseTitle = document.title.replace(/^\(\d+\)\s*/, '');
        document.title = highlightCount ? `(${highlightCount}) ${baseTitle}` : baseTitle;
    }

    function goTo(delta) {
        const hls = [...document.querySelectorAll('.slim-hl')];
        if (!hls.length) return;
        currentIdx = (currentIdx + delta + hls.length) % hls.length;
        hls[currentIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        hls[currentIdx].style.outline = '2px solid #ffca28';
        setTimeout(() => hls[currentIdx] && (hls[currentIdx].style.outline = ''), 700);
        updateCounterAndTitle();
        updatePosBar();
        document.querySelectorAll('.match-item').forEach((el, i) => {
            el.classList.toggle('active', i === currentIdx);
        });
    }

    function renderMatchList() {
        const list = document.getElementById('match-list');
        if (!list) return;
        const hls = [...document.querySelectorAll('.slim-hl')];
        if (!hls.length) {
            list.innerHTML = '<div class="empty">Keine Treffer auf dieser Seite</div>';
            return;
        }
        list.innerHTML = '';
        hls.forEach((el, i) => {
            const div = document.createElement('div');
            div.className = 'match-item' + (i === currentIdx ? ' active' : '');
            div.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${el.style.backgroundColor};margin-right:8px;"></span>${el.textContent.slice(0, 44)}`;
            div.onclick = () => { currentIdx = i; goTo(0); };
            list.appendChild(div);
        });
    }

    function createPanel() {
        if (document.getElementById('slim-hl-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'slim-hl-panel';
        panel.style.left = panelPos.x + 'px';
        panel.style.top = panelPos.y + 'px';
        if (panelState.minimized) panel.classList.add('minimized');
        panel.innerHTML = `
            <div id="slim-hl-header">
                <span>Highlight</span>
                <div>
                    <button id="btn-min" title="Minimieren">−</button>
                    <button id="btn-close" title="Schließen">×</button>
                </div>
            </div>
            <div class="panel-body">
                <div class="counter" id="hl-counter">0 / 0</div>
                <div class="nav-btns">
                    <button id="btn-prev" title="Vorheriges Highlight (Alt + ←)">◀</button>
                    <button id="btn-next" title="Nächstes Highlight (Alt + →)">▶</button>
                </div>
                <div id="match-list"></div>
                <div class="section-title">Keywords</div>
                <input type="text" id="kw-search" placeholder="Keywords suchen…" value="${kwFilter}">
                <div id="kw-list"></div>
                <div id="regex-error" class="error"></div>
                <div style="display:flex;gap:8px;margin-top:10px;">
                    <input type="text" id="new-kw" placeholder="Keyword oder /regex/" style="flex:1;">
                    <input type="color" id="new-color" value="${DEFAULT_COLOR}">
                </div>
                <label style="margin-top:8px;"><input type="checkbox" id="new-whole" checked> Nur ganze Wörter</label>
                <input type="text" id="new-domains" placeholder="Nur auf Domains (optional, kommagetrennt)">
                <button id="add-kw-btn" style="margin-top:10px;width:100%;">Hinzufügen</button>
                <div id="history-container"></div>
                <div class="section-title">Einstellungen</div>
                <label><input type="checkbox" id="chk-enabled" ${enabled?'checked':''}> Highlights aktiv</label>
                <label><input type="checkbox" id="chk-auto" ${autoSearch?'checked':''}> Automatisch von Suche übernehmen</label>
                <label><input type="checkbox" id="chk-posbar" ${showPosBar?'checked':''}> Positionsanzeige anzeigen</label>
                <div style="margin-top:10px;font-size:12.5px;">Suchmaschine für Rechtsklick:</div>
                <select id="search-engine">
                    <option value="google" ${searchEngine==='google'?'selected':''}>Google</option>
                    <option value="ddg" ${searchEngine==='ddg'?'selected':''}>DuckDuckGo</option>
                    <option value="brave" ${searchEngine==='brave'?'selected':''}>Brave</option>
                    <option value="bing" ${searchEngine==='bing'?'selected':''}>Bing</option>
                </select>
            </div>`;
        document.body.appendChild(panel);
        if (panelState.open) panel.style.display = 'block';

        let dragging = false, dx, dy;
        panel.querySelector('#slim-hl-header').onmousedown = e => {
            if (e.target.tagName === 'BUTTON') return;
            dragging = true;
            dx = e.clientX - panel.offsetLeft;
            dy = e.clientY - panel.offsetTop;
        };
        document.onmousemove = e => {
            if (!dragging) return;
            panel.style.left = (e.clientX - dx) + 'px';
            panel.style.top = (e.clientY - dy) + 'px';
            panelPos = { x: panel.offsetLeft, y: panel.offsetTop };
            save();
        };
        document.onmouseup = () => dragging = false;

        panel.querySelector('#btn-min').onclick = () => {
            panel.classList.toggle('minimized');
            panelState.minimized = panel.classList.contains('minimized');
            save();
        };
        panel.querySelector('#btn-close').onclick = () => {
            panel.style.display = 'none';
            panelState.open = false;
            save();
        };
        panel.querySelector('#btn-prev').onclick = () => goTo(-1);
        panel.querySelector('#btn-next').onclick = () => goTo(1);

        panel.querySelector('#kw-search').oninput = e => {
            kwFilter = e.target.value.trim().toLowerCase();
            renderKeywordList();
        };

        panel.querySelector('#add-kw-btn').onclick = () => {
            const text = panel.querySelector('#new-kw').value.trim();
            if (!text) return;
            if (keywords.some(k => k.text.toLowerCase() === text.toLowerCase())) {
                alert('Keyword existiert bereits.');
                return;
            }
            const domainsRaw = panel.querySelector('#new-domains').value.trim();
            const domains = domainsRaw ? domainsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];
            keywords.push({
                text,
                color: panel.querySelector('#new-color').value,
                regex: text.startsWith('/') && text.lastIndexOf('/') > 0,
                wholeWord: panel.querySelector('#new-whole').checked,
                domains
            });
            save();
            panel.querySelector('#new-kw').value = '';
            panel.querySelector('#new-domains').value = '';
            refreshHighlights();
        };
        panel.querySelector('#chk-enabled').onchange = e => {
            enabled = e.target.checked;
            save();
            if (enabled) {
                refreshHighlights();
                if (observer) observer.observe(document.body, { childList: true, subtree: true });
            } else {
                cleanupHighlights();
                updateCounterAndTitle();
                updatePosBar();
                if (observer) observer.disconnect();
            }
        };
        panel.querySelector('#chk-auto').onchange = e => { autoSearch = e.target.checked; save(); refreshHighlights(); };
        panel.querySelector('#chk-posbar').onchange = e => {
            showPosBar = e.target.checked;
            save();
            updatePosBar();
        };
        panel.querySelector('#search-engine').onchange = e => { searchEngine = e.target.value; save(); };

        renderKeywordList();
        renderHistory();
        setTimeout(() => { updateCounterAndTitle(); renderMatchList(); updatePosBar(); }, 200);
    }

    function renderKeywordList() {
        const list = document.getElementById('kw-list');
        if (!list) return;
        const filtered = keywords.filter(k => !kwFilter || k.text.toLowerCase().includes(kwFilter));
        if (!filtered.length) {
            list.innerHTML = `<div class="empty">${keywords.length ? 'Keine Treffer für die Suche' : 'Noch keine Keywords gespeichert'}</div>`;
            return;
        }
        list.innerHTML = '';
        filtered.forEach(k => {
            const originalIndex = keywords.indexOf(k);
            const count = keywordCounts[k.text] || 0;
            const div = document.createElement('div');
            div.className = 'kw-item';
            div.innerHTML = `
                <input type="color" value="${k.color}" data-i="${originalIndex}" title="Farbe ändern">
                <input type="text" value="${k.text.replace(/"/g,'&quot;')}" data-i="${originalIndex}">
                <span class="kw-count" title="Treffer auf dieser Seite">${count}</span>
                <button data-i="${originalIndex}" title="Löschen">×</button>`;
            list.appendChild(div);
        });
        list.querySelectorAll('input[type=color]').forEach(el => el.onchange = () => {
            keywords[+el.dataset.i].color = el.value;
            save();
            refreshHighlights();
        });
        list.querySelectorAll('input[type=text]').forEach(el => el.onchange = () => {
            keywords[+el.dataset.i].text = el.value;
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
        const container = document.getElementById('history-container');
        if (!container || !searchHistory.length) return;
        container.innerHTML = '<div class="section-title">Letzte Suchen</div>';
        searchHistory.forEach(h => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.margin = '4px 0';
            btn.style.width = '100%';
            btn.textContent = h.slice(0, 38) + (h.length > 38 ? '…' : '');
            btn.title = h;
            btn.onclick = () => {
                GM_setValue('hl_cross_terms', { terms: h.split(/\s+/), timestamp: Date.now() });
                refreshHighlights();
            };
            container.appendChild(btn);
        });
    }

    function createToggle() {
        if (document.getElementById('slim-hl-toggle')) return;
        const btn = document.createElement('button');
        btn.id = 'slim-hl-toggle';
        btn.textContent = '✦';
        btn.title = 'Highlight Panel öffnen';
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

    document.addEventListener('mousedown', () => { isSelecting = true; });
    document.addEventListener('mouseup', () => { setTimeout(() => { isSelecting = false; }, 80); });

    document.addEventListener('click', e => {
        const hl = e.target.closest('.slim-hl');
        if (!hl || !e.altKey) return;
        e.preventDefault();
        const kw = hl.dataset.kw;
        keywords = keywords.filter(k => k.text !== kw);
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
        if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goTo(1); }
        if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goTo(-1); }
    });

    let scrollTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(updatePosBar, 80);
    }, { passive: true });

    let debounceTimer;
    function setupObserver() {
        observer = new MutationObserver(() => {
            if (isSelecting || isHighlighting || isBlacklisted()) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (enabled && !isSelecting && !isHighlighting) refreshHighlights();
            }, 280);
        });
        if (enabled) observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        if (isBlacklisted()) return;
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

    GM_registerMenuCommand('Panel öffnen', () => {
        let p = document.getElementById('slim-hl-panel');
        if (!p) createPanel();
        else p.style.display = 'block';
        panelState.open = true;
        save();
    });

    GM_registerMenuCommand('Aktuelle Domain zur Blacklist', () => {
        const host = location.hostname;
        if (!blacklist.includes(host)) {
            blacklist.push(host);
            save();
            alert(`${host} zur Blacklist hinzugefügt`);
            location.reload();
        }
    });
})();
