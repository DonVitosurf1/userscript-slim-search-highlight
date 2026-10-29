function applyAppearance() {
    for (const id of ['slim-hl-panel', 'slim-selection-tools', 'slim-hl-toggle']) {
        const el = uiById(id);
        if (el) {
            el.dataset.theme = uiTheme;
            el.style.opacity = String((100 - uiTransparency) / 100);
            el.querySelectorAll('img[data-hl-logo]').forEach(image => { image.src = LOGOS[uiTheme]; });
        }
    }
    const toggle = uiById('slim-hl-toggle');
    if (toggle) {
        toggle.dataset.position = launcherPosition;
        toggle.style.setProperty('--hl-launcher-size', launcherSize + 'px');
        toggle.style.setProperty('--hl-launcher-inset', launcherInset + 'px');
    }
    const panel = uiById('slim-hl-panel');
    const theme = panel?.querySelector('#ui-theme');
    if (theme) theme.value = uiTheme;
    const transparency = panel?.querySelector('#ui-transparency');
    if (transparency) { transparency.value = uiTransparency; transparency.setAttribute('aria-valuetext', t('transparencyValue', uiTransparency)); }
    const transparencyOutput = panel?.querySelector('#ui-transparency-value');
    if (transparencyOutput) transparencyOutput.value = t('transparencyValue', uiTransparency);
    const size = panel?.querySelector('#launcher-size');
    if (size) { size.value = launcherSize; size.setAttribute('aria-valuetext', launcherSize + ' px'); }
    const output = panel?.querySelector('#launcher-size-value');
    if (output) output.value = launcherSize + ' px';
    const position = panel?.querySelector('#launcher-position');
    if (position) position.value = launcherPosition;
    const inset = panel?.querySelector('#launcher-inset');
    if (inset) { inset.value = launcherInset; inset.setAttribute('aria-valuetext', launcherInset + ' px'); }
    const insetOutput = panel?.querySelector('#launcher-inset-value');
    if (insetOutput) insetOutput.value = launcherInset + ' px';
}

function saveAppearance() {
    try {
        save();
        if (panelStatus?.key === 'appearanceSaveFailed') setPanelStatus(null);
    }
    catch {
        uiTheme = JSON.parse(lastSaved.hl_ui_theme);
        uiTransparency = normalizeUITransparency(JSON.parse(lastSaved.hl_ui_transparency));
        launcherSize = normalizeLauncherSize(JSON.parse(lastSaved.hl_launcher_size));
        launcherPosition = JSON.parse(lastSaved.hl_launcher_position);
        launcherInset = normalizeLauncherInset(JSON.parse(lastSaved.hl_launcher_inset));
        applyAppearance(); setPanelStatus('appearanceSaveFailed');
    }
}

function clampPanelPosition(panel, persist = false) {
    if (!panel || panel.style.display === 'none') return;
    const viewport = window.visualViewport;
    const width = viewport?.width || innerWidth, height = viewport?.height || innerHeight;
    const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
    panel.style.width = Math.max(0, Math.min(320, width - 24)) + 'px';
    panel.style.setProperty('--hl-panel-collapsed-height', Math.max(0, Math.min(560, height * .8, height - 24)) + 'px');
    panel.style.setProperty('--hl-panel-expanded-height', Math.max(0, height - 24) + 'px');
    const box = panel.getBoundingClientRect();
    const custom = Number.isFinite(panelPos?.x) && Number.isFinite(panelPos?.y);
    const x = custom ? panelPos.x : left + width - box.width - 20;
    const y = custom ? panelPos.y : top + (height - box.height) / 2;
    const next = {
        x: Math.max(left + 12, Math.min(x, left + width - box.width - 12)),
        y: Math.max(top + 12, Math.min(y, top + height - box.height - 12))
    };
    panel.style.left = next.x + 'px'; panel.style.top = next.y + 'px';
    if (custom) panelPos = next;
    if (persist) save();
}

