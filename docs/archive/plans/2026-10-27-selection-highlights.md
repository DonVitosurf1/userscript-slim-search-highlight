# Selection Highlights Implementation Plan

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

> Execute inline using superpowers:executing-plans and test-driven-development, then independent code review.

**Goal:** Implement the approved selection-toolbar workflow, always finding all same-page occurrences.
**Architecture:** CSS Custom Highlights/Ranges for ephemeral selections, existing DOM engine for persistent keywords, shared result/navigation adapters.
**Tech stack:** Vanilla JS/CSS, Playwright.
**Spec:** docs/archive/specs/2026-10-27-selection-highlights-design.md

## Constraints / review focus
- Preserve all current workspace changes and existing 63 regressions; no dependencies or worktree.
- Literal matching across markup, whitespace, one-character selections, overlapping phrases and hidden/editable content.
- Snapshot survives toolbar focus; right-click never intercepted; no implicit web transmission.
- Custom shortcuts respect modifiers, IME, repeat, input fields, disabled/excluded state; page state never enters GM storage.
- Dynamic content, disabling, locale changes, URL changes and reload leave no stale ranges/UI.

### Task 1: Regression harness
- [x] Add tests/selection_tests.js integrated into existing runner. Keep legacy keyword tests explicitly expanded; assert default permanent section collapsed in new tests.
- [x] Observe failures for selection shortcut/toolbar, literal ranges, state isolation, web action and dynamic results.

### Task 2: Matching and primary UI
- [x] Add transient page terms/ranges and normalized text index; use native ranges to bridge text nodes.
- [x] Adapt navigation, position bar, title and result context to the current result set; preserve fast legacy path when no page terms exist.
- [x] Add scoped selection symbol/actions and primary page-selection list; separate permanent keywords into a disclosure.
- [x] Run focused tests to green.

### Task 3: Shortcut/preferences and lifecycle
- [x] Add persisted configurable shortcut with record/reset/disable controls; remove Alt+H saving and automatic right-click lookup.
- [x] Cover URL/reload, mutations, disabled/excluded, hidden content, locale and overlapping passages.
- [x] Update README, changelog, DESIGN.md; capture desktop/narrow selection-toolbar screenshots.
- [x] Run full tests/syntax/diff checks and independent review; resolve confirmed findings with regressions.
