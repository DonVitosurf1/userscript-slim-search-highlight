function bindGlobalHandlers() {
    // Refresh the query at native link activation, not just once at page load.
    for (const type of ['click', 'auxclick', 'contextmenu']) document.addEventListener(type, captureSearchNavigation, true);
    document.addEventListener('selectionchange', () => {
        clearTimeout(selectionTimer); selectionTimer = setTimeout(updateSelectionTools, 80);
    });
    document.addEventListener('pointerdown', e => {
        if (!e.target.closest?.('#slim-selection-tools')) hideSelectionTools();
    });
    window.addEventListener('scroll', () => hideSelectionTools(), { passive: true });
    document.addEventListener('keydown', e => {
        if (!recordingShortcut || document.activeElement?.id !== 'record-shortcut' || e.isComposing || e.repeat || composing) return;
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.key === 'Escape') { recordingShortcut = false; renderShortcut(); return; }
        if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;
        const candidate = { key: e.key.toLowerCase(), alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey, meta: e.metaKey };
        if (!validShortcut(candidate)) { document.getElementById('shortcut-error').textContent = t('shortcutInvalid'); return; }
        selectionShortcut = candidate; recordingShortcut = false;
        document.getElementById('shortcut-error').textContent = ''; save(); renderShortcut();
    }, true);
    const changedPage = () => { resetPageIdentity(); refreshPageResults(); };
    window.addEventListener('popstate', changedPage); window.addEventListener('hashchange', changedPage);
    document.addEventListener('mousedown', e => { if (!isOwnNode(e.target)) isSelecting = true; });
    document.addEventListener('mouseup', () => { setTimeout(() => { isSelecting = false; }, 80); });

    document.addEventListener('click', e => {
        if (isBlacklisted()) return;
        const hl = e.target.closest('.slim-hl');
        if (!hl || !e.altKey) return;
        e.preventDefault();
        const kw = hl.dataset.kw;
        removeKeyword(keywords.findIndex(k => k.text === kw));
    });

    document.addEventListener('keydown', e => {
        if (isBlacklisted() || e.isComposing || composing) return;
        if (e.repeat) return;
        if (e.key === 'Escape' && !document.getElementById('slim-selection-tools')?.hidden) hideSelectionTools(true);
        if (!editingTarget(e.target) && enabled && shortcutMatches(e)) {
            const selected = selectedDocumentText();
            if (selected && addPageSelection(selected.text)) { e.preventDefault(); return; }
        }
        if (e.target.closest?.('input, textarea, select, [contenteditable], #slim-hl-header')) return;
        if (!navigationMatches().length) return;
        if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goTo(1); }
        if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goTo(-1); }
    });


}

const pendingNodes = new Set();
let debounceTimer;
let needsFullRefresh = false;
function handleMutations(records) {
    if (isBlacklisted()) return;
    if (selectionSnapshot && !validSelectionSnapshot()) hideSelectionTools(true);
    for (const r of records) {
        const target = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (!target || target.closest(OWN_UI)) continue;
        const changed = [...r.addedNodes, ...r.removedNodes];
        if (changed.length && changed.every(n => (n.nodeType === 1 ? n : n.parentElement)?.closest(OWN_UI))) continue;
        if (r.type === 'attributes' && !pageTerms.length) continue;
        if (pageTerms.length) { pageTextDirty = true; pageSearchGeneration++; pageSearchBusy = false; }
        if (target.closest('.slim-hl')) { needsFullRefresh = true; continue; }
        if (r.type === 'characterData') pendingNodes.add(r.target);
        r.addedNodes.forEach(n => {
            if ((n.nodeType === 1 || n.nodeType === 3) && !isOwnNode(n)) pendingNodes.add(n);
        });
    }
    if ((!pendingNodes.size && !pageTextDirty && !needsFullRefresh) || isHighlighting) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (needsFullRefresh) { needsFullRefresh = false; refreshHighlights(); }
        else highlightAdded();
    }, 280);
}
function setupObserver() {
    observer = new MutationObserver(handleMutations);
    if (enabled) observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'style', 'class', 'contenteditable'] });
}

function init() {
    if (isBlacklisted()) return;
    bindGlobalHandlers();
    restorePageRecord();
    if (window.ResizeObserver) {
        let resizeTimer;
        new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(updatePosBar, 200); }).observe(document.documentElement);
    }
    const reposition = () => { clampPanelPosition(document.getElementById('slim-hl-panel')); hideSelectionTools(); };
    window.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('resize', reposition);
    window.visualViewport?.addEventListener('scroll', reposition);
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
    if (!document.getElementById('slim-hl-toggle')) createToggle();
    setPanelOpen(true);
});

function excludeCurrentDomain() {
    blacklist.push(location.hostname);
    highlightGeneration++;
    pendingNodes.clear(); observer?.disconnect(); cleanupHighlights(); clearPagePaint(); hideSelectionTools(); keywordCounts = {}; currentIdx = -1;
    updateCounterAndTitle(); updateKeywordCounts(); renderMatchList(); updatePosBar(); save();
    const status = document.getElementById('panel-status');
    if (status) setPanelStatus('excluded');
}

GM_registerMenuCommand(t('menuBlacklist'), () => {
    if (isBlacklisted()) return;
    if (!document.getElementById('slim-hl-toggle')) createToggle();
    setPanelOpen(true); excludeCurrentDomain();
});
