# Architecture

[Documentation index](README.md) · [Development](development.md) · [Design system](design/DESIGN.md)

Slim Search Highlight has no production dependencies and installs as one userscript. Development sources are grouped by responsibility; a small Node assembler concatenates them in the explicit order in `src/manifest.json` into the existing `userscript/slim-search-highlight.user.js` URL. There is no runtime loader, remote code import, or framework.

## Source ownership

| Source | Responsibility |
|---|---|
| `src/metadata.txt` | Userscript identity, version, grants and update/install URLs |
| `assets/icon.svg`, `assets/icon-dark.svg`, `assets/icons/` | Canonical shared logo and selection-action SVG assets, embedded by the build |
| `src/00-state-i18n.js` | Preferences including validated appearance values, German/English messages |
| `src/10-styles.js` | Scoped panel/selection toolbar CSS and tokens |
| `src/20-utils.js` | Icons, escaping, contrast calculation |
| `src/25-private-ui.js` | Closed UI root, private node references and activation boundary |
| `src/30-page-state.js` | Page records, undo, explicit storage and search options |
| `src/40-page-search.js` | Rendered-text index, normalized offset mapping, range collection and painting |
| `src/50-page-ui-sharing.js` | Page list, selection actions, clipboard and local exports |
| `src/60-keywords.js` | Keyword preferences, search-query capture/handoff, matchers and owned DOM writes |
| `src/70-engine-navigation.js` | Incremental keyword engine, positions, counters and result navigation |
| `src/80-panel.js` | Panel controls, shared appearance application, layout, focus, keyword editing and language restoration |
| `src/90-lifecycle.js` | Input handlers, mutation observation, initialization and userscript menus |

These are ordered source sections sharing one private lexical scope, **not isolated ES modules**. Functions can reference later declarations, but initialization must finish before event handlers run. Keep side effects that start the application in the final section. Cross-cutting changes should retain regression coverage; the manifest is the composition contract.

`npm run build` writes the artifact. `npm run check` compares it byte-for-byte with the source-generated result and checks JavaScript syntax. `npm test` includes this check. Do not hand-edit the generated file.

The build embeds `assets/icon.svg` and `assets/icon-dark.svg` as the shared theme-specific `LOGOS` and manifest-listed action SVGs as `INLINE_ICONS` before the source sections. Selection trigger, launcher and panel header use the same complete logo. Assets are canonical; no derived alternate logo, duplicated SVG/base64 source or runtime icon fetch is needed. Inline action SVGs are decorative and their buttons retain localized labels.

## Two highlighting paths

**Permanent keywords** retain the incremental DOM-wrapper engine and their existing storage keys. It processes work in animation-frame slices and updates only added content where possible.

**Page passages** are records with an ID, exact normalized text, color, explicit saved state and quote/context anchor. They use native CSS Custom Highlights with `Range` objects, leaving page markup intact. Node normalization is weakly cached; normalized-to-raw offsets are computed once and looked up directly. Hidden inline content does not invent a word boundary; real block/BR boundaries do. Whole-word and article-only modes are explicit options.

Large page searches run in bounded work steps with a generation token. New requests, disable/exclusion and page identity changes cancel obsolete work. A completed generation commits paint, counts and navigation. Position ticks are limited to 500 and the contextual list to 300; actual occurrences remain available through navigation.

The shared navigation uses page passages while any page terms exist, otherwise permanent/automatic keyword results. Per-term paint groups have contrast-selected foregrounds; the current occurrence has higher priority.

UI lookup uses closure-owned `uiById`/`uiQueryAll` references rather than webpage IDs. Panel, toolbar and launcher are rendered inside a closed shadow tree in the manager's isolated world, using the shared `UI_CSS`; document highlights and position ticks intentionally remain in the webpage. Closed Shadow DOM alone does not hide data from native search. Profile display is limited to applicable domains, and search history stays in the manager menu. Exports call the manager download API without a page-visible Blob link. See the [security model](security-model.md).

## Ownership and invalidation

### Search-result transfer

Search pages capture the current submitted URL query again at native result-link activation (`click`, `auxclick`, `contextmenu`, capture phase). A search field is used only when the URL lacks query parameters, so an unsubmitted field draft does not replace the results query. Events are observed without cancellation, link rewriting or an extra web request. Nested link content is resolved through its anchor; Google's `/url` target parameters are unwrapped.

