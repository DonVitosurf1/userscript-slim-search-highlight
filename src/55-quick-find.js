// The finder is a transient preview: it never enters page records or keyword storage.
const DEFAULT_FIND_SHORTCUT = { key: 'f', ctrl: true, shift: true, alt: false, meta: false };
const storedFindShortcut = GM_getValue('hl_find_shortcut', DEFAULT_FIND_SHORTCUT);
let findShortcut = storedFindShortcut === null ? null : validShortcut(storedFindShortcut) ? storedFindShortcut : { ...DEFAULT_FIND_SHORTCUT };
let recordingFindShortcut = false;
const quickFind = { open: false, query: '', wholeWords: false, caseSensitive: false, matches: [], index: -1, generation: 0, timer: null, color: null, busy: false, composing: false, returnFocus: null, scrollPending: false, completions: [], completionIndex: -1, completionDismissed: false, cursor: null };
function findShortcutAvailable() {
    if (!findShortcut) return false;
    const same = other => other && ['key', 'ctrl', 'alt', 'shift', 'meta'].every(key => key === 'key' ? other.key.toLowerCase() === findShortcut.key.toLowerCase() : !!other[key] === !!findShortcut[key]);
    return !same(selectionShortcut) && !same(PANEL_SHORTCUT);
}
function renderFindShortcut() {
    const available = findShortcutAvailable();
    const label = uiById('find-shortcut-label'); if (label) label.textContent = shortcutLabel(findShortcut);
    const record = uiById('record-find-shortcut'); if (record) record.textContent = t(recordingFindShortcut ? 'recordingShortcut' : 'recordShortcut');
    const hint = uiById('find-shortcut-hint'); if (hint) hint.textContent = findShortcut && !available ? t('findShortcutConflict') : t('findShortcutHint', shortcutLabel(findShortcut));
    const button = uiById('open-find');
    if (button) {
        button.title = t('findTitle') + (available ? ' (' + shortcutLabel(findShortcut) + ')' : '');
        if (available) button.setAttribute('aria-keyshortcuts', [findShortcut.ctrl && 'Control', findShortcut.alt && 'Alt', findShortcut.shift && 'Shift', findShortcut.meta && 'Meta', findShortcut.key.toUpperCase()].filter(Boolean).join('+'));
        else button.removeAttribute('aria-keyshortcuts');
    }
}
function saveFindShortcut(value) {
    const previous = findShortcut;
    try {
        GM_setValue('hl_find_shortcut', value); findShortcut = value;
        lastSaved.hl_find_shortcut = JSON.stringify(value);
        const error = uiById('find-shortcut-error'); if (error) error.textContent = '';
    } catch {
        findShortcut = previous;
        const error = uiById('find-shortcut-error'); if (error) error.textContent = t('findShortcutSaveFailed');
    }
    recordingFindShortcut = false; renderFindShortcut();
}
function handleQuickFindShortcut(event) {
    if (!event.isTrusted || event.isComposing || composing || event.repeat || recordingShortcut || recordingFindShortcut || isBlacklisted()) return false;
    if (!findShortcutAvailable() || !shortcutMatches(event, findShortcut)) return false;
    event.preventDefault(); event.stopPropagation(); openQuickFind(); return true;
}
function clearQuickFindPaint() {
    globalThis.CSS?.highlights?.delete('slim-find'); globalThis.CSS?.highlights?.delete('slim-find-current');
}
function suspendQuickFind() {
    clearTimeout(quickFind.timer); quickFind.generation++; clearQuickFindPaint(); quickFind.matches = []; quickFind.index = -1;
    clearFindCompletion();
}
function renderQuickFind() {
    const bar = uiById('slim-find-bar'); if (!bar) return;
    bar.lang = currentLang(); bar.setAttribute('aria-label', t('findTitle'));
    const input = uiById('find-query'); input.setAttribute('aria-label', t('findTitle')); input.placeholder = t('findPlaceholder');
    input.disabled = !enabled || !supportsPageHighlights();
    uiById('find-whole-label').textContent = t('findWhole');
    uiById('find-case').setAttribute('aria-label', t('findCase')); uiById('find-case-label').title = t('findCase');
    uiById('find-case-text').textContent = t('findCaseShort');
    for (const [id, key] of [['find-clear', 'findClear'], ['find-prev', 'prev'], ['find-next', 'next'], ['find-close', 'close']]) {
        const button = uiById(id); button.title = t(key); button.setAttribute('aria-label', t(key));
    }
    uiById('find-add').textContent = t('findAdd'); uiById('find-add').title = t('findAddHint');
    uiById('find-clear').hidden = !input.value;
    const count = quickFind.matches.length, current = count ? quickFind.index + 1 : 0;
    const counter = uiById('find-counter'); counter.textContent = `${current} / ${count}`; counter.setAttribute('aria-label', t('statusCount', current, count));
    uiById('find-prev').disabled = uiById('find-next').disabled = quickFind.busy || !count;
    uiById('find-add').disabled = quickFind.busy || !count || !enabled;
    bar.setAttribute('aria-busy', String(quickFind.busy));
    uiById('find-status').textContent = !supportsPageHighlights() ? t('highlightUnsupported') : !enabled ? t('findDisabled') : quickFind.busy ? t('searching') : !normalizePassage(quickFind.query) ? t('findEmpty') : !count ? t('findNoResults') : '';
    renderFindCompletion();
}
function paintQuickFindCurrent(scroll = false) {
    globalThis.CSS?.highlights?.delete('slim-find-current');
    const match = quickFind.matches[quickFind.index];
    if (match) {
        quickFind.cursor = { range: match.range.cloneRange(), index: quickFind.index, key: JSON.stringify([quickFind.query, quickFind.wholeWords, quickFind.caseSensitive]) };
        const active = new Highlight(match.range); active.priority = 101; CSS.highlights.set('slim-find-current', active);
        if (scroll) { const box = match.range.getBoundingClientRect(); window.scrollBy({ top: box.top + box.height / 2 - innerHeight / 2, behavior: 'instant' }); }
    }
    renderQuickFind();
}
function navigateQuickFind(delta) {
    if (!quickFind.matches.length || quickFind.busy) return;
    quickFind.index = (quickFind.index + delta + quickFind.matches.length) % quickFind.matches.length;
    paintQuickFindCurrent(true);
}
function scheduleQuickFind(delay = 120, scroll = false) {
    quickFind.scrollPending ||= scroll;
    if (!quickFind.open || quickFind.composing) return;
    suspendQuickFind();
    const query = normalizePassage(quickFind.query), generation = quickFind.generation, identity = location.href;
    quickFind.busy = !!query && enabled && supportsPageHighlights(); renderQuickFind();
    if (!quickFind.busy || isBlacklisted()) return;
    quickFind.timer = setTimeout(() => {
        if (generation !== quickFind.generation || !quickFind.open || identity !== location.href) return;
        if (isHighlighting) { scheduleQuickFind(80); return; }
        const work = collectQuickFindResults(quickFind.query, quickFind.color, { wholeWords: quickFind.wholeWords, caseSensitive: quickFind.caseSensitive, includeHidden: true });
        const step = () => {
            if (generation !== quickFind.generation || !quickFind.open || identity !== location.href || !enabled || isBlacklisted()) return;
            if (isHighlighting) { scheduleQuickFind(80); return; }
            const deadline = performance.now() + 10; let result;
            do { result = work.next(); } while (!result.done && performance.now() < deadline);
            if (!result.done) { requestAnimationFrame(step); return; }
            quickFind.matches = result.value.matches; quickFind.index = quickFind.matches.length ? 0 : -1; quickFind.busy = false;
            const cursor = quickFind.cursor;
            if (quickFind.matches.length && cursor?.key === JSON.stringify([quickFind.query, quickFind.wholeWords, quickFind.caseSensitive])) {
                const same = quickFind.matches.findIndex(match => ['startContainer', 'startOffset', 'endContainer', 'endOffset'].every(key => match.range[key] === cursor.range[key]));
                quickFind.index = same >= 0 ? same : Math.min(cursor.index, quickFind.matches.length - 1);
            }
            quickFind.completions = result.value.completions; quickFind.completionIndex = quickFind.completions.length > 1 ? 0 : -1;
            const highlight = new Highlight(); for (const match of quickFind.matches) highlight.add(match.range); highlight.priority = 100; CSS.highlights.set('slim-find', highlight);
            let style = document.getElementById('slim-find-colors');
            if (!style) { style = document.createElement('style'); style.id = 'slim-find-colors'; document.head.append(style); }
            style.textContent = `::highlight(slim-find), ::highlight(slim-find-current) { background-color: ${quickFind.color}; color: ${highlightTextColor(quickFind.color)}; } ::highlight(slim-find-current) { text-decoration: underline; }`;
            const reveal = quickFind.scrollPending; quickFind.scrollPending = false; paintQuickFindCurrent(reveal);
        };
        step();
    }, delay);
}
function closeQuickFind(restoreFocus = true, reset = false) {
    const bar = uiById('slim-find-bar'), focused = bar?.contains(uiActiveElement());
    quickFind.open = false; quickFind.scrollPending = false; quickFind.busy = false; quickFind.composing = false; quickFind.cursor = null; suspendQuickFind();
    if (bar) bar.hidden = true;
    if (reset) { quickFind.query = ''; quickFind.color = null; if (uiById('find-query')) uiById('find-query').value = ''; }
    if (focused) {
        if (restoreFocus && quickFind.returnFocus?.isConnected) quickFind.returnFocus.focus({ preventScroll: true });
        else uiActiveElement()?.blur();
    }
    clampPanelPosition(uiById('slim-hl-panel'));
}
function openQuickFind() {
    if (isBlacklisted()) return;
    const selected = selectedDocumentText();
    let bar = uiById('slim-find-bar');
    if (!bar) {
        bar = document.createElement('section'); bar.id = 'slim-find-bar'; bar.setAttribute('role', 'search');
        bar.innerHTML = `<div id="find-controls"><div class="find-row"><div class="find-field"><div class="find-input-stack"><div id="find-ghost" aria-hidden="true" hidden><span id="find-ghost-prefix"></span><span id="find-ghost-suffix"></span></div><input type="text" id="find-query" role="combobox" aria-autocomplete="both" aria-controls="find-completion-list" aria-expanded="false" aria-describedby="find-status" autocomplete="off" spellcheck="false"></div><button type="button" id="find-accept" hidden><span aria-hidden="true">→</span></button><button type="button" id="find-clear">${icon('close')}</button></div><output id="find-counter" aria-live="polite" aria-atomic="true">0 / 0</output><button type="button" id="find-prev">${icon('prev')}</button><button type="button" id="find-next">${icon('next')}</button><button type="button" id="find-close">${icon('close')}</button></div><div class="find-options"><label><input type="checkbox" id="find-whole"><span id="find-whole-label"></span></label><label id="find-case-label"><input type="checkbox" id="find-case"><span id="find-case-text"></span></label><button type="button" id="find-add"></button></div><p id="find-status" role="status"></p></div><div id="find-completion-popup" hidden><div id="find-completion-list" role="listbox"></div><p id="find-completion-help"></p></div>`;
        ensureUIRoot().append(bar);
        const announcement = document.createElement('span'); announcement.id = 'find-completion-announcement';
        announcement.setAttribute('role', 'status'); announcement.setAttribute('aria-live', 'polite'); announcement.setAttribute('aria-atomic', 'true'); bar.append(announcement);
        const input = bar.querySelector('#find-query');
        input.setAttribute('aria-describedby', 'find-status find-completion-announcement');
        input.oninput = event => { if (quickFind.query !== event.target.value) quickFind.cursor = null; quickFind.query = event.target.value; quickFind.completionDismissed = false; if (!quickFind.composing) scheduleQuickFind(120, true); };
        input.addEventListener('compositionstart', () => { quickFind.composing = true; suspendQuickFind(); quickFind.busy = false; renderQuickFind(); });
        input.addEventListener('compositionend', () => { quickFind.composing = false; quickFind.query = input.value; quickFind.completionDismissed = false; scheduleQuickFind(120, true); });
        for (const type of ['select', 'keyup', 'click', 'scroll']) input.addEventListener(type, renderFindCompletion);
        bar.querySelector('#find-accept').onpointerdown = event => event.preventDefault();
        bar.querySelector('#find-accept').onclick = () => acceptFindCompletion();
        for (const [id, key] of [['find-whole', 'wholeWords'], ['find-case', 'caseSensitive']]) bar.querySelector('#' + id).onchange = event => { quickFind[key] = event.target.checked; quickFind.cursor = null; quickFind.completionDismissed = false; scheduleQuickFind(0, true); };
        bar.querySelector('#find-clear').onclick = () => { quickFind.query = ''; quickFind.cursor = null; quickFind.completionDismissed = false; uiById('find-query').value = ''; scheduleQuickFind(0); uiById('find-query').focus(); };
        bar.querySelector('#find-close').onclick = () => closeQuickFind();
        bar.querySelector('#find-prev').onclick = () => navigateQuickFind(-1); bar.querySelector('#find-next').onclick = () => navigateQuickFind(1);
        bar.querySelector('#find-add').onclick = () => { if (addPageSelection(quickFind.query)) scheduleQuickFind(0); };
        bar.onkeydown = event => {
            if (event.isComposing || quickFind.composing) return;
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!dismissFindCompletion()) closeQuickFind(); }
            else if (event.target.id === 'find-query') {
                if (handleFindCompletionKey(event)) return;
                if (event.key === 'Enter') { event.preventDefault(); navigateQuickFind(event.shiftKey ? -1 : 1); }
            }
        };
    }
    if (!quickFind.open) { quickFind.returnFocus = uiActiveElement(); quickFind.completionDismissed = false; quickFind.color = chooseHighlightColor([...pageTerms, ...getActiveKeywords(true)].map(term => term.color)); }
    quickFind.open = true; bar.hidden = false;
    if (selected) { quickFind.query = normalizePassage(selected.text); quickFind.cursor = null; getSelection()?.removeAllRanges(); }
    uiById('find-query').value = quickFind.query; uiById('find-whole').checked = quickFind.wholeWords; uiById('find-case').checked = quickFind.caseSensitive;
    applyAppearance(); renderQuickFind(); watchPageIdentity(); scheduleQuickFind(0, true);
    uiById('find-query').focus({ preventScroll: true }); uiById('find-query').select();
    clampPanelPosition(uiById('slim-hl-panel'));
}
