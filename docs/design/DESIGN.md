---
version: alpha
name: Slim Search Highlight
description: A compact floating highlighter palette for reading and researching on arbitrary webpages.
colors:
  primary: '#7ee3cc'
  background: '#202b29'
  surface: '#2a3935'
  field: '#18231f'
  text: '#fffaf0'
  muted: '#b7cbc4'
  border: '#78958b'
  danger: '#ff9e91'
typography:
  sans:
    fontFamily: 'system-ui, -apple-system, sans-serif'
rounded:
  DEFAULT: '6px'
  panel: '10px'
spacing:
  control-gap: '8px'
  panel-padding: '10px'
components:
  button:
    minHeight: '36px'
  input:
    minHeight: '38px'
  panel:
    maxWidth: '320px'
---

# Slim Search Highlight Design System

## Overview

### Creative North Star
A marked page beside the page: a white-paper identity, dark ink lines and mint, sun-yellow and coral highlights with a narrow occurrence rail. Keep surrounding tools quiet and concentrate the selection workflow at the top. The same mark links the logo, launcher, panel header and selection trigger; functional icons describe the action rather than replacing its label. The [German design guideline](README.md) explains the identity and usage rules.

### Product context and register
- Audience/job: people reading and researching across webpages; add terms and move between occurrences.
- Evidence: README, current usage guides, canonical SVG assets, existing script and browser tests. No specific geographic market or user-research claims.
- Locales: German and English, auto follows browser language with English fallback. All owned labels, errors and accessible names use the active locale.
- Register: product utility; a nonmodal floating panel with underlying webpage remaining interactive.
- Signature: keyword colors link saved terms, in-page marks and the position bar.
- Restraint: system fonts, familiar native fields/selects; no marketing layout, external fonts, gradients or runtime framework.
- Token ownership/runtime mapping: `src/colors.json` is canonical for all built-in colors. `scripts/build.mjs` embeds `COLORS` and synchronizes tagged SVG color attributes; `src/10-styles.js` maps semantic theme roles into scoped `--hl-*` variables. Both highlight engines, the position rail and navigation use this same source. This document mirrors accepted values and intent; geometry remains owned by CSS/SVG sources.

## Colors
Runtime --hl-bg, --hl-surface, --hl-field, --hl-text, --hl-muted, --hl-border, --hl-accent and --hl-danger map to the correspondingly named frontmatter colors (accent = primary). Use accent for the add button, focus and navigation state. All custom highlight backgrounds get automatically selected black or white text using sRGB relative luminance. The selected panel scheme is independent of the host webpage; forced-colors restores system scrollbar colors and visible outlines.

## Appearance tokens and launcher (4.4.0)

The user-supplied reference combines cream, yellow, coral, mint, sky blue and charcoal. **Sunlit Mint** uses neutral white or green-charcoal surfaces, teal/mint for controls, coral for danger and a single shared highlighter family. Dark remains the default; Light is chosen explicitly. The host webpage keeps its own colors.

Color ownership is **Model B**, consolidated from scattered runtime literals into `src/colors.json` as part of this system-wide update. The builder embeds that source as `COLORS`; `themeDeclarations` creates scoped CSS variables. SVG geometry remains canonical in `assets/icon.svg` and `assets/icon-dark.svg`; their `data-fill`/`data-stroke` paths identify JSON-owned color roles. Build updates those attributes and `--check` rejects stale logos or userscript output. No runtime assets or dependencies are fetched.

| Token | Dark | Light | Consumers |
|---|---|---|---|
| `--hl-bg` | `#202b29` | `#ffffff` | Panel, selection menu |
| `--hl-surface` | `#2a3935` | `#f3f5f6` | Header, buttons, local feedback |
| `--hl-field` | `#18231f` | `#ffffff` | Inputs, scrollbar track |
| `--hl-text` | `#fffaf0` | `#343b3a` | Text, icon strokes |
| `--hl-muted` | `#b7cbc4` | `#52665f` | Hints, counts, placeholders |
| `--hl-border` | `#78958b` | `#718781` | Control boundaries |
| `--hl-accent` | `#7ee3cc` | `#147d83` | Primary action, text selection |
| `--hl-on-accent` | `#193b37` | `#ffffff` | Primary/selection foreground |
| `--hl-accent-hover` | `#a1ecd9` | `#116a70` | Primary hover |
| `--hl-accent-active` | `#62cbb4` | `#0d595e` | Primary pressed |
| `--hl-accent-text` | `#7ee3cc` | `#147d83` | Counter, saved state |
| `--hl-focus` | `#7ee3cc` | `#147d83` | Keyboard focus, active list item, native control accents |
| `--hl-danger` | `#ff9e91` | `#b53e35` | Inline errors, destructive hover |
| `--hl-hover` | `#354a43` | `#e7edee` | Neutral hover |
| `--hl-active` | `#405c53` | `#d9e3e5` | Neutral pressed |
| `--hl-divider` | `#425950` | `#dce3e4` | Sections, panel boundary |
| `--hl-scroll-thumb` | `#78958b` | `#718781` | Scrollbar thumb |
| `--hl-scroll-hover` | `#a4cabe` | `#52665f` | Scrollbar hover |
| `--hl-shadow` | `rgba(0,0,0,.4)` | `rgba(32,43,41,.18)` | Overlay shadows |
| `--hl-scheme` | `dark` | `light` | Native controls |