Versioned `hl_search_handoffs` records correlate up to twelve destination URLs (ignoring fragments) with terms and timestamps. Automatic destination matching prefers this record, then query-bearing search referrers, then an origin-matching source cache. Entries are valid for ten minutes. Previously installed unscoped cache records remain readable for their remaining TTL; new records carry the source origin and do not affect unrelated direct page visits. Concurrent handoffs to different URLs remain separate; the same exact URL uses the latest captured context. Storage is read/merge/write, not a transactional cross-tab queue.

Opt-out prevents automatic reads and new captures. Explicit marker/history actions remain separate. Failed query-cache writes cannot abort initialization or cancel navigation; unknown handoff schema versions are preserved. No change is made to native CSS page-passage storage or permanent keyword records. The [SearchJumper research note](research/searchjumper-search-handoff.md) explains the source comparison and differences.

### DOM ownership

Known synchronous wrapper writes use `ownDOMChanges`: pending external records are processed before writing, then the records generated by that synchronous write are drained. This avoids a permanent exemption for `.slim-hl` descendants: later host edits inside these spans still trigger a refresh. UI nodes are separately excluded from observation and search.

A selection snapshot preserves raw text, visible selected text, URL, a cloned range and the original focus target. It is validated before use; disconnected, collapsed or changed ranges dismiss the toolbar even when it has keyboard focus. Successful copying shows a short private status surface beside the selection tools and preserves panel state. An older asynchronous clipboard success never dismisses a newer selection. Denial opens the existing manual-copy field.

## Appearance ownership

The shared `data-theme` variant in `src/10-styles.js` owns dark/light tokens for the panel, selection toolbar, launcher and copy confirmation. `applyAppearance` in `src/80-panel.js` updates those surfaces in place, applies interface transparency and bounded launcher geometry. The selection trigger consistently uses the standalone logo tile; its size remains independent of launcher geometry. Generic control IDs are always resolved inside the owned panel so host-page fields remain untouched. No theme attributes or variables are written to the host document root.

Appearance preferences join the existing change-only persistence registry. A failed write restores the last saved appearance and reports a semantic localized status; a successful retry clears the stale failure. Native selects and ranges use the same control styles as existing settings. See [Design system](design/DESIGN.md) for the token mapping and [data format](data-format.md) for preference keys.

## Keyboard ownership

`renderShortcut` owns the current selection shortcut labels, hover titles and `aria-keyshortcuts`. Disabling, resetting, recording or changing locale refreshes those values. Selection shortcuts remain independently configurable; Alt+Shift+H is the default.

`handlePanelShortcut` in `src/80-panel.js` handles Alt+Shift+P. Both the document handler and the private-root key handler call it, because private UI key events intentionally do not propagate to the host page. The shared handler requires a trusted event and rejects editing fields, IME, repeat, recording mode and excluded domains. It consumes the event before changing state, so a storage exception cannot relay a private key event to the document and toggle twice. A failed state write keeps the current session toggle and uses `showLocalFeedback`, the same private status provider as copying; a successful retry clears that failure. Existing selection assignments take priority; if marking owns Alt+Shift+P, panel activation is unavailable and its tooltip/Help reflect that state.

## Storage and privacy

- Global keywords and preferences retain their existing `hl_*` keys.
- Page passages are transient until “Remember for this page” is explicitly chosen.
- `hl_page_annotations` is versioned local userscript-manager data, keyed by the **complete URL**, including query and fragment. Other URL entries are merged from the latest stored value before writing.
- Saved text/color/quote context and page search options are restored on revisit. Missing exact text stays visible as “Not found”; no fuzzy text substitution occurs.
- Undo holds at most 20 page states in memory. Failed storage writes roll back saved state and report the failure. Unknown schema versions are preserved and can be exported.
- Clipboard, Markdown/JSON download and web search only run from explicit actions. No cloud sync, analytics or automatic transmission is added.

See [data format](data-format.md) and [development](development.md) for validation and extension guidance.

SPA URL monitoring remains active while current page terms or known saved page records exist, so navigation from an empty page can restore saved passages. Every mutating page action validates URL identity before writing; stale old-page controls cannot delete or overwrite another URL record. Large single-node whitespace normalization is chunked as well as the DOM walk.