function setPanelOpen(open, focus = true) {
    let panel = uiById('slim-hl-panel');
    if (!panel && open) { createPanel(); panel = uiById('slim-hl-panel'); }
    if (!panel) return;
    panel.style.display = open ? 'flex' : 'none';
    panelState.open = open;
    const toggle = uiById('slim-hl-toggle');
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) {
        clampPanelPosition(panel);
        if (focus) (panelState.minimized ? panel.querySelector('#btn-min') : panel.querySelector('#page-heading')).focus({ preventScroll: true });
    } else if (focus) toggle?.focus({ preventScroll: true });
    save();
}

function keywordError(text, index = -1) {
    if (!text.trim()) return t('emptyKeyword');
    if (keywords.some((k, i) => i !== index && k.text.toLowerCase() === text.trim().toLowerCase())) return `${t('exists')} ${t('duplicateHint')}`;
    if (isRegexText(text)) {
        const last = text.lastIndexOf('/');
        try { new RegExp(text.slice(1, last), text.slice(last + 1)); }
        catch { return `${t('invalidRegex', text)}. ${t('regexHint')}`; }
        if (!explicitRegexAllowed(text.slice(1, last), text.slice(last + 1))) return t('unsafeRegex');
    }
    return '';
}

function setFieldError(field, error, message) {
    error.textContent = message;
    field.setAttribute('aria-invalid', String(!!message));
    if (message) field.setAttribute('aria-describedby', error.id);
    else field.removeAttribute('aria-describedby');
}

function updatePreview() {
    const preview = uiById('color-preview');
    if (!preview) return;
    const color = uiById('new-color').value;
    preview.style.backgroundColor = color;
    preview.style.color = highlightTextColor(color);
    preview.textContent = uiById('new-kw').value.trim().slice(0, 32) || t('preview');
}

function submitKeyword() {
    if (composing) return;
    const panel = uiById('slim-hl-panel');
    const input = panel.querySelector('#new-kw');
    const text = input.value.trim();
    const error = keywordError(text);
    setFieldError(input, panel.querySelector('#form-error'), error);
    if (error) { input.focus(); return; }
    const domains = panel.querySelector('#new-domains').value.split(',').map(d => d.trim()).filter(Boolean);
    keywords.push({ text, color: panel.querySelector('#new-color').value, regex: isRegexText(text), wholeWord: panel.querySelector('#new-whole').checked, domains });
    save(); input.value = ''; panel.querySelector('#new-domains').value = '';
    renderKeywordList(); updatePreview(); refreshHighlights(); input.focus({ preventScroll: true });
}

let panelStatus = null;
function setPanelStatus(key, ...args) {
    panelStatus = key ? { key, args } : null;
    renderPanelStatus();
}
function renderPanelStatus() {
    const el = uiById('panel-status');
    if (el) el.textContent = panelStatus ? t(panelStatus.key, ...panelStatus.args) : '';
}

function updateUndo() {
    const button = uiById('undo-delete');
    if (!button) return;
    button.hidden = !removedKeyword;
    button.textContent = t('undo');
}

function removeKeyword(index) {
    if (index < 0 || !keywords[index]) return;
    removedKeyword = { keyword: keywords[index], index };
    keywords.splice(index, 1); save();
    const status = uiById('panel-status');
    if (status) setPanelStatus('deleted', removedKeyword.keyword.text);
    renderKeywordList(); updateUndo(); refreshHighlights();
    uiById('undo-delete')?.focus({ preventScroll: true });
}

