# Execution ledger — plan: docs/archive/plans/2026-10-27-panel-improvements.md

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

Ruling: the user approved all recommendations in the review and explicitly requested execution; reuse that concrete design rather than reopening product selection.
Ruling: inline execution in the already isolated cloud checkout on branch work; no new worktree. Keep all pre-existing .design artifacts.
Pre-flight: Tasks share panel DOM and helpers in a single shipped userscript. Preserve IDs used by the existing suite and handle collapsed settings explicitly in browser tests.

RED: 16 new review regression tests all failed for their intended missing behaviors (captured /tmp/slim-red.log).
GREEN: all 16 new tests pass after panel implementation (captured /tmp/slim-green.log).
Tasks 1–3 implementation: reachable/clamped panel; pointer/keyboard movement; contrast-selected foreground; scoped token/reset system; semantic controls/disclosures; inline validation; IME protection; undo/search clear; locale state recovery; reduced motion.
Ruling: keep compact visual current/total count for backward compatibility, add localized accessible status wording. OS-native selects remain appropriate.
Existing tests now explicitly expand settings/history before real browser interactions, retaining their original assertions.

Independent review: three Important issues reproduced (SVG reset, queued highlight cancellation, dynamic geometry), corrected and independently rechecked. Additional SVG geometry and low-specificity reset regressions now pass. Navigation also stays within the owned list, verified RED→GREEN against a host `.match-item` fixture.
Ruling: no new allow-domain setting; preserve original blacklist membership semantics and show the existing exclusion menu result inline without reload/native dialog.
Browser verification: final desktop and 320px screenshots visually inspected; add action visible, icons/geometry correct. Captured empty/error, English settings/native select, context/keyboard, host CSS and expanded/offscreen recovery. Original review evidence retained separately.
Remaining limitations: real extension manager, screen-reader speech, other browser engines and real mobile/zoom hardware not available in this Chromium harness.

Task 1: complete.
Task 2: complete.
Task 3: complete.
Final verification: full suite exited 0; 63 PASS, 0 FAIL, completion marker present. Syntax and diff checks passed. Current changes retained in the isolated workspace for user review.