The same semantic role changes tone between themes, never meaning. The primary action has explicit idle/hover/pressed colors and an on-accent foreground; teal in light mode and mint in dark mode keep contrast. Native selects remain browser-owned. Text and focus are tested at the opaque default; higher user-selected transparency intentionally lowers contrast.

Both automatic search words and own selections start from the same eight-color `highlights` array, beginning with mint, then sun-yellow and coral. The complete logo and its occurrence ticks use that same order, top to bottom. New own passages skip colors occupied by current passages or applicable keywords. After the starters, `chooseHighlightColor` in `src/20-utils.js` selects the unused related tint/shade with the largest minimum OKLab distance to occupied colors. Candidates use 15/30/45/60% tint/shade steps, OKLab lightness .58–.92 and chroma at least .06. If those family tones are exhausted, it scores a bounded set of 128 unused vivid RGB candidates. The same allocator serves automatic queries, which only depend on their preceding keyword colors, and own passages, which also avoid current own colors. Automatic assignments are cached by term sequence and applicable saved colors. An incremental allocator updates candidate distances only for each newly assigned color; repeated UI reads reuse the completed sequence. This keeps query colors stable when adding a selection or hiding/showing a term and avoids repeated expensive allocation for large lists. Already saved and custom colors are never migrated. Shared color means a term, while source captions explain where it came from. Native and DOM marks retain contrast-selected pure black/white text.

| Starter | Color |
|---|---|
| Mint | `#7ee3cc` |
| Sun | `#ffd447` |
| Coral | `#ff7969` |
| Sky blue | `#6eaeff` |
| Apricot | `#ffac66` |
| Orchid | `#ec81c5` |
| Lime | `#9fdb62` |
| Lavender | `#b28aee` |

Closely related peach, second pink, second mint and cyan/blue starters were removed. The opaque palette keeps contrast-selected black/white text. Perceptual spacing reduces near-duplicates; large numbers of terms and color-vision differences still require the existing text labels/counts.

The default for new keywords, the first automatic/own highlight and the active native result use mint (`#7ee3cc`); the active result adds an underline; DOM result outlines use the shared deep teal navigation token. Position ticks and match dots always inherit their term's actual color. Function icons use `currentColor`; no separate icon palette exists.

Settings uses the existing native select pattern for theme and corner selection; platform-owned popups are intentional. Labeled native ranges control launcher size (44–80px, default 56) and edge distance (8–80px, default 20), both in 4px steps, with visible associated outputs. All four screen corners are supported, respecting device safe-area insets. Size reset changes only size. The logo follows the selected theme: a white tile (`#ffffff`) in light mode and a green-charcoal tile (`#2a3935`) in dark mode, with the same geometry and highlight colors. Launcher, panel header and selection trigger switch together in place; the fine contour keeps each variant visible against surrounding surfaces.

`applyAppearance` in `src/80-panel.js` updates existing surfaces in place; changing appearance must not discard drafts, collapse groups, move focus or invalidate page highlights. The shared local preference registry owns persistence. A failed write restores the last saved appearance and uses the semantic status region; a successful retry clears that error. Language changes recreate translated controls with the same saved appearance. Verification lives in `tests/suites/appearance.cjs`, including contrast, keyboard, narrow geometry and failure recovery.

Interface transparency is a separate native percentage slider, 0–80 in steps of 5, default 0 (opaque). `applyAppearance` maps it to the opacity of panel, selection toolbar and launcher together, including their logos and labels; it never changes page highlight painting. The localized output and accessible value text update during preview. Reset affects only transparency; failed persistence rolls back the value and all surfaces. Higher user-selected transparency deliberately blends controls with arbitrary host content; the opaque default remains the contrast baseline.