function createPanel(snapshot = null) {
    if (uiById('slim-hl-panel')) return;
    const panel = document.createElement('section');
    panel.id = 'slim-hl-panel'; panel.lang = currentLang();
    panel.setAttribute('aria-label', 'Slim Search Highlight');
    panel.style.left = (panelPos?.x ?? 0) + 'px'; panel.style.top = (panelPos?.y ?? 0) + 'px';
    if (panelState.minimized) panel.classList.add('minimized');
    panel.innerHTML = `
        <header id="slim-hl-header" tabindex="0" aria-label="${t('movePanel')}" title="${t('movePanel')}">
            <span class="brand"><img data-hl-logo src="${LOGOS[uiTheme]}" alt="">Highlight</span>
            <div class="header-actions">
                <button type="button" class="icon-btn" id="btn-reset" title="${t('resetPosition')}" aria-label="${t('resetPosition')}">${icon('reset')}</button>
                <button type="button" class="icon-btn" id="btn-min" aria-controls="slim-panel-body" aria-expanded="${!panelState.minimized}" aria-label="${t(panelState.minimized ? 'expand' : 'minimize')}" title="${t(panelState.minimized ? 'expand' : 'minimize')}">${icon(panelState.minimized ? 'expand' : 'minus')}</button>
                <button type="button" class="icon-btn" id="btn-close" title="${t('close')}" aria-label="${t('close')}">${icon('close')}</button>
            </div>
        </header>
        <div class="panel-body" id="slim-panel-body">
            <div class="navigation">
                <div class="counter-group"><output class="counter" id="hl-counter" aria-live="polite" aria-atomic="true" aria-describedby="navigation-scope">0 / 0</output><p id="navigation-scope" class="hint"></p></div>
                <div class="nav-btns">
                    <button type="button" class="icon-btn" id="btn-prev" title="${t('prev')}" aria-label="${t('prev')}">${icon('prev')}</button>
                    <button type="button" class="icon-btn" id="btn-next" title="${t('next')}" aria-label="${t('next')}">${icon('next')}</button>
                </div>
            </div>
            <div class="page-heading-row"><h2 id="page-heading" class="section-title" tabindex="-1">${t('pageHeading')}</h2>
            <div class="page-actions"><button type="button" class="icon-btn" id="clear-page" aria-label="${t('clearPageShort')} – ${t('pageHeading')}" title="${t('clearPage')}" hidden>${icon('trash')}</button><button type="button" class="icon-btn" id="undo-page" aria-label="${t('undoShort')} – ${t('pageHeading')}" title="${t('undoPage')}" hidden>${icon('reset')}</button></div></div>
            <div id="page-search-status" class="hint" role="status"></div>
            <div id="page-list"></div>
            <div class="status-row"><span id="panel-status" class="hint" role="status"></span><button type="button" id="undo-delete" hidden>${t('undo')}</button></div>
            <section id="manual-copy-section" hidden><label for="manual-copy">${t('manualCopy')}</label><p id="manual-copy-help" class="hint">${t('manualCopyHint')}</p><textarea id="manual-copy" readonly aria-describedby="manual-copy-help"></textarea><button type="button" id="close-manual-copy">${t('closeManualCopy')}</button></section>
            <div class="panel-tools">
            <details id="page-options"><summary title="${t('pageOptions')}" aria-label="${t('pageOptions')}">${t('pageOptionsShort')}</summary><div class="details-body">
                <label class="check-label"><input type="checkbox" id="page-whole"> ${t('pageWhole')}</label>
                <label for="page-scope">${t('pageScope')}</label><select id="page-scope"><option value="all">${t('scopeAll')}</option><option value="article">${t('scopeArticle')}</option></select>
            </div></details>
            <details id="permanent-keywords"><summary aria-label="${t('permanentKeywords')}" title="${t('permanentKeywords')}">${t('permanentKeywordsShort')}</summary><div class="details-body">
            <form id="keyword-form" novalidate>
                <div class="entry-row">
                    <div class="entry-main"><label for="new-kw">${t('addKeyword')}</label><input type="text" id="new-kw" placeholder="${t('kwPlaceholder')}" autocomplete="off"></div>
                    <div><label class="color-label" for="new-color">${t('colorLabel')}</label><input type="color" id="new-color" value="${DEFAULT_COLOR}"></div>
                </div>
                <span id="color-preview" class="preview" aria-hidden="true"></span>
                <div id="form-error" class="error" aria-live="polite"></div>
                <button type="submit" id="add-kw-btn">${t('add')}</button>
                <details id="advanced-section"><summary>${t('advanced')}</summary><div class="details-body">
                    <p class="hint">${t('regexHelp')}</p>
                    <label class="check-label"><input type="checkbox" id="new-whole" checked> ${t('wholeWords')}</label>
                    <label for="new-domains">${t('domains')}</label><input type="text" id="new-domains" placeholder="example.org, example.com">
                </div></details>
            </form>
            <h2 class="section-title">${t('keywords')}</h2>
            <label for="kw-search" class="hint">${t('filterLabel')}</label>
            <div class="search-row"><input type="text" id="kw-search" placeholder="${t('kwSearch')}"><button type="button" id="clear-kw-search" class="icon-btn" aria-label="${t('clearSearch')}" title="${t('clearSearch')}" hidden>${icon('close')}</button></div>
            <div id="kw-list"></div>

            <div id="regex-error" class="error" aria-live="polite"></div>
            </div></details>
            <details id="match-details"><summary>${t('matchDetails')}</summary><div id="match-list"></div></details>
            <details id="history-details"><summary>${t('recent')}</summary><div id="history-container" class="details-body"></div></details>
            <details id="settings-section"><summary>${t('settings')}</summary><div class="details-body">
                <h3 class="section-title">${t('appearance')}</h3>
                <label for="ui-theme">${t('colorTheme')}</label>
                <select id="ui-theme"><option value="dark">${t('themeDark')}</option><option value="light">${t('themeLight')}</option></select>
                <label for="ui-transparency" class="section-title">${t('uiTransparency')}</label>
                <div class="launcher-size-row"><input type="range" id="ui-transparency" min="0" max="80" step="5" aria-describedby="ui-transparency-hint"><output id="ui-transparency-value" for="ui-transparency"></output></div>
                <p class="hint" id="ui-transparency-hint">${t('transparencyHint')}</p>
                <button type="button" id="reset-transparency">${t('resetTransparency')}</button>
                <label for="launcher-size" class="section-title">${t('launcherSize')}</label>
                <div class="launcher-size-row"><input type="range" id="launcher-size" min="44" max="80" step="4" aria-describedby="launcher-size-hint"><output id="launcher-size-value" for="launcher-size"></output></div>
                <p class="hint" id="launcher-size-hint">${t('launcherSizeHint')}</p>
                <button type="button" id="reset-launcher-size">${t('resetLauncherSize')}</button>
                <label for="launcher-position" class="section-title">${t('launcherPosition')}</label>
                <select id="launcher-position"><option value="bottom-right">${t('bottomRight')}</option><option value="bottom-left">${t('bottomLeft')}</option><option value="top-right">${t('topRight')}</option><option value="top-left">${t('topLeft')}</option></select>
                <label for="launcher-inset" class="section-title">${t('launcherInset')}</label>
                <div class="launcher-size-row"><input type="range" id="launcher-inset" min="8" max="80" step="4"><output id="launcher-inset-value" for="launcher-inset"></output></div>
                <label class="check-label"><input type="checkbox" id="chk-enabled" ${enabled ? 'checked' : ''}> ${t('enabled')}</label>
                <label class="check-label"><input type="checkbox" id="chk-auto" ${autoSearch ? 'checked' : ''}> ${t('autoSearch')}</label>
                <label class="check-label"><input type="checkbox" id="chk-posbar" ${showPosBar ? 'checked' : ''}> ${t('posBar')}</label>
                <h3 class="section-title">${t('shortcutTitle')}</h3>
                <output id="shortcut-label" aria-live="polite"></output>
                <p class="hint">${t('shortcutHelp')}</p>
                <div class="shortcut-actions"><button type="button" id="record-shortcut">${t('recordShortcut')}</button><button type="button" id="disable-shortcut">${t('disableShortcut')}</button><button type="button" id="reset-shortcut">${t('resetShortcut')}</button></div>
                <p id="shortcut-error" class="error" role="status"></p>
                <label for="copy-format">${t('copyFormat')}</label><select id="copy-format"><option value="plain">${t('plainFormat')}</option><option value="markdown">${t('markdownFormat')}</option></select>
                <button type="button" id="export-markdown" class="btn">${t('exportMarkdown')}</button><button type="button" id="export-saved" class="btn">${t('exportSaved')}</button>
                <label for="search-engine">${t('engine')}</label>
                <select id="search-engine"><option value="google">Google</option><option value="ddg">DuckDuckGo</option><option value="brave">Brave</option><option value="bing">Bing</option></select>
                <label for="ui-lang">${t('language')}</label>
                <select id="ui-lang"><option value="auto">${t('langAuto')}</option><option value="de">Deutsch</option><option value="en">English</option></select>
            </div></details>
            <details id="help-section"><summary>${t('helpTitle')}</summary><div class="details-body"><p class="hint">${t('pageHint')}</p><p class="hint">${t('navigationHelp')}</p><p id="page-shortcut-hint" class="hint"></p></div></details>
            </div>
        </div>`;
    ensureUIRoot().appendChild(panel);
    applyAppearance();
    panel.querySelector('#kw-search').value = kwFilter;
    panel.querySelector('#search-engine').value = searchEngine;
    panel.querySelector('#ui-lang').value = lang;
    panel.querySelector('#copy-format').value = copyFormat;
    const header = panel.querySelector('#slim-hl-header');
    let drag = null;
    header.onpointerdown = e => {
        if (e.button !== 0 || e.target.closest('button')) return;
        const box = panel.getBoundingClientRect();
        drag = { x: e.clientX - box.x, y: e.clientY - box.y };
        header.setPointerCapture(e.pointerId); e.preventDefault();
    };
    header.onpointermove = e => {
        if (!drag) return;
        panelPos = { x: e.clientX - drag.x, y: e.clientY - drag.y };
        clampPanelPosition(panel);
    };
    const endDrag = () => { if (drag) { drag = null; save(); } };
    header.onpointerup = endDrag; header.onpointercancel = endDrag; header.onlostpointercapture = endDrag;
    header.onkeydown = e => {
        if (e.target !== header || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'Home') panelPos = null;
        else {
            if (!panelPos) { const box = panel.getBoundingClientRect(); panelPos = { x: box.x, y: box.y }; }
            const step = e.shiftKey ? 40 : 10;
            panelPos.x += e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
            panelPos.y += e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        }
        clampPanelPosition(panel, true);
    };
    panel.querySelector('#btn-reset').onclick = () => { panelPos = null; clampPanelPosition(panel, true); };
    panel.querySelector('#btn-min').onclick = e => {
        panelState.minimized = !panelState.minimized;
        panel.classList.toggle('minimized', panelState.minimized);
        const button = e.currentTarget;
        button.setAttribute('aria-expanded', String(!panelState.minimized));
        button.setAttribute('aria-label', t(panelState.minimized ? 'expand' : 'minimize'));
        button.title = t(panelState.minimized ? 'expand' : 'minimize');
        button.innerHTML = icon(panelState.minimized ? 'expand' : 'minus');
        clampPanelPosition(panel, true);
    };
    panel.querySelector('#btn-close').onclick = () => setPanelOpen(false);
    panel.onkeydown = e => { if (e.key === 'Escape' && !e.isComposing && !composing) { e.preventDefault(); e.stopPropagation(); setPanelOpen(false); } };
    panel.querySelector('#btn-prev').onclick = () => goTo(-1);
    panel.querySelector('#btn-next').onclick = () => goTo(1);
    panel.querySelector('#keyword-form').onsubmit = e => { e.preventDefault(); submitKeyword(); };
    panel.addEventListener('compositionstart', () => { composing = true; });
    panel.addEventListener('compositionend', () => { composing = false; });
    panel.querySelector('#new-kw').onkeydown = e => { if (e.key === 'Enter' && (e.isComposing || composing)) e.preventDefault(); };
    panel.querySelector('#new-kw').oninput = () => {
        setFieldError(panel.querySelector('#new-kw'), panel.querySelector('#form-error'), ''); updatePreview();
    };
    panel.querySelector('#new-color').oninput = updatePreview;
    const filterKeywords = () => {
        kwFilter = panel.querySelector('#kw-search').value.trim().toLowerCase();
        panel.querySelector('#clear-kw-search').hidden = !panel.querySelector('#kw-search').value;
        renderKeywordList();
    };
    panel.querySelector('#kw-search').oninput = filterKeywords;
    panel.querySelector('#clear-kw-search').onclick = () => {
        panel.querySelector('#kw-search').value = ''; filterKeywords(); panel.querySelector('#kw-search').focus();
    };
    panel.querySelector('#clear-kw-search').hidden = !kwFilter;
    panel.querySelector('#undo-delete').onclick = () => {
        if (!removedKeyword) return;
        if (keywords.some(k => k.text.toLowerCase() === removedKeyword.keyword.text.toLowerCase())) {
            setPanelStatus('exists'); return;
        }
        keywords.splice(Math.min(removedKeyword.index, keywords.length), 0, removedKeyword.keyword);
        removedKeyword = null; save(); renderKeywordList(); updateUndo(); refreshHighlights();
        setPanelStatus('restored');
        panel.querySelector('#kw-search').focus({ preventScroll: true });
    };
    panel.querySelector('#chk-enabled').onchange = e => {
        enabled = e.target.checked; save();
        if (enabled) { if (!observer) setupObserver(); refreshHighlights(); }
        else {
            highlightGeneration++;
            pendingNodes.clear(); cleanupHighlights(); clearPagePaint(); keywordCounts = {}; currentIdx = -1;
            renderPageList(); updateCounterAndTitle(); updateKeywordCounts(); renderMatchList(); updatePosBar(); hideSelectionTools(); observer?.disconnect();
        }
    };
    panel.querySelector('#ui-theme').onchange = e => { uiTheme = e.target.value === 'light' ? 'light' : 'dark'; applyAppearance(); saveAppearance(); };
    panel.querySelector('#ui-transparency').oninput = e => { uiTransparency = normalizeUITransparency(+e.target.value); applyAppearance(); };
    panel.querySelector('#ui-transparency').onchange = saveAppearance;
    panel.querySelector('#reset-transparency').onclick = () => { uiTransparency = 0; applyAppearance(); saveAppearance(); };
    panel.querySelector('#launcher-size').oninput = e => { launcherSize = normalizeLauncherSize(+e.target.value); applyAppearance(); };
    panel.querySelector('#launcher-size').onchange = saveAppearance;
    panel.querySelector('#reset-launcher-size').onclick = () => { launcherSize = DEFAULT_LAUNCHER_SIZE; applyAppearance(); saveAppearance(); };
    panel.querySelector('#launcher-position').onchange = e => { launcherPosition = e.target.value; applyAppearance(); saveAppearance(); };
    panel.querySelector('#launcher-inset').oninput = e => { launcherInset = normalizeLauncherInset(+e.target.value); applyAppearance(); };
    panel.querySelector('#launcher-inset').onchange = saveAppearance;
    panel.querySelector('#chk-auto').onchange = e => { autoSearch = e.target.checked; save(); refreshHighlights(); };
    panel.querySelector('#chk-posbar').onchange = e => { showPosBar = e.target.checked; save(); updatePosBar(); };
    panel.querySelector('#search-engine').onchange = e => { searchEngine = e.target.value; save(); };
    panel.querySelector('#clear-page').onclick = () => { if (!ensurePageIdentity()) return; rememberPageChange(); const before = pageUndo.at(-1); pageTerms = []; if (!savePageRecord(before.terms.some(term => term.saved))) { pageTerms = before.terms; pageUndo.pop(); renderPageList(); return; } currentIdx = -1; refreshPageResults(); panel.querySelector('#undo-page').focus({ preventScroll: true }); };
    panel.querySelector('#undo-page').onclick = undoPageChange;
    const optionsChanged = () => {
        if (!ensurePageIdentity()) return;
        rememberPageChange(); pageOptions = { wholeWords: panel.querySelector('#page-whole').checked, articleOnly: panel.querySelector('#page-scope').value === 'article' };
        if (!savePageRecord()) { pageOptions = pageUndo.pop().options; renderPageList(); return; }
        currentIdx = -1; refreshPageResults();
    };
    panel.querySelector('#page-whole').onchange = optionsChanged;
    panel.querySelector('#page-scope').onchange = optionsChanged;
    panel.querySelector('#copy-format').onchange = e => { copyFormat = e.target.value; save(); };
    panel.querySelector('#export-markdown').onclick = exportPageMarkdown;
    panel.querySelector('#export-saved').onclick = exportSavedPages;
    panel.querySelector('#close-manual-copy').onclick = () => { panel.querySelector('#manual-copy-section').hidden = true; panel.querySelector('#page-heading').focus(); };
    panel.querySelector('#record-shortcut').onclick = () => { recordingShortcut = !recordingShortcut; renderShortcut(); };
    panel.querySelector('#record-shortcut').onblur = () => { recordingShortcut = false; renderShortcut(); };
    panel.querySelector('#disable-shortcut').onclick = () => { recordingShortcut = false; selectionShortcut = null; save(); renderShortcut(); };
    panel.querySelector('#reset-shortcut').onclick = () => { recordingShortcut = false; selectionShortcut = { ...DEFAULT_SHORTCUT }; save(); renderShortcut(); };
    panel.querySelector('#ui-lang').onchange = e => {
        const state = {
            values: Object.fromEntries(['new-kw', 'new-color', 'new-domains', 'new-whole', 'kw-search', 'manual-copy'].map(id => {
                const el = panel.querySelector('#' + id); return [id, el.type === 'checkbox' ? el.checked : el.value];
            })),
            details: [...panel.querySelectorAll('details')].filter(el => el.open).map(el => el.id),
            edits: [...panel.querySelectorAll('.kw-item input[type=text]')].map(el => ({ index: el.dataset.i, value: el.value, color: el.closest('.kw-item').querySelector('input[type=color]').value })),
            scroll: panel.querySelector('.panel-body').scrollTop,
            status: panelStatus,
            manualCopyVisible: !panel.querySelector('#manual-copy-section').hidden,
            formInvalid: panel.querySelector('#new-kw').getAttribute('aria-invalid') === 'true'
        };
        lang = e.target.value; composing = false; recordingShortcut = false; hideSelectionTools(); uiById('slim-selection-tools')?.remove(); save();
        const toggle = uiById('slim-hl-toggle');
        if (toggle) { toggle.title = t('openPanel'); toggle.setAttribute('aria-label', t('openPanel')); }
        panel.remove(); createPanel(state);
    };
    renderPageList(); renderShortcut(); renderKeywordList(); renderHistory(); updateUndo(); renderPanelStatus();
    updateCounterAndTitle(); renderMatchList(); updatePreview();
    if (snapshot) {
        for (const [id, value] of Object.entries(snapshot.values)) {
            const el = panel.querySelector('#' + id);
            if (el.type === 'checkbox') el.checked = value; else el.value = value;
        }
        for (const id of snapshot.details) panel.querySelector('#' + id).open = true;
        for (const edit of snapshot.edits) {
            const field = panel.querySelector(`.kw-item input[type=text][data-i="${edit.index}"]`);
            if (field) {
                field.value = edit.value;
                if (edit.color) field.closest('.kw-item').querySelector('input[type=color]').value = edit.color;
                setFieldError(field, panel.querySelector('#edit-error-' + edit.index), keywordError(edit.value, +edit.index));
            }
        }
        if (snapshot.formInvalid) setFieldError(panel.querySelector('#new-kw'), panel.querySelector('#form-error'), keywordError(panel.querySelector('#new-kw').value));
        panel.querySelector('#manual-copy-section').hidden = !snapshot.manualCopyVisible;
        panelStatus = snapshot.status; renderPanelStatus();
        updatePreview();
    }
    panel.querySelector('#regex-error').textContent = lastErrors.join('\n');
    clampPanelPosition(panel);
    panelSizeObserver?.disconnect();
    if (window.ResizeObserver) {
        panelSizeObserver = new ResizeObserver(() => clampPanelPosition(panel));
        panelSizeObserver.observe(panel);
    }
    if (snapshot) {
        panel.querySelector('#ui-lang').focus({ preventScroll: true });
        panel.querySelector('.panel-body').scrollTop = snapshot.scroll;
    }
}

