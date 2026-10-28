# Execution ledger — plan: docs/archive/plans/2026-10-27-review-and-features.md

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

Authorization: user requested all recommendations and extensions plus docs/project structure; prior review is concrete approved input.
Ruling: keep a single installed userscript but generate it from ordered source sections, no dependencies. Existing lexical scope is documented rather than pretending these are isolated ES modules.
Ruling: saved marks use full URL identity to avoid conflating hash-routed apps; share links are explicit and do not mutate page identity.
Pre-flight: matching, UI, storage and tests share page record identities; implement model together before source extraction. Historical .design evidence stays unchanged.

## Completed — 4.3.0

- Task 1: all six reviewed findings corrected, with regressions for rendered-text boundaries, host mutations, stale selections, locale/mobile behavior and long-node indexing. Offset mapping and normalization run in cancelable chunks; navigation ticks are bounded.
- Task 2: page colors, 20-state undo, explicit URL-local persistence, quote/link copying with manual fallback, Markdown/JSON export and optional whole-word/article scope implemented. Storage failures roll back; unknown schemas remain exportable.
- Task 3: ordered sources and deterministic single-file build, named browser suites, tracked lockfile, frozen CI installation and rewritten German/English documentation completed.
- Independent review found stale-URL writes, empty-page SPA restore and large-node normalization blocking. Each received a failing regression and fix; follow-up review confirmed the fixes. Additional copy/focus/layering/chunk-boundary regressions are green.

## Final evidence

- `CHROMIUM_PATH=/usr/bin/chromium npm test`: **115 passed, 0 failed, 115 executed**; complete output in `docs/archive/reviews/release-4.3/tests.log`.
- `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`: successful frozen installation.
- `npm run check` and `git diff --check`: successful. Repeated build is byte-identical; a disposable stale-artifact probe fails without rewriting the artifact.
- Desktop 1280×900 and narrow 390×844 browser captures: panel within viewport, both occurrences found, no browser errors. Screenshots and measurements in `docs/archive/reviews/release-4.3/`.
- Same-machine benchmark, 2,001 matches in one long node: synchronous action **884.1 → 52.0 ms**, all ranges ready **1,061.7 → 319.5 ms**. Individual measurements, not cross-browser guarantees.
- Maintained Markdown local links checked. Text-fragment ambiguity/browser limits and actual userscript-manager release checks are documented.

Detailed completion report: `docs/archive/reviews/release-4.3/implementation-report.md`. No commit, push or publication performed.
