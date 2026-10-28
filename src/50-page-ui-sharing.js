function refreshPageResults() {
    if (isHighlighting) { refreshQueued = true; return; }
    rebuildPageMatches(); updateCounterAndTitle(); renderMatchList(); updatePosBar();
}
function addPageSelection(text) {
    if (!enabled || isBlacklisted() || !supportsPageHighlights()) return false;
    resetPageIdentity();
    const value = normalizePassage(text);
    if (!value) return false;
    if (!pageTerms.some(term => term.text.toLowerCase() === value.toLowerCase())) {
        rememberPageChange();
        pageTerms.push({ id: newPageId(), text: value, color: DEFAULT_COLOR, saved: false, anchor: null });
    }
    watchPageIdentity(); currentIdx = -1; isSelecting = false;
    const focusPanel = document.getElementById('slim-selection-tools')?.contains(document.activeElement);
    hideSelectionTools(); getSelection()?.removeAllRanges();
    setPanelOpen(true, !!focusPanel); refreshPageResults();
    return true;
}
function changePageTerm(term, action) {
    if (!ensurePageIdentity()) return false;
    rememberPageChange();
    const before = pageUndo.at(-1);
    action();
    const saved = savePageRecord(before.terms.some(item => item.saved));
    if (!saved) { pageTerms = before.terms; pageOptions = before.options; pageUndo.pop(); }
    currentIdx = -1; watchPageIdentity(); refreshPageResults();
    return saved;
}
function renderPageList() {
    watchPageIdentity(); renderSearchState();
    const list = document.getElementById('page-list');
    if (!list) return;
    const focused = list.contains(document.activeElement);
    list.replaceChildren();
    if (!pageTerms.length) {
        const empty = document.createElement('p'); empty.className = 'hint'; empty.textContent = t('pageHint'); list.append(empty);
    }
    for (const term of pageTerms) {
        const item = document.createElement('div'); item.className = 'page-item';
        const row = document.createElement('div'); row.className = 'page-row';
        const color = document.createElement('input'); color.type = 'color'; color.value = term.color;
        color.setAttribute('aria-label', t('pageColor', term.text));
        color.onchange = () => changePageTerm(term, () => { term.color = color.value; });
        const label = document.createElement('span'); label.className = 'page-term'; label.textContent = term.text; label.title = term.text;
        const count = document.createElement('span'); count.className = 'kw-count'; count.textContent = pageCounts.get(term.id) || 0;
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'icon-btn page-remove'; remove.innerHTML = icon('close'); remove.title = t('remove');
        remove.setAttribute('aria-label', t('deletePageTerm', term.text));
        remove.onclick = () => { changePageTerm(term, () => { pageTerms = pageTerms.filter(item => item.id !== term.id); }); document.getElementById('undo-page')?.focus({ preventScroll: true }); };
        row.append(color, label, count, remove);
        const meta = document.createElement('div'); meta.className = 'page-meta';
        const state = document.createElement('span'); state.className = 'hint page-state';
        state.textContent = term.saved && !pageSearchBusy && !(pageCounts.get(term.id) || 0) && enabled ? t('savedMissing') : t(term.saved ? 'pageSaved' : 'pageTemporary');
        const save = document.createElement('button'); save.type = 'button'; save.className = 'page-save'; save.setAttribute('aria-pressed', String(!!term.saved));
        save.textContent = t(term.saved ? 'forgetPageTerm' : 'rememberPageTerm');
        save.onclick = () => {
            if (!readSavedPages()) { setPanelStatus('storageUnsupported'); return; }
            if (!changePageTerm(term, () => { term.saved = !term.saved; })) return;
            setPanelStatus(term.saved ? 'pageRemembered' : 'pageForgotten');
        };
        meta.append(state, save); item.append(row, meta); list.append(item);
    }
    const clear = document.getElementById('clear-page'); if (clear) clear.hidden = !pageTerms.length;
    const undo = document.getElementById('undo-page'); if (undo) undo.hidden = !pageUndo.length;
    const scope = document.getElementById('navigation-scope'); if (scope) scope.textContent = t(pageTerms.length ? 'pageResults' : 'allResults');
    if (focused) document.getElementById('page-heading')?.focus({ preventScroll: true });
}

