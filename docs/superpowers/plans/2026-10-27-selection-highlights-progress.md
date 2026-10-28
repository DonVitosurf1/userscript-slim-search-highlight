# Execution ledger — plan: docs/superpowers/plans/2026-10-27-selection-highlights.md

Brief approved in conversation; latest correction replaces right-click UI with a floating selection symbol. Keep native contextmenu fully untouched. Execute inline in the existing isolated checkout, retaining prior uncommitted changes.
Pre-flight: new ranges must share navigation without entering permanent matcher/storage. Legacy tests exercise permanent controls through an explicitly expanded disclosure. CSS Highlight support verified by browser regressions; unsupported browsers get an honest message.

Task 1: complete. Initial 13 expected feature failures observed; existing input/IME guard was already correct.
Task 2: complete. Literal normalized range matching, primary page list, scoped floating symbol/actions and navigation adapters implemented.
Task 3: complete. Shortcut preference/record/reset/disable, URL and mutation lifecycle, docs and browser captures implemented.
Independent review found four reproducible issues; BR, plaintext-only, visibility changes and History API regressions now pass and were independently rechecked.
Ruling: deterministic overlap consolidation prefers longer at same start, otherwise earlier occurrence; avoids duplicate ranges and quadratic longest-first selection.
Ruling: final button label per user steering is “Alle Vorkommen markieren”, with full same-page tooltip.
Own characterData split events caused redundant highlight work; regression reproduced before adding the owned-node guard.
Final verification: 85 PASS, 0 FAIL, complete npm test exit0; syntax and diff checks pass. Desktop/narrow screenshots inspected, previous workspace changes retained.