## Typography
14px/1.45 system UI for controls and content, 16px for counts and narrow-screen text fields/selects, 12–13px for supporting copy. Use tabular numerals for counts. No remote fonts. Keep wording direct and task-specific.

## Layout
320px maximum panel width, 12px viewport margins and one main panel scroll owner. The collapsed palette is capped at 560px or 80% of the visual viewport, whichever is smaller. Open tool sections and manual copying may use the viewport height minus 24px. Inner padding 10px; typical control gap 8px. Navigation groups count and scope above the primary page-selection list and status. Search options, saved keywords, match/history details, settings and help form a compact two-column disclosure grid; an open section spans the full width. Long guidance and shortcut instructions live in Help & shortcuts. Page clear/undo icons share the page-section heading; the compact passage row contains color, text with a small saved-state label, count, bookmark and removal. Icon actions retain descriptive accessible labels, pressed state and tooltips. The primary action is a compact floating symbol at the text selection; it expands on hover or click into “Highlight all occurrences” and explicit “Search the web”. The page-selection list remains the primary panel surface. Disclosure groups can grow naturally inside the main scroller; the capped match list owns its bounded overflow. visualViewport resize/scroll adjusts geometry for available screen space.

The initial panel anchor is right-center with a 20px edge inset where space permits. Automatic placement remains an anchor rather than stored fixed coordinates, so resizing or expanding tools keeps the panel centered and within the viewport. Dragging or header arrow keys persist explicit coordinates; Reset and Home restore the automatic anchor.

## Elevation & Depth
One soft panel shadow (0 10px 32px, black at 40% for dark or slate at 18% for light); surface tones identify header and controls. Avoid repeated nested-card shadows. Panel has no backdrop and never traps page focus.

## Shapes
6px field/button radii, 10px panel radius, Launcher radius proportional to its size (29%, about 16px at the 56px default). Colored marks and swatches use compact corners, not pill-shaped tags.

## Components

### Foundational visual states
Shared hover/active colors, visible teal/mint keyboard focus, disabled arrows without matches, associated coral inline errors and muted empty instructions. Live regions announce counter/status/error changes. Native details summaries expose expanded/collapsed state; no fabricated modal state. No skeletons are needed.

### Buttons and actions
Add is the high-emphasis teal action in Light and mint action in Dark. Other actions use neutral surfaces. Desktop buttons are at least 36px tall; narrow buttons at least 44px tall, icon widths 40px. Delete is explicitly named for its term and offers undo rather than routine confirmation. Trigger and action geometry stays stable.

### Navigation and data display
Compact visible current/total count has a localized accessible label. Contextual match buttons use one roving tab stop with ArrowUp/Down/Home/End. All marks remain available with Alt+Left/Right, even beyond the 300-item rendered list limit. Underlying browser controls remain usable.

### Forms and overlays
Labeled add form submits with click or Enter except during IME composition. Invalid/duplicate terms never overwrite stored valid values. Inline messages reference invalid fields. New-term values, active edit drafts, expanded groups and focus/scroll survive language changes. Search clears immediately and returns focus. Select popups intentionally remain OS/browser-owned. The floating palette is a named nonmodal region; Escape closes it and restores launcher focus. A separate scoped selection toolbar preserves a text/range snapshot through pointer and keyboard activation. Escape and explicit web activation restore focus. Native context menus and double-click selection remain untouched.

### UI data and explicit edits
The panel and selection toolbar live in a closed shadow root in the manager’s isolated world. Closed roots reduce DOM/CSS interference but are not a confidentiality boundary. Render only saved keywords applicable to the current domain; keep full search-history labels in manager-owned menus. Applicable global terms remain observable by the host page. Existing keyword text/color edits require Save or Enter, with a named save action distinct from Delete; blur never persists a draft. Export actions use manager downloads without document links.

### Iconography
Authored 24-unit line SVGs with 1.8 stroke and rounded ends, rendered at 18px in the panel and 20px beside selection-action labels. Icons never shrink beside wrapping text. SVGs are decorative; every icon button has a localized accessible name.

