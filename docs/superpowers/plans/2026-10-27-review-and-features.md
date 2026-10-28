# Review Corrections and Page Features Implementation Plan

> Execute inline with Superpowers TDD and final independent review.

**Goal:** Implement the approved review corrections, page features and project organization.
**Spec:** docs/superpowers/specs/2026-10-27-review-and-features-design.md
**Stack:** Existing vanilla JS/CSS userscript, Node deterministic assembler, Playwright.

## Constraints / review focus
Preserve existing user files and uncommitted work. No new runtime dependency, server, worktree or automatic sharing. One installed artifact, separate maintainable sources. Explicit save only; current URL keys and other saved URLs must survive updates. Exact passage remains default.

### Task 1 — Review regressions and fast, correct ranges
- [x] Add failing tests for hidden inline/inline-block, host edits, stale focused tools, locale/mobile rules and long-node performance.
- [x] Fix source/index mapping and mutation ownership; localize semantic status; validate snapshots before every action; add bounded navigation ticks and cancelable long indexing.
- [x] Run focused regression suite to green.

### Task 2 — Page term model and extensions
- [x] Add failing tests for colors, undo, explicit save/restore/forget/absent text, quote/Markdown/link clipboard and fallback, local export, article/whole-word modes.
- [x] Implement page records, grouped CSS paint, storage/undo, share/export and search options using existing controls/tokens.
- [x] Run feature suite and prior selection tests.

### Task 3 — Project organization and documentation
- [x] Split deterministic source sections, add assembler/check, retain single generated userscript and stable test entrypoint; extract fixtures/suites.
- [x] Track lockfile, verify npm ci, add check/build/test scripts and CI checks.
- [x] Rewrite entry docs and add usage/development/architecture guides; update DESIGN and changelog/version.
- [x] Full verification, performance comparison, browser screenshots and independent review; resolve material findings with regression tests.
