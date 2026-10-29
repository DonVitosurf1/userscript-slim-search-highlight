---
version: alpha
name: Slim Search Highlight
description: A compact floating highlighter palette for reading and researching on arbitrary webpages.
colors:
  primary: '#ffca28'
  background: '#1a1a1a'
  surface: '#242424'
  field: '#222222'
  text: '#f0f0f0'
  muted: '#b5b5b5'
  border: '#666666'
  danger: '#ff918e'
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
A marked page beside the page: a white paper identity, dark ink lines and vivid yellow/cyan/pink highlights with a narrow occurrence rail. Keep surrounding tools quiet and concentrate the selection workflow at the top. The same mark links the logo, launcher, panel header and selection trigger; functional icons describe the action rather than replacing its label. The [German design guideline](README.md) explains the identity and usage rules.

### Product context and register
- Audience/job: people reading and researching across webpages; add terms and move between occurrences.
- Evidence: README, current usage guides, canonical SVG assets, existing script and browser tests. No specific geographic market or user-research claims.
- Locales: German and English, auto follows browser language with English fallback. All owned labels, errors and accessible names use the active locale.
- Register: product utility; a nonmodal floating panel with underlying webpage remaining interactive.
- Signature: keyword colors link saved terms, in-page marks and the position bar.
- Restraint: system fonts, familiar native fields/selects; no marketing layout, external fonts, gradients or runtime framework.
- Token ownership/runtime mapping: runtime source of truth is UI_CSS in src/10-styles.js, applied to the document and mirrored into the private UI root by src/25-private-ui.js (assembled into userscript/slim-search-highlight.user.js). This file mirrors the --hl-* variables; update both for durable palette changes. The deterministic assembler copies the styles; no separate token adapter is involved.

## Colors
Runtime --hl-bg, --hl-surface, --hl-field, --hl-text, --hl-muted, --hl-border, --hl-accent and --hl-danger map to the correspondingly named frontmatter colors (accent = primary). Use accent for the add button, focus and navigation state. All custom highlight backgrounds get automatically selected black or white text using sRGB relative luminance. The selected panel scheme is independent of the host webpage; forced-colors restores system scrollbar colors and visible outlines.

## Appearance tokens and launcher (4.4.0)

Runtime token ownership remains **Model B**: `src/10-styles.js` is canonical; this document mirrors the accepted values and explains their roles. The deterministic build copies these values into the installable userscript. The existing dark scheme remains the default. Light is an additional user-selected scheme, not inferred from or applied to the host webpage.

| Token | Dark | Light | Consumers |
|---|---|---|---|
| `--hl-bg` | `#1a1a1a` | `#ffffff` | Panel |
| `--hl-surface` | `#242424` | `#f1f4f7` | Header, buttons, selection toolbar |
| `--hl-field` | `#222222` | `#ffffff` | Inputs, selects, scrollbar track |
| `--hl-text` | `#f0f0f0` | `#1e2933` | Owned text and icon strokes |
| `--hl-muted` | `#b5b5b5` | `#52606d` | Hints, counts, placeholders |
| `--hl-border` | `#666666` | `#778391` | Form/button boundaries |
| `--hl-accent` | `#ffca28` | `#ffca28` | Primary action/selection background |
| `--hl-accent-text`, `--hl-focus` | `#ffca28` | `#805500` | Counter, focus and active-result border |
| `--hl-danger` | `#ff918e` | `#b42318` | Inline errors and destructive hover |
| `--hl-hover`, `--hl-active` | `#343434`, `#484848` | `#e5eaf0`, `#d7dfe8` | Button feedback |
| `--hl-divider` | `#444444` | `#d9dee3` | Panel boundary and section dividers |
| `--hl-scroll-thumb`, `--hl-scroll-hover` | `#777777`, `#aaaaaa` | `#7a8694`, `#5b6673` | Owned scrollbars |
| `--hl-shadow` | `rgba(0,0,0,.4)` | `rgba(20,35,50,.18)` | Panel, toolbar and launcher shadows |
| `--hl-scheme` | `dark` | `light` | Native control color-scheme |

The same `data-theme` variant owns panel, selection toolbar and launcher tokens. Yellow remains the highlighter signature; amber text/focus in the light scheme provides contrast rather than reusing pale yellow as text. No second per-component palette is introduced.

Settings uses the existing native select pattern for theme and corner selection; platform-owned popups are intentional. Labeled native ranges control launcher size (44–80px, default 56) and edge distance (8–80px, default 20), both in 4px steps, with visible associated outputs. All four screen corners are supported, respecting device safe-area insets. Size reset changes only size. The logo follows the selected theme: a white tile in light mode and a #242424 tile in dark mode, with the same geometry and highlight colors. Launcher, panel header and selection trigger switch together in place; the fine contour keeps each variant visible against surrounding surfaces.

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
Shared hover/active colors, visible yellow keyboard focus, disabled arrows without matches, associated coral inline errors and muted empty instructions. Live regions announce counter/status/error changes. Native details summaries expose expanded/collapsed state; no fabricated modal state. No skeletons are needed.

