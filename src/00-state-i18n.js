let keywords = GM_getValue('hl_keywords', []);
let enabled = GM_getValue('hl_enabled', true);
let autoSearch = GM_getValue('hl_auto_search', true);
let panelPos = GM_getValue('hl_panel_pos', { x: 20, y: 80 });
let panelState = GM_getValue('hl_panel_state', { open: false, minimized: false });
let searchHistory = GM_getValue('hl_search_history', []);
let blacklist = GM_getValue('hl_blacklist', ['docs.google.com', 'youtube.com', 'netflix.com']);
let searchEngine = GM_getValue('hl_search_engine', 'google');
let showPosBar = GM_getValue('hl_show_posbar', true);
let lang = GM_getValue('hl_lang', 'auto');
const DEFAULT_LAUNCHER_SIZE = 56;
function normalizeLauncherSize(value) {
    return typeof value === 'number' && Number.isFinite(value)
        ? Math.max(44, Math.min(80, Math.round(value / 4) * 4)) : DEFAULT_LAUNCHER_SIZE;
}
let uiTheme = GM_getValue('hl_ui_theme', 'dark') === 'light' ? 'light' : 'dark';
let launcherSize = normalizeLauncherSize(GM_getValue('hl_launcher_size', DEFAULT_LAUNCHER_SIZE));
const LAUNCHER_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
const savedLauncherPosition = GM_getValue('hl_launcher_position', 'bottom-right');
let launcherPosition = LAUNCHER_POSITIONS.includes(savedLauncherPosition) ? savedLauncherPosition : 'bottom-right';
function normalizeLauncherInset(value) {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(8, Math.min(80, Math.round(value / 4) * 4)) : 20;
}
let launcherInset = normalizeLauncherInset(GM_getValue('hl_launcher_inset', 20));

const LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCI+CiAgPHRpdGxlPlNsaW0gU2VhcmNoIEhpZ2hsaWdodDwvdGl0bGU+CiAgPHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIHJ4PSIyOCIgZmlsbD0iIzI2MzIzOCIvPgogIDwhLS0gSGlnaGxpZ2h0cyAtLT4KICA8cmVjdCB4PSIyMCIgeT0iMzAiIHdpZHRoPSI1MiIgaGVpZ2h0PSIxNiIgcng9IjQiIGZpbGw9IiNmZmUwODIiLz4KICA8cmVjdCB4PSIzNCIgeT0iNTYiIHdpZHRoPSI0NCIgaGVpZ2h0PSIxNiIgcng9IjQiIGZpbGw9IiM5MGNhZjkiLz4KICA8cmVjdCB4PSIyMCIgeT0iODIiIHdpZHRoPSIzNiIgaGVpZ2h0PSIxNiIgcng9IjQiIGZpbGw9IiNhNWQ2YTciLz4KICA8IS0tIFRleHQgbGluZXMgLS0+CiAgPGcgZmlsbD0iI2VjZWZmMSIgb3BhY2l0eT0iLjkiPgogICAgPHJlY3QgeD0iMjQiIHk9IjM1IiB3aWR0aD0iNDQiIGhlaWdodD0iNiIgcng9IjMiIGZpbGw9IiMyNjMyMzgiLz4KICAgIDxyZWN0IHg9IjM4IiB5PSI2MSIgd2lkdGg9IjM2IiBoZWlnaHQ9IjYiIHJ4PSIzIiBmaWxsPSIjMjYzMjM4Ii8+CiAgICA8cmVjdCB4PSIyNCIgeT0iODciIHdpZHRoPSIyOCIgaGVpZ2h0PSI2IiByeD0iMyIgZmlsbD0iIzI2MzIzOCIvPgogICAgPHJlY3QgeD0iNzgiIHk9IjM1IiB3aWR0aD0iMTYiIGhlaWdodD0iNiIgcng9IjMiLz4KICAgIDxyZWN0IHg9IjIwIiB5PSI2MSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjYiIHJ4PSIzIi8+CiAgICA8cmVjdCB4PSI4MiIgeT0iNjEiIHdpZHRoPSIxMiIgaGVpZ2h0PSI2IiByeD0iMyIvPgogICAgPHJlY3QgeD0iNjIiIHk9Ijg3IiB3aWR0aD0iMzIiIGhlaWdodD0iNiIgcng9IjMiLz4KICA8L2c+CiAgPCEtLSBQb3NpdGlvbiBiYXIgLS0+CiAgPHJlY3QgeD0iMTA0IiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iODgiIHJ4PSIzIiBmaWxsPSIjNDU1YTY0Ii8+CiAgPHJlY3QgeD0iMTA0IiB5PSIzMiIgd2lkdGg9IjYiIGhlaWdodD0iNSIgcng9IjIiIGZpbGw9IiNmZmUwODIiLz4KICA8cmVjdCB4PSIxMDQiIHk9IjYwIiB3aWR0aD0iNiIgaGVpZ2h0PSI1IiByeD0iMiIgZmlsbD0iIzkwY2FmOSIvPgogIDxyZWN0IHg9IjEwNCIgeT0iODYiIHdpZHRoPSI2IiBoZWlnaHQ9IjUiIHJ4PSIyIiBmaWxsPSIjYTVkNmE3Ii8+Cjwvc3ZnPgo=';

