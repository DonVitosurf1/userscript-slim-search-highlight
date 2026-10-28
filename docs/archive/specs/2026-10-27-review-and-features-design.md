# Review corrections, page features and project structure

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

The user explicitly authorized all corrections, optimizations and four useful extension groups from `docs/archive/reviews/code-review-report.md`, plus documentation and project structure. This is the approved brief; retain the existing selection-first workflow and all prior uncommitted work.

## Product contract
- Fix ST1/ST2/SP1–SP3/PF1: localized status state, >=44px narrow toolbar targets, rendered-text equivalence (hidden inline/inline-block), external edits inside owned spans, stale selection dismissal and linear offset lookup.
- Page terms become records with stable identity, text, color, saved flag and exact-quote/context anchor. Native CSS highlights remain non-destructive. Undo supports page changes/removals/clear, bounded to the latest 20 states.
- Explicit “Remember for this page” only: local GM storage keyed by complete page URL (including query and fragment), separate from permanent keywords. Restore exact text/context records on revisit; show absent-text status rather than fuzzy or misleading placement. Removing/forgetting saved marks is reversible within the current page session. Refresh is temporary unless saved deliberately. Merge storage for the current URL with latest bindings before writes, preserving other URLs.
- Copy selected quote+URL in plain text or Markdown; copy a text-fragment link when browser support exists, otherwise a plain page link with explanation. Export current page as Markdown and saved page records as versioned JSON via explicit local downloads. Clipboard failure exposes a selectable manual-copy field; no network or browser alert.
- Search options for whole words and article-only are explicit, local to page context. Default remains full literal passage/all page. Article mode uses article/main/[role=main]; missing scope is explained, never silently broadened.
- Selection toolbar remains small until expanded; share actions are secondary. Page list has color, save/forget, remove and undo. Native right-click remains untouched, web search explicit, configurable shortcut retained.
- Optimize normalized node mapping with a weak cache and O(1) raw endpoint lookups, count map, cancelable time-sliced large scans and bounded position ticks. Every actual occurrence remains searchable/navigable.

## Structure decision
Use ordered dependency-free source sections under src/, a deterministic Node assembler under scripts/, and ONE generated installable file at the existing userscript URL. Existing single lexical scope is retained internally and its ordering documented; no pretend module isolation or new framework. Tests split into fixtures and named suites, retaining tests/run_tests.js entry. Track the existing integrity-bearing lockfile and use npm ci. Build --check detects stale generated artifacts; no changes to the installation URL.

README German/English remain concise entry points. docs/ holds usage, development and architecture references. Prior review/evidence/plans remain available; do not delete or rewrite historical reports.

## Validation
Failing tests first for confirmed defects and every feature group. Existing 85 tests must remain green; add long-node performance and cancellation checks. Verify deterministic build/check, frozen install, full suite, desktop/narrow UI, clipboard failure, restore/forget/undo, serialization and explicit-only transmission. Independent review before completion. No push, merge or publication.
