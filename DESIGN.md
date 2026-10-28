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
  panel-padding: '14px'
components:
  button:
    minHeight: '36px'
  input:
    minHeight: '38px'
  panel:
    maxWidth: '360px'
---

# Slim Search Highlight Design System

## Overview

### Creative North Star
A text-marker case beside the page: dark neutral tools, yellow navigation emphasis, colored swatches tied to real terms. Preserve the existing recognizable palette and concentrate the primary workflow at the top.

### Product context and register
- Audience/job: people reading and researching across webpages; add terms and move between occurrences.
- Evidence: README, .design/review-report.md, existing script and browser tests. No specific geographic market or user-research claims.
- Locales: German and English, auto follows browser language with English fallback. All owned labels, errors and accessible names use the active locale.
- Register: product utility; a nonmodal floating panel with underlying webpage remaining interactive.
- Signature: keyword colors link saved terms, in-page marks and the position bar.
- Restraint: system fonts, familiar native fields/selects; no marketing layout, external fonts, gradients or runtime framework.
- Token ownership/runtime mapping: runtime source of truth is the GM_addStyle block in src/10-styles.js (assembled into userscript/slim-search-highlight.user.js). This file mirrors the --hl-* variables; update both for durable palette changes. No generated adapter or build step.

## Colors
Runtime --hl-bg, --hl-surface, --hl-field, --hl-text, --hl-muted, --hl-border, --hl-accent and --hl-danger map to the correspondingly named frontmatter colors (accent = primary). Use accent for the add button, focus and navigation state. All custom highlight backgrounds get automatically selected black or white text using sRGB relative luminance. The panel remains dark on light or dark hosts; forced-colors restores system scrollbar colors and visible outlines.

## Typography
14px/1.45 system UI for controls and content, 16px for counts and narrow-screen text fields/selects, 12–13px for supporting copy. Use tabular numerals for counts. No remote fonts. Keep wording direct and task-specific.

## Layout
360px maximum panel width, 12px viewport margins, viewport-bounded height and one main panel scroll owner. Inner padding 14px, 12px below 480px; typical control gap 8px. Header and status precede the primary page-selection list and instructions. Saved keyword creation/management lives in its own disclosure, followed by optional match/history details and settings. The primary action is a compact floating symbol at the text selection; it expands on hover or click into “Highlight all occurrences” and explicit “Search the web”. The page-selection list remains the primary panel surface. Disclosure groups can grow naturally inside the main scroller; the capped match list owns its bounded overflow. visualViewport resize/scroll adjusts geometry for available screen space.

## Elevation & Depth
One soft panel shadow (0 10px 32px, black at 40%); surface tones identify header and controls. Avoid repeated nested-card shadows. Panel has no backdrop and never traps page focus.

## Shapes
6px field/button radii, 10px panel radius, 14px launcher radius. Colored marks and swatches use compact corners, not pill-shaped tags.

## Components

### Foundational visual states
Shared hover/active colors, visible yellow keyboard focus, disabled arrows without matches, associated coral inline errors and muted empty instructions. Live regions announce counter/status/error changes. Native details summaries expose expanded/collapsed state; no fabricated modal state. No skeletons are needed.

### Buttons and actions
Add is the high-emphasis yellow action. Other actions use neutral surfaces. Desktop buttons are at least 36px tall; narrow buttons at least 44px tall, icon widths 40px. Delete is explicitly named for its term and offers undo rather than routine confirmation. Trigger and action geometry stays stable.

### Navigation and data display
Compact visible current/total count has a localized accessible label. Contextual match buttons use one roving tab stop with ArrowUp/Down/Home/End. All marks remain available with Alt+Left/Right, even beyond the 300-item rendered list limit. Underlying browser controls remain usable.

### Forms and overlays
Labeled add form submits with click or Enter except during IME composition. Invalid/duplicate terms never overwrite stored valid values. Inline messages reference invalid fields. New-term values, active edit drafts, expanded groups and focus/scroll survive language changes. Search clears immediately and returns focus. Select popups intentionally remain OS/browser-owned. The floating palette is a named nonmodal region; Escape closes it and restores launcher focus. A separate scoped selection toolbar preserves a text/range snapshot through pointer and keyboard activation. Escape and explicit web activation restore focus. Native context menus and double-click selection remain untouched.

### Iconography
Authored 24-unit line SVGs, 18px rendered, 1.8 stroke. SVGs are decorative; every icon button has a localized accessible name. Existing embedded logo remains.

### Motion
Only short color transitions on controls; reduced motion removes them and uses instant match scrolling. Navigation feedback retains the visible active state. No entrance choreography.

### Content and data visualization
German/English plain verbs, contextual snippets for repeated matches, useful regex example, specific recovery advice. Colors reinforce term labels and counts rather than carrying sole meaning. Position ticks are a compact pointer shortcut with equivalent keyboard navigation.

## Do's and Don'ts
- Do keep add, navigation and recovery visible and keyboard-accessible.
- Do scope reset/tokens to owned UI; leave host forms and text intact.
- Don't introduce a modal focus trap, external font or framework for this palette.
- Don't save invalid input or discard drafts when switching languages.

## Selection-first contract (4.2.0)

The toolbar shares --hl-* tokens with the panel; its root and descendants use their own scoped reset, with SVG excluded and zero-specificity :where(). No selected text is inserted as HTML. Native CSS highlight names slim-page/slim-page-current paint ephemeral DOM Ranges without wrapping page markup. The runtime normalizes whitespace/line breaks while retaining raw node endpoints. Page terms are literal, case-insensitive and not stored in GM values; only the shortcut preference is persisted.

“Alle Vorkommen markieren” / “Highlight all occurrences” is the combined same-page action. A full tooltip explains the current-page scope. Web search is an explicit second action and never runs on selection, right-click or shortcut alone. Alt+Shift+H is configurable and can be disabled. Recording requires Alt/Ctrl/Meta plus a letter/digit, with optional Shift; IME, repeats and editable targets are protected.

Page results take navigation priority while any page terms exist. The saved-keyword path remains the previous optimized DOM engine. Relevant text/visibility changes rebuild native ranges; URL changes clear page state, with a URL identity timer active while page terms or known saved page records exist (no host History API patch). Unsupported CSS Highlight browsers show a clear disabled-action reason.

## Page tools and maintainable sources (4.3.0)

The canonical runtime styles are in src/10-styles.js; the deterministic assembler owns the shipped userscript. Ordered private-scope source responsibilities are documented in docs/architecture.md. No runtime code-loader or new dependency is introduced.

Page rows expose a labeled color input, passage/count, explicit save/forget state and remove action. Color, remove, clear and option changes can be undone (20 states). Saving is never inferred from highlighting. “Remember for this page” persists only that URL; missing exact text is labeled, and failures retain the previous state. Per-passage native highlight groups use contrast-selected foregrounds.

Page search options are a disclosure with a labeled native scope select and whole-word checkbox. Missing article scope gets an inline explanation; searches are never silently broadened. Search progress uses aria-busy and a stable status area, with navigation disabled until commit.

The compact selection trigger still expands into the two primary actions; a secondary “Copy / export” disclosure contains quote/URL and text-fragment copying. Successful copy confirms in the panel; clipboard denial opens a labeled readonly textarea for manual copy. The quote format is a native select in Settings. Markdown/JSON exports are explicit local downloads. Shared semantic status keys are translated when rendered, including after locale change.

Toolbar buttons and summaries join the narrow-screen 44px height rule. Rendering/copying never treats selected text as HTML. Root positioning, no modal trap, native right-click and exact-passage default remain unchanged.