Canonical brand assets: `assets/icon.svg` and `assets/icon-dark.svg` (128-unit theme-specific tiles; ink `#343b3a`, sun `#ffd447`, mint `#7ee3cc`, coral `#ff7969`, theme-specific tile/contour/rail roles from `src/colors.json`), `assets/icons/highlight-all.svg` (repeated marks and occurrence rail) and `assets/icons/search-web.svg` (globe and magnifier). The deterministic build embeds the complete logos in `LOGOS`. The selection trigger shows the logo at 40px without an additional button border/background, with a soft shadow and visible focus/hover/active feedback. Its menu uses a 10px radius, the shared page-background token and the surface token for its primary action. Narrow targets remain at least 44px tall and wide. Launcher and header use the same complete theme-specific logo. Source code never maintains a second SVG/base64 copy. Action SVGs inherit the active theme text color and retain visible localized labels.

`applyAppearance` updates all existing logo images from the same theme asset. There is no separate symbol-style control or active symbol-style preference; an old stored choice cannot restore the removed button appearance. The selection snapshot and highlight data remain independent of appearance.

### Motion
Only short color transitions on controls; reduced motion removes them and uses instant match scrolling. Navigation feedback retains the visible active state. No entrance choreography.

### Content and data visualization
German/English plain verbs, contextual snippets for repeated matches, useful regex example, specific recovery advice. Colors reinforce term labels and counts rather than carrying sole meaning. Position ticks are a compact pointer shortcut with equivalent keyboard navigation.

## Do's and Don'ts
- Do keep add, navigation and recovery visible and keyboard-accessible.
- Do scope reset/tokens to owned UI; leave host forms and text intact.
- Don't introduce a modal focus trap, external font or framework for this palette.
- Don't save invalid input or discard drafts when switching languages.

## Selection-first contract

The toolbar shares --hl-* tokens with the panel; its root and descendants use their own scoped reset, with SVG excluded and zero-specificity :where(). No selected text is inserted as HTML. Native CSS highlight names slim-page/slim-page-current paint DOM Ranges without wrapping page markup. The runtime normalizes whitespace/line breaks while retaining raw node endpoints. Page terms are literal and case-insensitive. They remain temporary unless explicitly saved for the current URL; global keywords and shortcut preferences are stored separately.

“Alle Vorkommen markieren” / “Highlight all occurrences” is the combined same-page action. A full tooltip explains the current-page scope. Web search is an explicit second action and never runs on selection, right-click or shortcut alone. Alt+Shift+H is configurable and can be disabled. Recording requires Alt/Ctrl/Meta plus a letter/digit, with optional Shift; IME, repeats and editable targets are protected.

Hover titles on the selection symbol and mark action display the current marking shortcut. `renderShortcut` also owns `aria-keyshortcuts` and refreshes hints after recording, disabling, reset and locale recreation. Alt+Shift+P toggles the panel from the page or private UI; the launcher tooltip displays it. A pre-existing or newly recorded marking assignment of Alt+Shift+P takes priority, removes the conflicting panel hint and is explained in Help. `handlePanelShortcut` is shared by document and private-root keyboard paths and rejects untrusted events, editing, IME, repeat, recording mode and excluded domains.

The counter, arrows, match details and position bar combine page passages with saved and automatic keyword results in document order. The scope label is “All matches”; adding a selection never hides earlier Google results. Identical text ranges count once, using the native passage as the navigation target; different search words inside a longer highlighted passage remain reachable. The saved-keyword painting path retains its optimized DOM engine. Relevant text/visibility changes rebuild native ranges. Once a page context needs URL tracking, the lightweight identity check stays active through intermediate empty routes without patching host History methods. URL changes reset temporary page state. Unsupported CSS Highlight browsers show a clear disabled-action reason.

## Page tools and maintainable sources (4.3.0)

The canonical runtime styles are in src/10-styles.js; the deterministic assembler owns the shipped userscript. Ordered private-scope source responsibilities are documented in docs/architecture.md. No runtime code-loader or new dependency is introduced.

The page overview groups transferred search terms and own passages by normalized text. Search rows use a passive color swatch, active count and Search caption. Own passages retain a labeled color input and explicit save/forget/remove actions; captions identify Selection or Saved selection. Shared rows expose both sources once, use the manual swatch, and keep manual missing-state detection separate from the combined active count. Permanent-only keywords stay in their editor and no source is implicitly persisted. Color, remove, clear and option changes can be undone (20 states). Clear explicitly names own selections. Saving is never inferred from highlighting. “Remember for this page” persists only that URL; missing exact text is labeled, and failures retain the previous state. Per-passage native highlight groups use contrast-selected foregrounds.