### Buttons and actions
Add is the high-emphasis yellow action. Other actions use neutral surfaces. Desktop buttons are at least 36px tall; narrow buttons at least 44px tall, icon widths 40px. Delete is explicitly named for its term and offers undo rather than routine confirmation. Trigger and action geometry stays stable.

### Navigation and data display
Compact visible current/total count has a localized accessible label. Contextual match buttons use one roving tab stop with ArrowUp/Down/Home/End. All marks remain available with Alt+Left/Right, even beyond the 300-item rendered list limit. Underlying browser controls remain usable.

### Forms and overlays
Labeled add form submits with click or Enter except during IME composition. Invalid/duplicate terms never overwrite stored valid values. Inline messages reference invalid fields. New-term values, active edit drafts, expanded groups and focus/scroll survive language changes. Search clears immediately and returns focus. Select popups intentionally remain OS/browser-owned. The floating palette is a named nonmodal region; Escape closes it and restores launcher focus. A separate scoped selection toolbar preserves a text/range snapshot through pointer and keyboard activation. Escape and explicit web activation restore focus. Native context menus and double-click selection remain untouched.

### UI data and explicit edits
The panel and selection toolbar live in a closed shadow root in the manager’s isolated world. Closed roots reduce DOM/CSS interference but are not a confidentiality boundary. Render only saved keywords applicable to the current domain; keep full search-history labels in manager-owned menus. Applicable global terms remain observable by the host page. Existing keyword text/color edits require Save or Enter, with a named save action distinct from Delete; blur never persists a draft. Export actions use manager downloads without document links.

### Iconography
Authored 24-unit line SVGs with 1.8 stroke and rounded ends, rendered at 18px in the panel and 20px beside selection-action labels. Icons never shrink beside wrapping text. SVGs are decorative; every icon button has a localized accessible name.

Canonical brand assets: `assets/icon.svg` and `assets/icon-dark.svg` (128-unit theme-specific tiles, ink `#253540`, yellow `#ffdf00`, cyan `#00e5ff`, pink `#ff80ab`, contour `#d9e2e7`), `assets/icons/highlight-all.svg` (repeated marks and occurrence rail) and `assets/icons/search-web.svg` (globe and magnifier). The deterministic build embeds both logo variants in `LOGOS` and the manifest-listed action SVGs; source code never maintains a second base64 copy. The selection trigger uses the logo at 26px; launcher and header use the same theme-specific embedded image. Action SVGs inherit the active theme's text color and keep their visible localized labels.

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

Page results take navigation priority while any page terms exist. The saved-keyword path remains the previous optimized DOM engine. Relevant text/visibility changes rebuild native ranges; URL changes clear page state, with a URL identity timer active while page terms or known saved page records exist (no host History API patch). Unsupported CSS Highlight browsers show a clear disabled-action reason.

## Page tools and maintainable sources (4.3.0)

The canonical runtime styles are in src/10-styles.js; the deterministic assembler owns the shipped userscript. Ordered private-scope source responsibilities are documented in docs/architecture.md. No runtime code-loader or new dependency is introduced.

Page rows expose a labeled color input, passage/count, explicit save/forget bookmark state and remove action in one row; the saved-state caption sits beneath the passage text. Color, remove, clear and option changes can be undone (20 states). Saving is never inferred from highlighting. “Remember for this page” persists only that URL; missing exact text is labeled, and failures retain the previous state. Per-passage native highlight groups use contrast-selected foregrounds.

New page passages use the vivid `PAGE_HIGHLIGHT_COLORS` palette in `src/00-state-i18n.js`; `nextPageHighlightColor` in `src/30-page-state.js` skips colors occupied by current passages or applicable keywords. After the initial palette it allocates unused bright, saturated RGB colors. Existing, saved and manually chosen colors are stable; every occurrence of a passage shares its assigned color. Text labels/counts and black/white contrast-selected foregrounds keep color from being the only identifying cue.

Page search options are a disclosure with a labeled native scope select and whole-word checkbox. Missing article scope gets an inline explanation; searches are never silently broadened. Search progress uses aria-busy and a stable status area, with navigation disabled until commit.

The compact selection trigger still expands into the two primary actions; a secondary “Copy / export” disclosure contains quote/URL and text-fragment copying. Successful copy confirms in the panel; clipboard denial opens a labeled readonly textarea for manual copy. The quote format is a native select in Settings. Markdown/JSON exports are explicit local downloads. Shared semantic status keys are translated when rendered, including after locale change.

Toolbar buttons and summaries join the narrow-screen 44px height rule. Rendering/copying never treats selected text as HTML. Root positioning, no modal trap, native right-click and exact-passage default remain unchanged.
