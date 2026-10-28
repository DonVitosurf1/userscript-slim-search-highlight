# Panel Improvements Implementation Plan

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

> **For agentic workers:** Use superpowers:executing-plans, task by task, with RED→GREEN and a final independent review.

**Goal:** Implement R1–R10 from the reviewed and user-approved improvement report.
**Architecture:** Keep the single-file userscript and GM storage contract. Introduce scoped UI tokens/helpers and semantic controls, preserving the incremental engine.
**Tech Stack:** Vanilla JavaScript/CSS, Playwright/Chromium.
**Spec:** docs/archive/specs/2026-10-27-panel-improvements-design.md

## Global constraints
- No runtime dependencies or new services; keep German and English.
- Preserve existing settings, 300-match limit and performance thresholds.
- Work in the current isolated cloud checkout, not a new worktree.
- User already requested complete execution of the reviewed recommendations; proceed inline without repeated design approval.

## Review focus
- Offscreen/malformed saved positions and resize: geometry tests in Task 1.
- IME composition and invalid/duplicate edits: behavior tests in Task 2.
- Language rebuild after editing, undo and disclosures: state tests in Task 3.
- Host CSS and contrast for dark/mid/light colors: computed-style tests in Task 1.
- DOM updates during keyboard use and deactivation: focus/state tests in Task 3.

### Task 1: Reachable, readable panel (R1/R4/R8/R10)
Files: userscript/slim-search-highlight.user.js, tests/panel_tests.js, DESIGN.md.
Interfaces: clampPanelPosition(panel, persist=false), highlightTextColor(color), scoped --hl-* CSS tokens.
- [x] Add failing geometry, host-CSS and contrast browser tests, and observe expected failures.
- [x] Implement viewport sizing/clamping, pointer drag, keyboard positioning/reset, local reset/tokens and contrast selection.
- [x] Run focused tests to green.

### Task 2: Accessible primary flow (R2/R3/R5/R6/R9)
Files: userscript/slim-search-highlight.user.js, tests/panel_tests.js, tests/run_tests.js.
Interfaces: setPanelOpen(open, focus=true), keywordError(text,index), submitKeyword(), removeKeyword(index), renderMatchList().
- [x] Add failing label/focus, contextual list navigation, submit/validation/IME, primary-action visibility and reduced-motion tests.
- [x] Implement labeled add form, disclosures, inline errors, native named buttons, roving match focus, status/live region and reduced-motion behavior.
- [x] Exercise settings disclosures explicitly in existing tests; preserve assertions on existing behavior.
- [x] Run focused tests to green.

### Task 3: State resilience and completion (R7 and follow-through)
Files: userscript/slim-search-highlight.user.js, tests/panel_tests.js, README.md, README.en.md, CHANGELOG.md, docs/archive/reviews/implementation-report.md.
Interfaces: language-change transient snapshot, undo state, stable keyword count updates.
- [x] Add failing locale draft/focus, search clear, undo and disabled-state tests.
- [x] Preserve transient state, provide undo and clear-search, update version and user documentation.
- [x] Run full suite and syntax check; capture desktop/narrow/empty/error screenshots and inspect.
- [x] Independent review, fix confirmed issues with regression tests; record limitations and final verification.

No commit/push/publish is required for the user's reviewable workspace result.