function safePageURL() {
    const url = new URL(location.href);
    url.username = ''; url.password = '';
    return url.href;
}
function quoteText(text, markdown = copyFormat === 'markdown') {
    const url = safePageURL();
    if (!markdown) return `“${text}”\n${url}`;
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `> ${escaped}\n\n[${t('sourceLabel')}](${url.replace(/[()]/g, c => encodeURIComponent(c))})`;
}
async function copyText(text, status = 'copied') {
    hideSelectionTools(true);
    try {
        if (typeof GM_setClipboard === 'function') await GM_setClipboard(text, 'text');
        else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else throw new Error('Clipboard unavailable');
        setPanelOpen(true, false); setPanelStatus(status);
    } catch {
        setPanelOpen(true, false);
        const field = document.getElementById('manual-copy'); field.value = text;
        document.getElementById('manual-copy-section').hidden = false;
        setPanelStatus('manualCopyReady'); field.focus(); field.select();
        field.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }
}
function selectedShare(kind) {
    if (!validSelectionSnapshot()) { hideSelectionTools(true); return; }
    const text = selectionSnapshot.text;
    if (kind === 'quote') { void copyText(quoteText(text)); return; }
    const url = new URL(safePageURL());
    if (!('fragmentDirective' in document) || !['http:', 'https:'].includes(url.protocol)) { void copyText(url.href, 'plainLinkCopied'); return; }
    const anchor = url.hash.slice(1).split(':~:')[0];
    url.hash = anchor + ':~:text=' + encodeURIComponent(text).replace(/-/g, '%2D');
    void copyText(url.href);
}
function downloadLocal(name, contents, type) {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const a = document.createElement('a'); a.id = 'slim-download'; a.href = url; a.download = name;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportSavedPages() {
    const data = GM_getValue('hl_page_annotations', { version: 1, pages: {} });
    downloadLocal('slim-search-pages.json', JSON.stringify(data, null, 2), 'application/json');
}
function exportPageMarkdown() {
    if (!ensurePageIdentity()) return;
    const lines = pageTerms.map(term => quoteText(term.text, true));
    downloadLocal('slim-search-highlights.md', lines.join('\n\n---\n\n') + '\n', 'text/markdown');
}

function shortcutLabel() {
    if (!selectionShortcut) return t('shortcutOff');
    return [selectionShortcut.ctrl && t('controlKey'), selectionShortcut.alt && 'Alt', selectionShortcut.shift && 'Shift', selectionShortcut.meta && 'Meta', selectionShortcut.key.toUpperCase()].filter(Boolean).join(' + ');
}

function renderShortcut() {
    const label = document.getElementById('shortcut-label'); if (label) label.textContent = shortcutLabel();
    const hint = document.getElementById('page-shortcut-hint'); if (hint) hint.textContent = t('shortcutHint', shortcutLabel());
    const record = document.getElementById('record-shortcut'); if (record) record.textContent = t(recordingShortcut ? 'recordingShortcut' : 'recordShortcut');
}

function shortcutMatches(e) {
    return selectionShortcut && e.key.toLowerCase() === selectionShortcut.key.toLowerCase() && e.altKey === !!selectionShortcut.alt && e.ctrlKey === !!selectionShortcut.ctrl && e.shiftKey === !!selectionShortcut.shift && e.metaKey === !!selectionShortcut.meta;
}

function editingTarget(target) {
    return target instanceof Element && (!!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') || target.isContentEditable);
}

function selectedDocumentText() {
    const sel = getSelection();
    if (!sel?.rangeCount || sel.isCollapsed || editingTarget(document.activeElement)) return null;
    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!parent || parent.closest(SKIP_SELECTOR + ', ' + OWN_UI)) return null;
    if ([sel.anchorNode, sel.focusNode].some(node => node && (node.nodeType === 1 ? node : node.parentElement)?.closest(SKIP_SELECTOR + ', ' + OWN_UI))) return null;
    const text = normalizePassage(sel.toString());
    return text ? { text, rawText: range.toString(), url: location.href, range: range.cloneRange() } : null;
}

function validSelectionSnapshot() {
    const item = selectionSnapshot;
    return !!item && item.url === location.href && item.range.startContainer.isConnected && item.range.endContainer.isConnected && !item.range.collapsed && item.range.toString() === item.rawText && [...item.range.getClientRects()].some(r => r.width && r.height);
}

function hideSelectionTools(restoreFocus = false) {
    const tools = document.getElementById('slim-selection-tools');
    const hadFocus = tools?.contains(document.activeElement);
    if (tools) tools.hidden = true;
    selectionSnapshot = null;
    if (restoreFocus && hadFocus) document.getElementById('slim-hl-toggle')?.focus({ preventScroll: true });
}

function positionSelectionTools() {
    const tools = document.getElementById('slim-selection-tools');
    if (!tools || tools.hidden || !selectionSnapshot) return;
    const rects = [...selectionSnapshot.range.getClientRects()];
    const rect = rects.filter(r => r.bottom > 0 && r.top < innerHeight).at(-1);
    if (!rect) { hideSelectionTools(); return; }
    const box = tools.getBoundingClientRect();
    tools.style.left = Math.max(8, Math.min(rect.right, innerWidth - box.width - 8)) + 'px';
    const y = rect.bottom + 8 + box.height < innerHeight ? rect.bottom + 8 : rect.top - box.height - 8;
    tools.style.top = Math.max(8, Math.min(y, innerHeight - box.height - 8)) + 'px';
}

function createSelectionTools() {
    const tools = document.createElement('div'); tools.id = 'slim-selection-tools'; tools.hidden = true;
    tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', t('selectionActions')); tools.lang = currentLang();
    tools.innerHTML = `<button type="button" id="selection-trigger" aria-label="${t('selectionActions')}" title="${t('selectionActions')}" aria-expanded="false" aria-controls="selection-actions">${icon('highlight')}</button>
        <div id="selection-actions" hidden><button type="button" id="selection-highlight" title="${t('highlightSelectionHint')}">${t('highlightSelection')}</button><button type="button" id="selection-web">${t('webSearch')}</button><details id="selection-share"><summary>${t('shareActions')}</summary><button type="button" id="selection-quote">${t('copyQuote')}</button><button type="button" id="selection-link">${t('copyLink')}</button></details><p id="selection-support" role="status" hidden>${t('highlightUnsupported')}</p></div>`;
    const expand = () => { tools.querySelector('#selection-actions').hidden = false; tools.querySelector('#selection-trigger').setAttribute('aria-expanded', 'true'); positionSelectionTools(); };
    tools.querySelector('#selection-trigger').onclick = () => {
        const actions = tools.querySelector('#selection-actions');
        if (actions.hidden) expand(); else { actions.hidden = true; tools.querySelector('#selection-trigger').setAttribute('aria-expanded', 'false'); positionSelectionTools(); }
    };
    tools.querySelector('#selection-trigger').onpointerenter = expand;
    tools.onpointerdown = e => { if (e.button === 0) e.preventDefault(); };
    tools.querySelector('#selection-highlight').onclick = () => { if (validSelectionSnapshot()) addPageSelection(selectionSnapshot.text); else hideSelectionTools(true); };
    tools.querySelector('#selection-web').onclick = () => {
        if (!validSelectionSnapshot()) { hideSelectionTools(true); return; }
        const text = selectionSnapshot.text; hideSelectionTools(true);
        window.open((SEARCH_URLS[searchEngine] || SEARCH_URLS.google) + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
    };
    tools.querySelector('#selection-quote').onclick = () => selectedShare('quote');
    tools.querySelector('#selection-link').onclick = () => selectedShare('link');
    document.body.append(tools);
    applyAppearance();
    return tools;
}

function updateSelectionTools() {
    const existing = document.getElementById('slim-selection-tools');
    if (existing?.contains(document.activeElement)) { if (!validSelectionSnapshot()) hideSelectionTools(true); return; }
    if (isBlacklisted() || composing) { hideSelectionTools(); return; }
    const selected = selectedDocumentText();
    if (!selected) { hideSelectionTools(); return; }
    selectionSnapshot = selected;
    const tools = existing || createSelectionTools();
    tools.hidden = false; tools.querySelector('#selection-actions').hidden = true; tools.querySelector('#selection-share').open = false;
    tools.querySelector('#selection-trigger').setAttribute('aria-expanded', 'false');
    tools.querySelector('#selection-highlight').disabled = !enabled || !supportsPageHighlights();
    tools.querySelector('#selection-support').hidden = supportsPageHighlights();
    positionSelectionTools();
}
