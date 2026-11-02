// Completion reads only the transient visible-text index already built by the finder.
function* collectFindCompletions(index, query, options) {
    if (query.length > 128 || [...query].length < 3 || !/^[\p{L}\p{N}_][\p{L}\p{M}\p{N}_’'-]*$/u.test(query)) return [];
    const prefix = new RegExp('^' + escapeRegExp(query), options.caseSensitive ? 'u' : 'iu');
    const words = new Map(); let operations = 0;
    for (const match of index.text.matchAll(/[\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*(?:[’'-][\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*)*/gu)) {
        const word = match[0];
        if (word.length > query.length && word.length <= 128 && prefix.test(word)) {
            const key = options.caseSensitive ? word : word.toLowerCase();
            const previous = words.get(key);
            if (previous) previous.frequency++;
            else if (words.size < 256) words.set(key, { word, frequency: 1 });
        }
        if (++operations % 128 === 0) yield;
    }
    const items = [...words.values()].sort((a, b) => b.frequency - a.frequency).slice(0, 3);
    for (const item of items) {
        item.count = 0;
        for (const match of index.text.matchAll(pageSearchPattern(item.word, options))) {
            item.count++;
            if (++operations % 128 === 0) yield;
        }
    }
    return items;
}
function* collectQuickFindResults(query, color, options) {
    const index = yield* pageTextIndex(document.body);
    const matches = yield* collectPageMatches(null, [{ id: 'find', text: normalizePassage(query), color }], options, index);
    const completions = quickFind.completionDismissed ? [] : yield* collectFindCompletions(index, query, options);
    return { matches, completions };
}
function clearFindCompletion() {
    quickFind.completions = []; quickFind.completionIndex = -1;
    renderFindCompletion();
}
function findCompletionAtCaret() {
    const input = uiById('find-query');
    return !!input && input.value === quickFind.query && input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
}
function resizeFindSurface() {
    const bar = uiById('slim-find-bar'); if (!bar || bar.hidden) return;
    const viewport = window.visualViewport;
    const box = bar.getBoundingClientRect(), panel = uiById('slim-hl-panel');
    const panelBox = panel && panel.style.display !== 'none' ? panel.getBoundingClientRect() : null;
    // Panel clamping needs its minimum 80px region plus the 8px separation.
    const bottomRoom = panelBox && panelBox.left < box.right && panelBox.right > box.left ? 88 : 12;
    const limit = Math.max(44, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - box.top - bottomRoom);
    bar.style.maxHeight = limit + 'px';
    bar.style.overflow = bar.scrollHeight > limit ? 'auto' : 'visible';
    clampPanelPosition(panel);
}
function renderFindCompletion() {
    const input = uiById('find-query'), popup = uiById('find-completion-popup'); if (!input || !popup) return;
    const visible = quickFind.open && enabled && !quickFind.busy && !quickFind.composing && !quickFind.completionDismissed && findCompletionAtCaret();
    const items = visible ? quickFind.completions : [];
    const multiple = items.length > 1;
    const selected = items[quickFind.completionIndex >= 0 ? quickFind.completionIndex : 0];
    const ghost = uiById('find-ghost'), accept = uiById('find-accept');
    ghost.hidden = accept.hidden = !selected;
    uiById('find-ghost-prefix').textContent = input.value;
    uiById('find-ghost-suffix').textContent = selected ? selected.word.slice(input.value.length) : '';
    ghost.scrollLeft = input.scrollLeft;
    if (selected) { accept.title = t('findComplete', selected.word); accept.setAttribute('aria-label', accept.title); }
    const announcement = uiById('find-completion-announcement');
    const message = selected ? t('findCompletionPreview', selected.word, t('findCompletionCount', selected.count)) : '';
    if (announcement && announcement.textContent !== message) announcement.textContent = message;
    popup.hidden = !multiple;
    input.setAttribute('aria-expanded', String(multiple)); input.removeAttribute('aria-activedescendant');
    const list = uiById('find-completion-list'); list.replaceChildren();
    uiById('find-completion-help').textContent = t('findCompletionKeys');
    list.setAttribute('aria-label', t('findCompletionList'));
    if (multiple) for (let i = 0; i < items.length; i++) {
        const item = items[i], option = document.createElement('div'); option.id = 'find-completion-' + i;
        option.className = 'find-completion-option'; option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(i === quickFind.completionIndex));
        const word = document.createElement('span'); word.className = 'completion-word';
        const prefix = document.createElement('strong'); prefix.textContent = item.word.slice(0, input.value.length);
        word.append(prefix, document.createTextNode(item.word.slice(input.value.length)));
        const count = document.createElement('span'); count.className = 'completion-count'; count.textContent = t('findCompletionCount', item.count);
        option.append(word, count);
        option.onpointerdown = event => event.preventDefault();
        option.onclick = () => acceptFindCompletion(i);
        list.append(option);
        if (i === quickFind.completionIndex) input.setAttribute('aria-activedescendant', option.id);
    }
    if (selected) uiById('find-status').textContent = t(multiple ? 'findCompletionMultiple' : 'findCompletionSingle');
    resizeFindSurface();
}
function dismissFindCompletion() {
    if (!quickFind.completions.length || quickFind.completionDismissed || !findCompletionAtCaret()) return false;
    quickFind.completionDismissed = true; renderQuickFind(); return true;
}
function acceptFindCompletion(index = quickFind.completionIndex >= 0 ? quickFind.completionIndex : 0) {
    if (!quickFind.open || quickFind.busy || quickFind.composing || quickFind.completionDismissed || !enabled || !findCompletionAtCaret()) return;
    const item = quickFind.completions[index]; if (!item) return;
    const input = uiById('find-query');
    quickFind.cursor = null;
    quickFind.query = input.value = item.word;
    quickFind.completionDismissed = true;
    input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length);
    scheduleQuickFind(0, true);
}
function handleFindCompletionKey(event) {
    if (quickFind.completionDismissed || quickFind.busy || !findCompletionAtCaret() || !quickFind.completions.length) return false;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
    if (event.key === 'ArrowRight') { event.preventDefault(); acceptFindCompletion(); return true; }
    if (quickFind.completions.length < 2) return false;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        quickFind.completionIndex = (quickFind.completionIndex + (event.key === 'ArrowDown' ? 1 : -1) + quickFind.completions.length) % quickFind.completions.length;
        renderFindCompletion();
        const bar = uiById('slim-find-bar'), active = uiById('find-completion-' + quickFind.completionIndex);
        const clip = bar.getBoundingClientRect(), box = active.getBoundingClientRect();
        if (box.bottom > clip.bottom) bar.scrollTop += box.bottom - clip.bottom + 4;
        else if (box.top < clip.top) bar.scrollTop -= clip.top - box.top + 4;
        return true;
    }
    if (event.key === 'Enter') { event.preventDefault(); acceptFindCompletion(); return true; }
    return false;
}