const I18N = {
    en: {
        openPanel: 'Open highlight panel', minimize: 'Minimize', close: 'Close',
        prev: 'Previous highlight (Alt + ←)', next: 'Next highlight (Alt + →)',
        kwSearch: 'Search keywords…', kwPlaceholder: 'Keyword or /regex/',
        wholeWords: 'Whole words only', domains: 'Only on domains (optional, comma-separated)', add: 'Add',
        keywords: 'Keywords', settings: 'Settings', recent: 'Recent searches',
        appearance: 'Appearance', colorTheme: 'Color theme', themeLight: 'Light', themeDark: 'Dark',
        launcherSize: 'Open button size', launcherSizeHint: 'Size of the floating open button (44–80 px).', resetLauncherSize: 'Reset size',
        launcherPosition: 'Open button position', launcherInset: 'Distance from edge', bottomRight: 'Bottom right', bottomLeft: 'Bottom left', topRight: 'Top right', topLeft: 'Top left',
        appearanceSaveFailed: 'Could not save the appearance. The previous setting was restored.',
        searchTransferFailed: 'Could not store the search words for the result page. Navigation remains available.',
        downloadUnsupported: 'Your userscript manager does not support secure downloads.', downloadFailed: 'Download failed. Check your userscript manager settings.',
        unsafeRegex: 'This regular expression is too complex for safe page highlighting. Use a simpler expression or plain text.',
        saveKeyword: text => `Save keyword “${text}”`, historyManagerHint: 'Open recent searches from the userscript manager menu. Private searches are not displayed in this webpage.',
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
        appearance: 'Darstellung', colorTheme: 'Farbschema', themeLight: 'Hell', themeDark: 'Dunkel',
        launcherSize: 'Größe des Öffnen-Buttons', launcherSizeHint: 'Größe des schwebenden Öffnen-Buttons (44–80 px).', resetLauncherSize: 'Größe zurücksetzen',
        launcherPosition: 'Position des Öffnen-Buttons', launcherInset: 'Abstand zum Rand', bottomRight: 'Unten rechts', bottomLeft: 'Unten links', topRight: 'Oben rechts', topLeft: 'Oben links',
        appearanceSaveFailed: 'Darstellung konnte nicht gespeichert werden. Die vorherige Einstellung wurde wiederhergestellt.',
        searchTransferFailed: 'Suchwörter konnten nicht für die Ergebnisseite gespeichert werden. Der Link lässt sich weiterhin öffnen.',
        downloadUnsupported: 'Dein Userscript-Manager unterstützt keine sicheren Downloads.', downloadFailed: 'Download fehlgeschlagen. Prüfe die Einstellungen deines Userscript-Managers.',
        unsafeRegex: 'Dieser reguläre Ausdruck ist für sicheres Hervorheben zu komplex. Verwende einen einfacheren Ausdruck oder normalen Text.',
        saveKeyword: text => `Suchwort „${text}“ speichern`, historyManagerHint: 'Letzte Suchen stehen im Menü des Userscript-Managers. Private Suchanfragen werden nicht in dieser Webseite angezeigt.',
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

Object.assign(I18N.en, {
    addKeyword: 'Add a keyword', keywordLabel: 'Keyword', colorLabel: 'Highlight color',
    advanced: 'Advanced options', regexHelp: 'Use /pattern/flags for regular expressions, for example /solar/i.',
    matchDetails: 'Match details', filterLabel: 'Filter saved keywords', clearSearch: 'Clear keyword filter',
    resetPosition: 'Reset panel position', movePanel: 'Move panel with arrow keys; Home resets position',
    expand: 'Expand', emptyKeyword: 'Enter a keyword.',
    regexHint: 'Check the brackets and flags, for example /solar/i.',
    duplicateHint: 'Edit the existing keyword or choose a different term.',
    deleted: k => `“${k}” removed.`, undo: 'Undo removal', restored: 'Keyword restored.',
    editKeyword: k => `Edit keyword “${k}”`, deleteKeyword: k => `Delete keyword “${k}”`,
    colorKeyword: k => `Color for “${k}”`, matchNumber: (n, total) => `Match ${n} of ${total}`,
    statusCount: (n, total) => `Match ${n} of ${total}`, preview: 'Preview',
    excluded: 'Highlights are disabled on this domain.'
});
Object.assign(I18N.de, {
    addKeyword: 'Suchbegriff hinzufügen', keywordLabel: 'Suchbegriff', colorLabel: 'Highlight-Farbe',
    advanced: 'Erweiterte Optionen', regexHelp: 'Regex als /Muster/Flags eingeben, zum Beispiel /solar/i.',
    matchDetails: 'Trefferdetails', filterLabel: 'Gespeicherte Begriffe filtern', clearSearch: 'Keyword-Filter löschen',
    resetPosition: 'Panelposition zurücksetzen', movePanel: 'Panel mit Pfeiltasten verschieben; Pos1 setzt die Position zurück',
    expand: 'Ausklappen', emptyKeyword: 'Gib einen Suchbegriff ein.',
    regexHint: 'Prüfe Klammern und Flags, zum Beispiel /solar/i.',
    duplicateHint: 'Bearbeite den vorhandenen Begriff oder wähle einen anderen.',
    deleted: k => `„${k}“ entfernt.`, undo: 'Entfernen rückgängig machen', restored: 'Suchbegriff wiederhergestellt.',
    editKeyword: k => `Suchbegriff „${k}“ bearbeiten`, deleteKeyword: k => `Suchbegriff „${k}“ löschen`,
    colorKeyword: k => `Farbe für „${k}“`, matchNumber: (n, total) => `Treffer ${n} von ${total}`,
    statusCount: (n, total) => `Treffer ${n} von ${total}`, preview: 'Vorschau',
    excluded: 'Highlights sind auf dieser Domain deaktiviert.'
});

Object.assign(I18N.en, {
    pageHeading: 'On this page', pageHint: 'Select a word or passage. Use the floating highlighter to find every occurrence here.',
    pageTerms: 'Page highlights', permanentKeywords: 'Saved keywords', clearPage: 'Clear page highlights',
    deletePageTerm: text => `Remove page highlight “${text}”`,
    selectionActions: 'Actions for selected text', highlightSelection: 'Highlight all occurrences', highlightSelectionHint: 'Highlight the selected passage and all other occurrences on this page', webSearch: 'Search the web',
    highlightUnsupported: 'Page highlighting requires a browser with CSS Custom Highlights support.',
    pageResults: 'Page highlights', allResults: 'Keywords',
    pageHintShort: 'Select text → use the highlighter symbol.', clearPageShort: 'Clear all', undoShort: 'Undo',
    pageOptionsShort: 'Search options', permanentKeywordsShort: 'Keywords', helpTitle: 'Help & shortcuts',
    navigationHelp: 'Use the arrows to move between matches. Page highlights take priority over saved and automatic keywords.',
    rememberShort: 'Remember', forgetShort: 'Forget', pageSavedShort: 'Saved',
    shortcutTitle: 'Highlight selection shortcut', shortcutOff: 'Disabled', shortcutHint: key => `Shortcut: ${key}. Page highlights are cleared on navigation or reload.`,
    recordShortcut: 'Change shortcut', recordingShortcut: 'Press a shortcut…', disableShortcut: 'Disable shortcut', resetShortcut: 'Reset shortcut',
    shortcutHelp: 'Use Alt, Ctrl or Meta plus a letter or digit; Shift is optional. Escape cancels. Browser or system shortcuts may conflict.',
    shortcutInvalid: 'Use Alt, Ctrl or Meta together with a letter or digit.', controlKey: 'Ctrl',
    engine: 'Search engine for web search:'
});
Object.assign(I18N.de, {
    pageHeading: 'Auf dieser Seite', pageHint: 'Wort oder Passage auswählen. Das schwebende Textmarker-Symbol findet alle Vorkommen hier.',
    pageTerms: 'Seitenmarkierungen', permanentKeywords: 'Dauerhafte Keywords', clearPage: 'Seitenmarkierungen löschen',
    deletePageTerm: text => `Seitenmarkierung „${text}“ entfernen`,
    selectionActions: 'Aktionen für ausgewählten Text', highlightSelection: 'Alle Vorkommen markieren', highlightSelectionHint: 'Auswahl und alle weiteren Vorkommen auf dieser Seite hervorheben', webSearch: 'Im Web suchen',
    highlightUnsupported: 'Seitenmarkierungen benötigen einen Browser mit Unterstützung für CSS Custom Highlights.',
    pageResults: 'Seitenmarkierungen', allResults: 'Suchwörter',
    pageHintShort: 'Text auswählen → Textmarker-Symbol nutzen.', clearPageShort: 'Alle löschen', undoShort: 'Rückgängig',
    pageOptionsShort: 'Suchoptionen', permanentKeywordsShort: 'Keywords', helpTitle: 'Hilfe & Shortcuts',
    navigationHelp: 'Mit den Pfeilen zwischen Treffern wechseln. Seitenmarkierungen haben Vorrang vor gespeicherten und automatischen Suchwörtern.',
    rememberShort: 'Merken', forgetShort: 'Vergessen', pageSavedShort: 'Gespeichert',
    shortcutTitle: 'Shortcut zum Hervorheben der Auswahl', shortcutOff: 'Deaktiviert', shortcutHint: key => `Shortcut: ${key}. Seitenmarkierungen werden bei Navigation oder Neuladen entfernt.`,
    recordShortcut: 'Shortcut ändern', recordingShortcut: 'Tastenkombination drücken…', disableShortcut: 'Shortcut deaktivieren', resetShortcut: 'Shortcut zurücksetzen',
    shortcutHelp: 'Alt, Strg oder Meta mit einem Buchstaben oder einer Ziffer; Shift ist optional. Escape bricht ab. Browser- oder Systemshortcuts können kollidieren.',
    shortcutInvalid: 'Alt, Strg oder Meta mit einem Buchstaben oder einer Ziffer verwenden.', controlKey: 'Strg',
    engine: 'Suchmaschine für die Websuche:'
});

Object.assign(I18N.en, {
    pageColor: text => `Color for page passage “${text}”`, rememberPageTerm: 'Remember for this page', forgetPageTerm: 'Forget saved passage',
    pageSaved: 'Saved on this device', pageTemporary: 'Temporary', savedMissing: 'Not found — page content may have changed',
    pageRemembered: 'Passage saved for this page.', pageForgotten: 'Saved passage removed; temporary highlights remain.',
    pageUndone: 'Page change undone.', undoPage: 'Undo page change', searching: 'Searching…',
    pageOptions: 'Page search options', pageWhole: 'Match whole words', pageScope: 'Search area', scopeAll: 'Entire page', scopeArticle: 'Article only',
    articleMissing: 'No article area found. Choose Entire page to search elsewhere.',
    pageSaveFailed: 'Could not save this change. The previous state was kept.', storageUnsupported: 'Saved-page data has an unsupported format. Export it before changing it.',
    shareActions: 'Copy / export', copyQuote: 'Copy quote + URL', copyLink: 'Copy link to text', sourceLabel: 'Source',
    copyFormat: 'Quote format', plainFormat: 'Plain text', markdownFormat: 'Markdown', copied: 'Copied to clipboard.',
    plainLinkCopied: 'Page link copied; text-fragment links are not supported here.',
    manualCopyReady: 'Text is ready to copy manually.', manualCopy: 'Copy manually', manualCopyHint: 'Clipboard access failed. Select and copy the text below.', closeManualCopy: 'Close manual copy',
    exportMarkdown: 'Export this page as Markdown', exportSaved: 'Export saved pages (JSON)',
    shortcutHint: key => `Shortcut: ${key}. Temporary marks disappear on navigation; only explicitly saved passages are restored.`
});
Object.assign(I18N.de, {
    pageColor: text => `Farbe für Seitenpassage „${text}“`, rememberPageTerm: 'Für diese Seite merken', forgetPageTerm: 'Gespeicherte Passage vergessen',
    pageSaved: 'Auf diesem Gerät gespeichert', pageTemporary: 'Temporär', savedMissing: 'Nicht gefunden – Seiteninhalt möglicherweise verändert',
    pageRemembered: 'Passage für diese Seite gespeichert.', pageForgotten: 'Gespeicherte Passage entfernt; temporäre Markierungen bleiben.',
    pageUndone: 'Seitenänderung rückgängig gemacht.', undoPage: 'Seitenänderung rückgängig', searching: 'Suche läuft…',
    pageOptions: 'Suchoptionen für diese Seite', pageWhole: 'Nur ganze Wörter suchen', pageScope: 'Suchbereich', scopeAll: 'Gesamte Seite', scopeArticle: 'Nur Artikel',
    articleMissing: 'Kein Artikelbereich gefunden. Wähle Gesamte Seite, um außerhalb zu suchen.',
    pageSaveFailed: 'Die Änderung ließ sich nicht speichern. Der bisherige Zustand bleibt erhalten.', storageUnsupported: 'Gespeicherte Seitendaten haben ein unbekanntes Format. Exportiere sie vor Änderungen.',
    shareActions: 'Kopieren / Export', copyQuote: 'Zitat + URL kopieren', copyLink: 'Link zur Textstelle kopieren', sourceLabel: 'Quelle',
    copyFormat: 'Zitatformat', plainFormat: 'Klartext', markdownFormat: 'Markdown', copied: 'In die Zwischenablage kopiert.',
    plainLinkCopied: 'Seitenlink kopiert; Links zu Textstellen werden hier nicht unterstützt.',
    manualCopyReady: 'Text zum manuellen Kopieren bereit.', manualCopy: 'Manuell kopieren', manualCopyHint: 'Zugriff auf die Zwischenablage fehlgeschlagen. Den Text unten auswählen und kopieren.', closeManualCopy: 'Manuelles Kopieren schließen',
    exportMarkdown: 'Diese Seite als Markdown exportieren', exportSaved: 'Gespeicherte Seiten exportieren (JSON)',
    shortcutHint: key => `Shortcut: ${key}. Temporäre Markierungen verschwinden bei Navigation; nur ausdrücklich gespeicherte Passagen werden wiederhergestellt.`
});

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
