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
    const hls = navigationMatches();
    const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 1);
    const scrollY = window.scrollY;
    const step = Math.max(1, Math.ceil(hls.length / 500));
    bar.dataset.step = step;
    const tops = new Map();
    for (let i = 0; i < hls.length; i += step) tops.set(i, matchRect(hls[i]).top + scrollY);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < hls.length; i += step) {
        const mark = document.createElement('div');
        mark.className = 'mark' + (Math.floor(i / step) === Math.floor(currentIdx / step) ? ' active' : '');
        mark.style.top = Math.min(98, Math.max(0, (tops.get(i) / docHeight) * 100)) + '%';
        mark.style.backgroundColor = matchColor(hls[i]);
        mark.title = matchText(hls[i]).slice(0, 40);
        mark.dataset.i = i;
        frag.appendChild(mark);
    }
    bar.replaceChildren(frag);
}

const SKIP_SELECTOR = 'script, style, textarea, input, noscript, code, pre, select, option, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';
const OWN_UI = '#slim-hl-ui, #slim-hl-panel, #slim-hl-toggle, #slim-pos-bar, #slim-selection-tools, #slim-download';
const FRAME_BUDGET_MS = 10;
let matchers = [];
let ownNodes = new WeakSet(); // Markierungen und Textstücke, die dieses Skript selbst erzeugt hat
let refreshQueued = false;
let refreshRetryTimer;

function isOwnNode(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !el || !!el.closest('.slim-hl, ' + OWN_UI);
}

/** Markiert alle Textknoten unterhalb der Wurzeln, in Zeitscheiben von ~10 ms pro Frame. */
function highlightRoots(roots, done) {
    const generation = highlightGeneration;
    const queue = roots.slice();
    let walker = null;
    function step() {
        if (!enabled || isBlacklisted() || generation !== highlightGeneration) return done();
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
    rebuildPageMatches();
    updateCounterAndTitle();
    if (uiById('kw-list')) updateKeywordCounts();
    if (uiById('match-list')) renderMatchList();
    updatePosBar();
    if (observer && enabled && !isBlacklisted()) observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'style', 'class', 'contenteditable'] });
    if (refreshQueued || needsFullRefresh) { refreshQueued = false; needsFullRefresh = false; refreshHighlights(); return; }
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
    const errorEl = uiById('regex-error');
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
    if (!roots.length || !matchers.length) { if (pageTextDirty) afterHighlight(); return; }
    isHighlighting = true;
    highlightRoots(roots, afterHighlight);
}

let titlePrefix = '';

function updateCounterAndTitle() {
    highlightCount = navigationMatches().length;
    const counter = uiById('hl-counter');
    if (counter) {
        counter.textContent = highlightCount ? `${Math.max(0, currentIdx) + 1} / ${highlightCount}` : '0 / 0';
        counter.setAttribute('aria-label', t('statusCount', highlightCount ? Math.max(0, currentIdx) + 1 : 0, highlightCount));
    }
    for (const id of ['btn-prev', 'btn-next']) {
        const button = uiById(id);
        if (button) button.disabled = !highlightCount || pageSearchBusy;
    }
    let baseTitle = document.title;
    if (titlePrefix && baseTitle.startsWith(titlePrefix)) baseTitle = baseTitle.slice(titlePrefix.length);
    titlePrefix = highlightCount ? `(${highlightCount}) ` : '';
    if (document.title !== titlePrefix + baseTitle) document.title = titlePrefix + baseTitle;
}

let outlined = null;
let outlineTimer;

function goTo(delta) {
    const hls = navigationMatches();
    if (!hls.length) return;
    if (currentIdx < 0 && delta < 0) currentIdx = 0;
    currentIdx = (currentIdx + delta + hls.length) % hls.length;
    const target = hls[currentIdx];
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (target.range) {
        const rect = target.range.getBoundingClientRect();
        window.scrollBy({ top: rect.top + rect.height / 2 - innerHeight / 2, behavior });
    } else target.scrollIntoView({ behavior, block: 'center' });
    if (outlined && !outlined.range) outlined.style.outline = '';
    globalThis.CSS?.highlights?.delete('slim-page-current');
    clearTimeout(outlineTimer); outlined = target;
    if (target.range) { const active = new Highlight(target.range); active.priority = 10; CSS.highlights.set('slim-page-current', active); }
    else target.style.outline = '2px solid #ffca28';
    outlineTimer = setTimeout(() => {
        if (target.range) globalThis.CSS?.highlights?.delete('slim-page-current'); else target.style.outline = '';
        outlined = null;
    }, 700);
    updateCounterAndTitle();
    const bar = document.getElementById('slim-pos-bar');
    if (bar) {
        const prev = bar.querySelector('.active');
        if (prev) prev.classList.remove('active');
        if (bar.children[Math.floor(currentIdx / +(bar.dataset.step || 1))]) bar.children[Math.floor(currentIdx / +(bar.dataset.step || 1))].classList.add('active');
    } else {
        updatePosBar();
    }
    const items = uiQueryAll('#slim-hl-panel #match-list .match-item');
    if (items.length) items.forEach((el, i) => {
        el.classList.toggle('active', i === currentIdx);
        el.setAttribute('aria-current', String(i === currentIdx));
    });
}

const MATCH_LIST_MAX = 300;

function matchContext(el) {
    if (el.range) return el.context;
    const before = el.previousSibling?.textContent || '';
    const after = el.nextSibling?.textContent || '';
    return (before.slice(-36) + el.textContent + after.slice(0, 48)).replace(/\s+/g, ' ').trim();
}

function renderMatchList() {
    const list = uiById('match-list');
    if (!list) return;
    const focused = list.contains(uiActiveElement()) ? +uiActiveElement().dataset.index : -1;
    const hls = navigationMatches();
    if (!hls.length) {
        const empty = document.createElement('p');
        empty.className = 'empty'; empty.textContent = t('noMatches');
        list.replaceChildren(empty);
        return;
    }
    const frag = document.createDocumentFragment();
    const shown = Math.min(hls.length, MATCH_LIST_MAX);
    for (let i = 0; i < shown; i++) {
        const el = hls[i];
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'match-item' + (i === currentIdx ? ' active' : '');
        button.dataset.index = i;
        button.tabIndex = i === Math.max(0, Math.min(shown - 1, focused)) ? 0 : -1;
        button.setAttribute('aria-current', String(i === currentIdx));
        const context = matchContext(el);
        button.setAttribute('aria-label', `${t('matchNumber', i + 1, hls.length)}: ${context}`);
        const dot = document.createElement('span');
        dot.className = 'match-dot'; dot.style.backgroundColor = matchColor(el);
        dot.setAttribute('aria-hidden', 'true');
        button.append(dot, context);
        button.onclick = () => { currentIdx = i; goTo(0); };
        button.onfocus = () => {
            list.querySelectorAll('button.match-item').forEach(b => { b.tabIndex = b === button ? 0 : -1; });
        };
        button.onkeydown = e => {
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const index = e.key === 'Home' ? 0 : e.key === 'End' ? shown - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + shown) % shown;
            list.querySelectorAll('button.match-item')[index].focus();
        };
        frag.appendChild(button);
    }
    if (hls.length > shown) {
        const more = document.createElement('p');
        more.className = 'empty'; more.textContent = t('more', hls.length - shown);
        frag.appendChild(more);
    }
    list.replaceChildren(frag);
    if (focused >= 0) list.querySelectorAll('button.match-item')[Math.min(focused, shown - 1)].focus({ preventScroll: true });
}