Each overview row has a native eye toggle with a constant localized accessible name and `aria-pressed=true` when visible; changing tooltips name Hide/Show. Hidden rows remain operable with a crossed-eye icon, struck-through text, Hidden caption and zero active matches. Focus follows the row key through rendering. The 32px-wide desktop eye retains a 36px minimum height; narrow targets are 44px wide/high. Rows use 4px gaps and non-shrinking actions. Count and term share the first label line; the source/saved caption gets its full width below, keeping a typical saved passage compact across system fonts without reducing text size. Hidden state is a memory-only per-URL Set shared by both engines, separate from undo/save/export. Reselecting reveals a term; reload/URL changes reset it. Different longer passages remain independently visible.

New page passages use the shared eight-color palette in `src/colors.json`; `nextPageHighlightColor` in `src/30-page-state.js` passes occupied passage and applicable keyword colors to the common `chooseHighlightColor` owner in `src/20-utils.js`. Beyond the starters it chooses a related color with the largest minimum perceptual distance, retaining a unique RGB extension when family tones are occupied. Existing, saved and manually chosen colors are stable; every occurrence of a passage shares its assigned color. Text labels/counts and black/white contrast-selected foregrounds keep color from being the only identifying cue.

Page search options are a disclosure with a labeled native scope select and whole-word checkbox. Missing article scope gets an inline explanation; searches are never silently broadened. Search progress uses aria-busy and a stable status area, with navigation disabled until commit.

The compact selection trigger expands into a separate menu below or above the symbol, without a reserved logo column. One shared surface contains quiet action rows; the same-page highlight action uses semibold text and the existing field surface. A divider separates the secondary “Copy” disclosure, containing “Copy quote with source” and text-fragment copying. The precise “Highlight all occurrences” label stays unchanged. Desktop action rows are at least 36px high; narrow/touch targets retain at least 44px height and 14px text. Only the action surface scrolls when height is constrained. Opening the disclosure recalculates viewport placement.

Web search is a single full-width labeled button with native semantics, hover/focus states and a localized new-tab tooltip. It uses the validated selection snapshot and configured search engine, with `noopener,noreferrer`. The reading tab and its temporary highlights stay open.

`showLocalFeedback` in `src/50-page-ui-sharing.js` owns short local feedback: a private, pointer-transparent, non-focusable `role=status` surface near the selection menu or launcher for six seconds. Copy success and panel-state persistence failure share this provider. It shares theme/transparency tokens and translated status keys through `applyAppearance`; it contains no copied passage text. Copy success preserves the main panel state and page focus; completing an earlier clipboard request must not dismiss a newer selection. Keyboard activation returns focus to the original page element. Clipboard denial opens the existing labeled readonly textarea for manual copy. The quote format is a native select in Settings. Markdown/JSON exports remain explicit local downloads in Settings, outside the selection menu.

Toolbar buttons and summaries join the narrow-screen 44px height rule. Rendering/copying never treats selected text as HTML. Root positioning, no modal trap, native right-click and exact-passage default remain unchanged.

## Search toolbar and site capture (4.8.0)

The finder is an independent, nonmodal top-center bar up to 480px wide with 12px viewport margins. It uses the same `--hl-*` theme, native fields, 6px controls, 10px surface radius and transparency as the panel. Input/clear, a fixed counter, previous/next and close form the first row; whole-word/case options and adoption form the second. Narrow controls retain 44px height, labels stay localized, and the panel reserves vertical space if its horizontal span overlaps the finder. A native magnifier in the panel header is distinct from the web-search globe. The first new query match is revealed; dynamic refresh does not continually jump the reader.

Preview gets a free shared-palette color, stable while typing. Its underline identifies the active match, and its counter/navigation remain independent of saved/manual sources. Escape closes only the preview and restores the original focus; language changes retain query/options and remap owned focus targets. No preview history is saved. Adoption uses existing page-selection search options, which can differ from preview options; the tooltip/Help explain this boundary.

Site-search opt-in follows the settings checkbox pattern, with a concise current-site label and associated explanation. Source captions distinguish Website search, Search and Selection, grouping shared terms once. Only the current site's enabled state appears; the complete origin registry stays in manager data. Unsupported browser highlighting produces a localized disabled-query reason.

## Clear White light scheme (4.8.1)

The selected light variant removes the cream cast across every owned surface: pure white panel/field/logo and on-accent foreground, neutral gray `#f3f5f6` controls, `#dce3e4` dividers, `#e7edee` hover and `#d9e3e5` pressed feedback. Mint/teal, all eight highlight colors and the dark scheme retain their roles. The values are authored only in `src/colors.json`; CSS and tagged logo attributes derive from that owner.
