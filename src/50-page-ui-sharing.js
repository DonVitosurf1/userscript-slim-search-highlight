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
        pageTerms.push({ id: newPageId(), text: value, color: nextPageHighlightColor(), saved: false, anchor: null });
    }
    watchPageIdentity(); currentIdx = -1; isSelecting = false;
    const focusPanel = uiById('slim-selection-tools')?.contains(uiActiveElement());
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
    const list = uiById('page-list');
    if (!list) return;
    const focused = list.contains(uiActiveElement());
    list.replaceChildren();
    if (!pageTerms.length) {
        const empty = document.createElement('p'); empty.className = 'hint'; empty.textContent = t('pageHintShort'); list.append(empty);
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
        remove.onclick = () => { changePageTerm(term, () => { pageTerms = pageTerms.filter(item => item.id !== term.id); }); uiById('undo-page')?.focus({ preventScroll: true }); };
        const content = document.createElement('div'); content.className = 'page-label';
        const state = document.createElement('span'); state.className = 'hint page-state';
        state.textContent = term.saved && !pageSearchBusy && !(pageCounts.get(term.id) || 0) && enabled ? t('savedMissing') : t(term.saved ? 'pageSavedShort' : 'pageTemporary');
        const save = document.createElement('button'); save.type = 'button'; save.className = 'icon-btn page-save'; save.setAttribute('aria-pressed', String(!!term.saved));
        save.innerHTML = icon(term.saved ? 'bookmarked' : 'bookmark');
        save.setAttribute('aria-label', t(term.saved ? 'forgetPageTerm' : 'rememberPageTerm'));
        save.title = t(term.saved ? 'forgetPageTerm' : 'rememberPageTerm');
        save.onclick = () => {
            if (!readSavedPages()) { setPanelStatus('storageUnsupported'); return; }
            if (!changePageTerm(term, () => { term.saved = !term.saved; })) return;
            setPanelStatus(term.saved ? 'pageRemembered' : 'pageForgotten');
        };
        content.append(label, state); row.append(color, content, count, save, remove); item.append(row); list.append(item);
    }
    const clear = uiById('clear-page'); if (clear) clear.hidden = !pageTerms.length;
    const undo = uiById('undo-page'); if (undo) undo.hidden = !pageUndo.length;
    const scope = uiById('navigation-scope'); if (scope) scope.textContent = t(pageTerms.length ? 'pageResults' : 'allResults');
    if (focused) uiById('page-heading')?.focus({ preventScroll: true });
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
let copyFeedbackTimer;
function ensureCopyFeedback() {
    let feedback = uiById('slim-hl-feedback');
    if (!feedback) {
        feedback = document.createElement('div'); feedback.id = 'slim-hl-feedback'; feedback.hidden = true;
        feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-atomic', 'true');
        ensureUIRoot().append(feedback);
    }
    return feedback;
}
function showCopyFeedback(key, anchor) {
    const feedback = ensureCopyFeedback();
    clearTimeout(copyFeedbackTimer);
    feedback.dataset.message = key; feedback.lang = currentLang(); feedback.hidden = false;
    applyAppearance();
    const box = feedback.getBoundingClientRect(), viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    feedback.style.left = Math.max(left + 8, Math.min(anchor?.x ?? left + width - box.width - 20, left + width - box.width - 8)) + 'px';
    feedback.style.top = Math.max(top + 8, Math.min(anchor?.y ?? top + height - box.height - 20, top + height - box.height - 8)) + 'px';
    copyFeedbackTimer = setTimeout(() => { feedback.hidden = true; feedback.textContent = ''; }, 6000);
}
async function copyText(text, status = 'copied') {
    const anchor = uiById('slim-selection-tools')?.getBoundingClientRect();
    const focused = uiById('slim-selection-tools')?.contains(uiActiveElement());
    const origin = selectionSnapshot?.focusTarget;
    if (focused) uiActiveElement()?.blur();
    hideSelectionTools();
    if (focused && origin?.isConnected) origin.focus({ preventScroll: true });
    try {
        if (typeof GM_setClipboard === 'function') await GM_setClipboard(text, 'text');
        else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else throw new Error('Clipboard unavailable');
        showCopyFeedback(status, anchor);
    } catch {
        setPanelOpen(true, false);
        const field = uiById('manual-copy'); field.value = text;
        uiById('manual-copy-section').hidden = false;
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
    if (typeof GM_download !== 'function') { setPanelStatus('downloadUnsupported'); return; }
    const url = URL.createObjectURL(new Blob([contents], { type }));
    let timer;
    const cleanup = () => { clearTimeout(timer); URL.revokeObjectURL(url); };
    timer = setTimeout(cleanup, 60000);
    try {
        GM_download({ url, name, saveAs: true, onload: cleanup, onerror: () => { cleanup(); setPanelStatus('downloadFailed'); } });
    } catch { cleanup(); setPanelStatus('downloadFailed'); }
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
    const label = uiById('shortcut-label'); if (label) label.textContent = shortcutLabel();
    const hint = uiById('page-shortcut-hint'); if (hint) hint.textContent = t('shortcutHint', shortcutLabel());
    const record = uiById('record-shortcut'); if (record) record.textContent = t(recordingShortcut ? 'recordingShortcut' : 'recordShortcut');
}

function shortcutMatches(e) {
    return selectionShortcut && e.key.toLowerCase() === selectionShortcut.key.toLowerCase() && e.altKey === !!selectionShortcut.alt && e.ctrlKey === !!selectionShortcut.ctrl && e.shiftKey === !!selectionShortcut.shift && e.metaKey === !!selectionShortcut.meta;
}

function editingTarget(target) {
    return target instanceof Element && (!!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') || target.isContentEditable);
}

function selectedDocumentText() {
    const sel = getSelection();
    if (!sel?.rangeCount || sel.isCollapsed || editingTarget(uiActiveElement())) return null;
    const range = sel.getRangeAt(0);
    const parent = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
    if (!parent || parent.closest(SKIP_SELECTOR + ', ' + OWN_UI)) return null;
    if ([sel.anchorNode, sel.focusNode].some(node => node && (node.nodeType === 1 ? node : node.parentElement)?.closest(SKIP_SELECTOR + ', ' + OWN_UI))) return null;
    const text = normalizePassage(sel.toString());
    return text ? { text, rawText: range.toString(), url: location.href, range: range.cloneRange(), focusTarget: uiActiveElement() } : null;
}

function validSelectionSnapshot() {
    const item = selectionSnapshot;
    return !!item && item.url === location.href && item.range.startContainer.isConnected && item.range.endContainer.isConnected && !item.range.collapsed && item.range.toString() === item.rawText && [...item.range.getClientRects()].some(r => r.width && r.height);
}

function hideSelectionTools(restoreFocus = false) {
    const tools = uiById('slim-selection-tools');
    const hadFocus = tools?.contains(uiActiveElement());
    if (tools) tools.hidden = true;
    selectionSnapshot = null;
    if (restoreFocus && hadFocus) uiById('slim-hl-toggle')?.focus({ preventScroll: true });
}

function positionSelectionTools() {
    const tools = uiById('slim-selection-tools');
    if (!tools || tools.hidden || !selectionSnapshot) return;
    const rects = [...selectionSnapshot.range.getClientRects()];
    const rect = rects.filter(r => r.bottom > 0 && r.top < innerHeight).at(-1);
    if (!rect) { hideSelectionTools(); return; }
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    tools.style.maxWidth = Math.max(0, width - 16) + 'px'; tools.style.maxHeight = Math.max(0, height - 16) + 'px';
    tools.style.setProperty('--hl-selection-menu-height', Math.max(0, height - 20 - tools.querySelector('#selection-trigger').getBoundingClientRect().height) + 'px');
    const box = tools.getBoundingClientRect();
    const above = rect.bottom + 8 + box.height > top + height && rect.top - top > top + height - rect.bottom;
    tools.dataset.placement = above ? 'above' : 'below';
    tools.style.left = Math.max(left + 8, Math.min(rect.right, left + width - box.width - 8)) + 'px';
    const y = above ? rect.top - box.height - 8 : rect.bottom + 8;
    tools.style.top = Math.max(top + 8, Math.min(y, top + height - box.height - 8)) + 'px';
}

function createSelectionTools() {
    const tools = document.createElement('div'); tools.id = 'slim-selection-tools'; tools.hidden = true;
    tools.setAttribute('role', 'toolbar'); tools.setAttribute('aria-label', t('selectionActions')); tools.lang = currentLang();
    tools.innerHTML = `<button type="button" id="selection-trigger" aria-label="${t('selectionActions')}" title="${t('selectionActions')}" aria-expanded="false" aria-controls="selection-actions"><img data-hl-logo src="${LOGOS[uiTheme]}" width="26" height="26" alt="" draggable="false"></button>
        <div id="selection-actions" hidden><button type="button" id="selection-highlight" title="${t('highlightSelectionHint')}">${icon('highlightAll')}<span>${t('highlightSelection')}</span></button><button type="button" id="selection-web">${icon('searchWeb')}<span>${t('webSearch')}</span></button><details id="selection-share"><summary>${t('shareActions')}</summary><button type="button" id="selection-quote">${t('copyQuote')}</button><button type="button" id="selection-link">${t('copyLink')}</button></details><p id="selection-support" role="status" hidden>${t('highlightUnsupported')}</p></div>`;
    const expand = () => { tools.querySelector('#selection-actions').hidden = false; tools.querySelector('#selection-trigger').setAttribute('aria-expanded', 'true'); positionSelectionTools(); };
    tools.querySelector('#selection-trigger').onclick = () => {
        const actions = tools.querySelector('#selection-actions');
        if (actions.hidden) expand(); else { actions.hidden = true; tools.querySelector('#selection-trigger').setAttribute('aria-expanded', 'false'); positionSelectionTools(); }
    };
    tools.querySelector('#selection-trigger').onpointerenter = expand;
    tools.querySelector('#selection-share').addEventListener('toggle', positionSelectionTools);
    tools.onpointerdown = e => { if (e.button === 0) e.preventDefault(); };
    tools.querySelector('#selection-highlight').onclick = () => { if (validSelectionSnapshot()) addPageSelection(selectionSnapshot.text); else hideSelectionTools(true); };
    tools.querySelector('#selection-web').onclick = () => {
        if (!validSelectionSnapshot()) { hideSelectionTools(true); return; }
        const text = selectionSnapshot.text; hideSelectionTools(true);
        window.open((SEARCH_URLS[searchEngine] || SEARCH_URLS.google) + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
    };
    tools.querySelector('#selection-quote').onclick = () => selectedShare('quote');
    tools.querySelector('#selection-link').onclick = () => selectedShare('link');
    ensureUIRoot().append(tools);
    ensureCopyFeedback();
    applyAppearance();
    return tools;
}

function updateSelectionTools() {
    const existing = uiById('slim-selection-tools');
    if (existing?.contains(uiActiveElement())) { if (!validSelectionSnapshot()) hideSelectionTools(true); return; }
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
