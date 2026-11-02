// All owned surfaces share the semantic theme from src/colors.json.
const themeDeclarations = theme => Object.entries(COLORS.themes[theme]).map(([key, value]) => `--hl-${key}: ${value};`).join('\n        ');
const UI_CSS = `
    ::highlight(slim-page) { background-color: ${DEFAULT_COLOR}; color: ${COLORS.contrast.dark}; }
    ::highlight(slim-page-current) { background-color: ${COLORS.navigation.background}; color: ${COLORS.contrast.dark}; text-decoration: underline; }
    #slim-selection-tools {
        all: initial; position: fixed; z-index: 2147483647; display: flex; flex-direction: column; align-items: start; gap: 4px;
        width: max-content; max-width: calc(100vw - 16px); max-height: calc(100dvh - 16px); box-sizing: border-box;
        color: var(--hl-text); font: 14px/1.45 system-ui, sans-serif; color-scheme: var(--hl-scheme);
    }
    #slim-selection-tools[data-placement=above] { flex-direction: column-reverse; }
    #slim-selection-tools :where(:not(svg, svg *)) { all: revert; font: inherit; color: inherit; box-sizing: border-box; }
    #slim-selection-tools[hidden], #slim-selection-tools [hidden] { display: none !important; }
    #slim-selection-tools button {
        display: flex; align-items: center; justify-content: center; min-height: 36px; padding: 6px 8px;
        border: 1px solid transparent; border-radius: var(--hl-radius); cursor: pointer; background: transparent; color: var(--hl-text);
    }
    #slim-selection-tools #selection-trigger { width: 40px; min-height: 40px; padding: 0; border: 0; border-radius: 10px; background: transparent; flex-shrink: 0; }
    #slim-selection-tools #selection-trigger img { display: block; width: 40px; height: 40px; filter: drop-shadow(0 2px 6px var(--hl-shadow)); }
    #slim-selection-tools button:not(:disabled):hover, #slim-selection-tools summary:hover { background: var(--hl-hover); }
    #slim-selection-tools button:not(:disabled):active, #slim-selection-tools summary:active { background: var(--hl-active); }
    #slim-selection-tools #selection-trigger:not(:disabled):hover, #slim-selection-tools #selection-trigger:not(:disabled):active { background: transparent; }
    #slim-selection-tools #selection-trigger:not(:disabled):hover img { filter: drop-shadow(0 4px 8px var(--hl-shadow)); }
    #slim-selection-tools #selection-trigger:not(:disabled):active img { opacity: .8; filter: drop-shadow(0 1px 3px var(--hl-shadow)); }
    #slim-selection-tools #selection-trigger:focus-visible { outline-offset: 2px; }
    #slim-selection-tools button:disabled { opacity: .5; cursor: default; }
    #slim-selection-tools :focus-visible { outline: 2px solid var(--hl-focus); outline-offset: -2px; }
    #slim-selection-tools svg { width: 20px; height: 20px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    #slim-selection-tools #selection-actions { display: flex; flex-direction: column; gap: 2px; min-width: 0; width: 100%; max-height: var(--hl-selection-menu-height, calc(100dvh - 64px)); overflow: auto; padding: 4px; background: var(--hl-bg); border: 1px solid var(--hl-divider); border-radius: 10px; box-shadow: 0 6px 20px var(--hl-shadow); }
    #slim-selection-tools #selection-highlight { font-weight: 600; background: var(--hl-surface); }
    #slim-selection-tools #selection-actions button { gap: 8px; white-space: normal; text-align: left; justify-content: start; }
    #slim-selection-tools #selection-actions button > span { min-width: 0; overflow-wrap: anywhere; }
    #slim-selection-tools #selection-support { max-width: 230px; padding: 4px; }
    #slim-hl-panel .page-heading-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    #slim-hl-panel .page-heading-row .section-title { margin: 0; }
    #slim-hl-panel .page-item { display: block; margin: 6px 0; padding-bottom: 4px; border-bottom: 1px solid var(--hl-divider); }
    #slim-hl-panel .page-row { display: flex; align-items: center; gap: 4px; }
    #slim-hl-panel .page-label-line { display: flex; align-items: baseline; gap: 4px; min-width: 0; }
    #slim-hl-panel .page-label-line > .page-term { flex: 1; min-width: 0; }
    #slim-hl-panel .page-label-line > .kw-count { min-width: 16px; flex-shrink: 0; }
    #slim-hl-panel .page-label { flex: 1; min-width: 0; }
    #slim-hl-panel .page-label .page-state { display: block; margin: 0; font-size: 12px; line-height: 1.3; }
    #slim-hl-panel .page-save[aria-pressed=true] { color: var(--hl-accent-text); }
    #slim-hl-panel .page-row > .icon-btn { flex-shrink: 0; }
    #slim-hl-panel .page-row > .term-visibility { width: 32px; padding: 6px; }
    #slim-hl-panel .term-swatch { display: block; flex: 0 0 38px; width: 38px; height: 38px; border: 1px solid var(--hl-border); border-radius: var(--hl-radius); box-shadow: inset 0 0 0 4px var(--hl-field); }
    #slim-hl-panel .page-item.is-hidden .page-term { color: var(--hl-muted); text-decoration: line-through; }
    #slim-hl-panel .term-visibility[aria-pressed=false] { color: var(--hl-muted); }
    #slim-hl-panel .page-actions { display: flex; flex-shrink: 0; gap: 4px; }
    #slim-hl-panel textarea { resize: none; min-height: 120px; margin-bottom: 8px; }
    #slim-selection-tools details { display: block; border-top: 1px solid var(--hl-divider); margin-top: 2px; padding-top: 2px; }
    #slim-selection-tools summary { display: list-item; cursor: pointer; min-height: 36px; padding: 6px 8px; border-radius: var(--hl-radius); }
    #slim-selection-tools details button { width: 100%; margin-top: 2px; }
    #slim-hl-feedback { all: initial; position: fixed; z-index: 2147483647; pointer-events: none; box-sizing: border-box; max-width: calc(100vw - 16px); max-height: calc(100dvh - 16px); overflow: auto; padding: 8px 10px; border: 1px solid var(--hl-divider); border-radius: var(--hl-radius); background: var(--hl-surface); color: var(--hl-text); box-shadow: 0 4px 18px var(--hl-shadow); font: 14px/1.45 system-ui, sans-serif; overflow-wrap: anywhere; }
    #slim-hl-feedback[hidden] { display: none !important; }
    #slim-hl-panel .page-term { display: block; overflow-wrap: anywhere; max-height: 5.8em; overflow: auto; }
    #slim-hl-panel #page-heading { margin-top: 0; }
    #slim-hl-panel #clear-page { margin: 0; }
    #slim-hl-panel .shortcut-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    #slim-hl-panel #shortcut-label { display: block; font-weight: 600; margin: 6px 0; }
    #slim-hl-panel #navigation-scope { margin: 0; }
    .slim-hl { border-radius: 3px; padding: 0 2px; cursor: pointer; }
    #slim-hl-panel, #slim-selection-tools, #slim-hl-toggle, #slim-hl-feedback, #slim-find-bar {
        --hl-brand-logo: url("${LOGOS.dark}");
        ${themeDeclarations('dark')}
        --hl-radius: 6px; --hl-gap: 8px; --hl-pad: 10px;
    }
    #slim-hl-panel[data-theme=light], #slim-selection-tools[data-theme=light], #slim-hl-toggle[data-theme=light], #slim-hl-feedback[data-theme=light], #slim-find-bar[data-theme=light] {
        --hl-brand-logo: url("${LOGOS.light}");
        ${themeDeclarations('light')}
    }
    #slim-hl-panel {
        all: initial;
        position: fixed; z-index: 2147483646; display: flex; flex-direction: column;
        width: min(320px, calc(100vw - 24px)); min-width: 0;
        max-height: var(--hl-panel-collapsed-height, min(560px, 80dvh)); box-sizing: border-box;
        background: var(--hl-bg); color: var(--hl-text); color-scheme: var(--hl-scheme);
        border: 1px solid var(--hl-divider); border-radius: 10px; box-shadow: 0 10px 32px var(--hl-shadow);
        font: 14px/1.45 system-ui, -apple-system, sans-serif; text-align: left;
        isolation: isolate; overflow: hidden;
    }
    #slim-hl-panel:has(.panel-tools > details[open]), #slim-hl-panel:has(#manual-copy-section:not([hidden])) {
        max-height: var(--hl-panel-expanded-height, calc(100dvh - 24px));
    }
    #slim-hl-panel :where(:not(svg, svg *)), #slim-hl-panel :where(:not(svg, svg *))::before, #slim-hl-panel :where(:not(svg, svg *))::after {
        all: revert; box-sizing: border-box; font: inherit; color: inherit;
    }
    #slim-hl-panel [hidden] { display: none !important; }
    #slim-hl-panel, #slim-hl-panel *, #slim-selection-tools, #slim-selection-tools *, #slim-hl-feedback { scrollbar-color: var(--hl-scroll-thumb) var(--hl-field); scrollbar-width: thin; }
    #slim-hl-panel ::-webkit-scrollbar { width: 10px; height: 10px; }
    #slim-hl-panel ::-webkit-scrollbar-track { background: var(--hl-field); }
    #slim-hl-panel ::-webkit-scrollbar-thumb { background: var(--hl-scroll-thumb); border: 2px solid var(--hl-field); border-radius: 6px; }
    #slim-hl-panel ::-webkit-scrollbar-thumb:hover { background: var(--hl-scroll-hover); }
    #slim-hl-panel ::selection { background: var(--hl-accent); color: var(--hl-on-accent); }
    #slim-hl-panel :focus-visible, #slim-hl-toggle:focus-visible {
        outline: 2px solid var(--hl-focus); outline-offset: 2px;
    }
    #slim-hl-header {
        padding: 8px 10px; background: var(--hl-surface); cursor: grab; touch-action: none;
        display: flex; align-items: center; justify-content: space-between; gap: var(--hl-gap); flex-shrink: 0;
    }
    #slim-hl-header:active { cursor: grabbing; }
    #slim-hl-header .brand { display: flex; align-items: center; gap: var(--hl-gap); font-weight: 650; min-width: 0; }
    #slim-hl-header img { width: 20px; height: 20px; }
    #slim-hl-panel .header-actions { display: flex; gap: 4px; }
    #slim-hl-panel button {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        background: var(--hl-surface); color: var(--hl-text); border: 1px solid var(--hl-border);
        padding: 7px 10px; border-radius: var(--hl-radius); min-height: 36px;
        cursor: pointer; font-size: 14px; line-height: 1.3; text-align: center;
        transition: background-color .15s ease;
    }
    #slim-hl-panel button:hover { background: var(--hl-hover); }
    #slim-hl-panel button:active { background: var(--hl-active); }
    #slim-hl-panel button:disabled { opacity: .5; cursor: default; }
    #slim-hl-panel button svg { width: 18px; height: 18px; flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    #slim-hl-panel .icon-btn { width: 36px; padding: 7px; }
    #slim-hl-panel .panel-body {
        display: block; padding: var(--hl-pad); overflow: auto; overscroll-behavior: contain;
        min-height: 0; scrollbar-gutter: stable; flex: 1 1 auto;
    }
    #slim-hl-panel.minimized .panel-body { display: none; }
    #slim-hl-panel .navigation { display: flex; align-items: center; justify-content: space-between; gap: var(--hl-gap); margin-bottom: 8px; }
    #slim-hl-panel .counter-group { min-width: 0; }
    #slim-hl-panel .counter { font-size: 16px; font-weight: 650; color: var(--hl-accent-text); font-variant-numeric: tabular-nums; }
    #slim-hl-panel .nav-btns { display: flex; gap: 6px; }
    #slim-hl-panel .section-title { display: block; font-size: 14px; font-weight: 650; margin: 12px 0 6px; }
    #slim-hl-panel label { display: block; margin: 0 0 6px; }
    #slim-hl-panel .check-label { display: flex; align-items: center; gap: var(--hl-gap); margin: 10px 0; min-height: 28px; }
    #slim-hl-panel input[type=range] { display: block; flex: 1; min-width: 0; width: 100%; min-height: 36px; margin: 0; accent-color: var(--hl-focus); cursor: pointer; }
    #slim-hl-panel .launcher-size-row { display: flex; align-items: center; gap: var(--hl-gap); }
    #slim-hl-panel .launcher-size-row output { min-width: 46px; font-variant-numeric: tabular-nums; text-align: right; }
    #slim-hl-panel input[type=text], #slim-hl-panel select, #slim-hl-panel textarea {
        display: block; width: 100%; min-width: 0; background: var(--hl-field); color: var(--hl-text);
        border: 1px solid var(--hl-border); border-radius: var(--hl-radius);
        padding: 8px 10px; font: inherit; min-height: 38px; caret-color: var(--hl-focus);
    }
    #slim-hl-panel input::placeholder { color: var(--hl-muted); opacity: 1; }
    #slim-hl-panel input[type=checkbox] { width: 18px; height: 18px; flex-shrink: 0; margin: 0; accent-color: var(--hl-focus); }
    #slim-hl-panel input[type=color] { display: block; width: 38px; min-width: 38px; height: 38px; padding: 3px; border: 1px solid var(--hl-border); border-radius: var(--hl-radius); background: var(--hl-field); cursor: pointer; }
    #slim-hl-panel .entry-row { display: flex; gap: var(--hl-gap); align-items: end; }
    #slim-hl-panel .entry-main { flex: 1; min-width: 0; }
    #slim-hl-panel .color-label { font-size: 12px; }
    #slim-hl-panel #add-kw-btn { width: 100%; margin-top: 10px; background: var(--hl-accent); border-color: var(--hl-accent); color: var(--hl-on-accent); font-weight: 650; }
    #slim-hl-panel #add-kw-btn:hover { background: var(--hl-accent-hover); }
    #slim-hl-panel #add-kw-btn:active { background: var(--hl-accent-active); }
    #slim-hl-panel .preview { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 12px; margin-top: 6px; }
    #slim-hl-panel details { display: block; margin-top: 14px; border-top: 1px solid var(--hl-divider); }
    #slim-hl-panel summary { display: list-item; cursor: pointer; padding: 10px 2px; font-weight: 600; }
    #slim-hl-panel details > .details-body { padding: 0 2px 8px; }
    #slim-hl-panel .panel-tools { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px 8px; margin-top: 8px; }
    #slim-hl-panel .panel-tools > details { margin-top: 0; min-width: 0; }
    #slim-hl-panel .panel-tools > details[open] { grid-column: 1 / -1; }
    #slim-hl-panel .panel-tools > details > summary { min-height: 36px; padding: 6px 2px; font-size: 13px; }
    #slim-hl-panel .hint, #slim-hl-panel .empty { color: var(--hl-muted); font-size: 13px; margin: 6px 0; overflow-wrap: anywhere; }
    #slim-hl-panel .error { color: var(--hl-danger); font-size: 13px; margin: 6px 0; white-space: pre-line; }
    #slim-hl-panel [aria-invalid=true] { border-color: var(--hl-danger); }
    #slim-hl-panel .search-row { display: flex; align-items: center; gap: var(--hl-gap); margin-bottom: 10px; }
    #slim-hl-panel .kw-item { display: flex; align-items: center; gap: 6px; margin: 8px 0; }
    #slim-hl-panel .kw-item input[type=text] { flex: 1; width: 0; }
    #slim-hl-panel .kw-count { min-width: 24px; text-align: right; font-variant-numeric: tabular-nums; color: var(--hl-muted); font-size: 12px; }
    #slim-hl-panel .kw-item .delete-keyword:hover { color: var(--hl-danger); }
    #slim-hl-panel .kw-item .save-keyword:hover { color: var(--hl-accent-text); }
    #slim-hl-panel .match-item { display: flex; width: 100%; justify-content: start; text-align: left; margin: 5px 0; border-color: transparent; overflow-wrap: anywhere; }
    #slim-hl-panel .match-item.active { border-color: var(--hl-focus); }
    #slim-hl-panel .match-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
    #slim-hl-panel #match-list { display: block; max-height: 210px; overflow: auto; padding: 3px; }
    #slim-hl-panel .status-row { display: flex; align-items: center; gap: var(--hl-gap); flex-wrap: wrap; margin-top: 8px; }
    #slim-hl-panel .status-row:has(#panel-status:empty):has(#undo-delete[hidden]) { margin-top: 0; }
    #slim-hl-panel #page-search-status:empty, #slim-hl-panel #panel-status:empty { margin: 0; }
    #slim-hl-panel .btn { width: 100%; margin: 4px 0; }
    #slim-hl-toggle {
        all: initial; position: fixed; z-index: 2147483646;
        bottom: max(var(--hl-launcher-inset, 20px), env(safe-area-inset-bottom, 0px)); right: max(var(--hl-launcher-inset, 20px), env(safe-area-inset-right, 0px));
        box-sizing: border-box; width: var(--hl-launcher-size, 56px); height: var(--hl-launcher-size, 56px); border-radius: calc(var(--hl-launcher-size, 56px) * .29); padding: 0;
        background: var(--hl-brand-logo) center / cover no-repeat; border: none; cursor: pointer;
        box-shadow: 0 4px 18px var(--hl-shadow);
    }
    #slim-hl-toggle[data-position=bottom-left], #slim-hl-toggle[data-position=top-left] { left: max(var(--hl-launcher-inset, 20px), env(safe-area-inset-left, 0px)); right: auto; }
    #slim-hl-toggle[data-position=top-right], #slim-hl-toggle[data-position=top-left] { top: max(var(--hl-launcher-inset, 20px), env(safe-area-inset-top, 0px)); bottom: auto; }
    #slim-hl-toggle:hover { filter: brightness(1.12); }
    #slim-hl-toggle:active { filter: brightness(.94); }
    #slim-pos-bar { position: fixed; right: 4px; top: 0; bottom: 0; width: 10px; z-index: 2147483645; pointer-events: none; }
    #slim-pos-bar .mark { position: absolute; left: 0; width: 8px; height: 4px; border-radius: 2px; pointer-events: auto; cursor: pointer; opacity: .75; }
    #slim-pos-bar .mark:hover, #slim-pos-bar .mark.active { opacity: 1; transform: scaleX(1.6); }
    @media (max-width: 480px) {
        #slim-selection-tools #selection-trigger { min-height: 44px; width: 44px; }
        #slim-hl-panel input[type=text], #slim-hl-panel select, #slim-hl-panel textarea { font-size: 16px; }
        #slim-hl-panel button, #slim-hl-panel summary, #slim-selection-tools button, #slim-selection-tools summary { min-height: 44px; }
        #slim-hl-panel .icon-btn { width: 40px; }
        #slim-hl-panel .page-row > .term-visibility { width: 44px; }
        #slim-hl-panel input[type=range] { min-height: 44px; }
        #slim-hl-panel .panel-tools > details > summary { min-height: 44px; }
    }
    @media (prefers-reduced-motion: reduce) { #slim-hl-panel button { transition: none; } }
    @media (forced-colors: active) {
        #slim-hl-panel, #slim-hl-panel *, #slim-selection-tools, #slim-selection-tools * { scrollbar-color: auto; }
        #slim-hl-panel { border: 1px solid CanvasText; }
        #slim-hl-panel :focus-visible, #slim-hl-toggle:focus-visible { outline-color: Highlight; }
    }
    #slim-find-bar { all: initial; position: fixed; z-index: 2147483647; top: max(12px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); width: min(480px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: auto; padding: 8px; border: 1px solid var(--hl-divider); border-radius: 10px; background: var(--hl-bg); color: var(--hl-text); font: 14px/1.45 system-ui, sans-serif; color-scheme: var(--hl-scheme); box-sizing: border-box; pointer-events: auto; box-shadow: 0 6px 20px var(--hl-shadow); scrollbar-color: var(--hl-scroll-thumb) var(--hl-field); scrollbar-width: thin; }
    #slim-find-bar :where(:not(svg, svg *)) { all: revert; font: inherit; color: inherit; box-sizing: border-box; }
    #slim-find-bar[hidden], #slim-find-bar [hidden] { display: none !important; }
    #slim-find-bar .find-row, #slim-find-bar .find-options { display: flex; align-items: center; gap: 4px; min-width: 0; }
    #slim-find-bar .find-field { display: flex; align-items: center; flex: 1; min-width: 64px; border: 1px solid var(--hl-border); border-radius: 6px; background: var(--hl-field); }
    #slim-find-bar #find-query { width: 100%; min-width: 0; border: 0; background: transparent; padding: 7px 8px; color: var(--hl-text); caret-color: var(--hl-focus); outline-offset: -2px; }
    #slim-find-bar #find-query::placeholder { color: var(--hl-muted); }
    #slim-find-bar button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-width: 32px; min-height: 36px; padding: 5px; border: 0; border-radius: 6px; color: var(--hl-text); background: transparent; cursor: pointer; }
    #slim-find-bar button:hover:not(:disabled) { background: var(--hl-hover); }
    #slim-find-bar button:active:not(:disabled) { background: var(--hl-active); }
    #slim-find-bar button:disabled { opacity: .5; cursor: default; }
    #slim-find-bar :focus-visible { outline: 2px solid var(--hl-focus); outline-offset: -2px; }
    #slim-find-bar svg { display: block; width: 18px; height: 18px; flex-shrink: 0; }
    #slim-find-bar #find-counter { white-space: nowrap; min-width: 44px; text-align: center; font-variant-numeric: tabular-nums; font-size: 12px; color: var(--hl-accent-text); }
    #slim-find-bar .find-options { flex-wrap: wrap; margin-top: 4px; gap: 8px; }
    #slim-find-bar label { display: inline-flex; gap: 4px; align-items: center; min-height: 32px; font-size: 12px; cursor: pointer; }
    #slim-find-bar input[type=checkbox] { accent-color: var(--hl-focus); width: 16px; height: 16px; margin: 0; }
    #slim-find-bar #find-add { margin-left: auto; padding: 5px 8px; background: var(--hl-surface); font-size: 12px; }
    #slim-find-bar #find-status { margin: 2px 0 0; min-height: 17px; color: var(--hl-muted); font-size: 12px; }
    @media (max-width: 600px) { #slim-find-bar button, #slim-find-bar label { min-height: 44px; } #slim-find-bar #find-query { font-size: 16px; } #slim-find-bar .find-row > button { min-width: 36px; } }
    @media (forced-colors: active) { #slim-find-bar { border-color: CanvasText; scrollbar-color: auto; } #slim-find-bar :focus-visible { outline-color: Highlight; } }

`;
GM_addStyle(UI_CSS);