/** Keep active edits intact while background highlighting updates counts. */
function updateKeywordCounts() {
    const list = uiById('kw-list');
    if (!list) return;
    const filtered = siteKeywords().filter(k => !kwFilter || k.text.toLowerCase().includes(kwFilter));
    const items = list.querySelectorAll('.kw-item');
    if (items.length !== filtered.length) { renderKeywordList(); return; }
    items.forEach((el, i) => { el.querySelector('.kw-count').textContent = keywordCounts[filtered[i].text] || 0; });
}

function siteKeywords() {
    return keywords.filter(k => !k.domains?.length || k.domains.some(domain => domainMatches(location.hostname, domain)));
}

function renderKeywordList() {
    const list = uiById('kw-list');
    if (!list) return;
    const filtered = siteKeywords().filter(k => !kwFilter || k.text.toLowerCase().includes(kwFilter));
    if (!filtered.length) {
        list.innerHTML = `<p class="empty">${siteKeywords().length ? t('noKwMatches') : t('noKeywords')}</p>`;
        return;
    }
    list.replaceChildren();
    filtered.forEach(k => {
        const index = keywords.indexOf(k);
        const wrapper = document.createElement('div');
        const row = document.createElement('div'); row.className = 'kw-item';
        row.innerHTML = `
            <input type="color" value="${escapeHTML(k.color || DEFAULT_COLOR)}" data-i="${index}" aria-label="${escapeHTML(t('colorKeyword', k.text))}" title="${t('changeColor')}">
            <input type="text" value="${escapeHTML(k.text)}" data-i="${index}" aria-label="${escapeHTML(t('editKeyword', k.text))}">
            <button type="button" class="icon-btn save-keyword" aria-label="${escapeHTML(t('saveKeyword', k.text))}">${icon('save')}</button>
            <span class="kw-count" title="${t('countTitle')}">${keywordCounts[k.text] || 0}</span>
            <button type="button" class="icon-btn delete-keyword" data-i="${index}" aria-label="${escapeHTML(t('deleteKeyword', k.text))}" title="${t('remove')}">${icon('close')}</button>`;
        const error = document.createElement('div'); error.id = 'edit-error-' + index; error.className = 'error'; error.setAttribute('aria-live', 'polite');
        wrapper.append(row, error); list.appendChild(wrapper);
        const field = row.querySelector('input[type=text]');
        const edit = () => {
            const text = field.value.trim(); const message = keywordError(text, index);
            setFieldError(field, error, message);
            if (message) return;
            k.text = text; k.regex = isRegexText(text); k.color = row.querySelector('input[type=color]').value; field.value = text;
            field.setAttribute('aria-label', t('editKeyword', text));
            row.querySelector('input[type=color]').setAttribute('aria-label', t('colorKeyword', text));
            row.querySelector('.delete-keyword').setAttribute('aria-label', t('deleteKeyword', text));
            row.querySelector('.save-keyword').setAttribute('aria-label', t('saveKeyword', text));
            save(); refreshHighlights();
        };
        row.querySelector('.save-keyword').onclick = edit;
        field.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing && !composing) { e.preventDefault(); edit(); } };
        row.querySelector('.delete-keyword').onclick = () => removeKeyword(index);
    });
}

function renderHistory() {
    const container = uiById('history-container');
    if (!container) return;
    container.replaceChildren();
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = t('historyManagerHint'); container.append(hint);
}

function registerHistoryMenus() {
    searchHistory.slice(0, 8).forEach(text => GM_registerMenuCommand(t('recent') + ': ' + text, () => {
        manualTerms = text.split(/\s+/).filter(Boolean);
        GM_setValue('hl_cross_terms', { terms: manualTerms, timestamp: Date.now() });
        refreshHighlights();
    }));
}

function createToggle() {
    if (uiById('slim-hl-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'slim-hl-toggle';
    btn.title = t('openPanel');
    btn.type = 'button';
    btn.setAttribute('aria-label', t('openPanel'));
    btn.setAttribute('aria-controls', 'slim-hl-panel');
    btn.setAttribute('aria-expanded', String(panelState.open));
    btn.onclick = () => setPanelOpen(!panelState.open);
    ensureUIRoot().appendChild(btn);
    applyAppearance();
}

/** Nur auf Seiten registrieren, auf denen das Skript aktiv ist (nicht auf der Blacklist). */
