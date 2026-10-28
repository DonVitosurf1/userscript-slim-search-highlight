# Panel improvements design

The user explicitly authorized implementing all recommendations in `.design/review-report.md`. That report is the approved product brief: R1–R10, including undo, context snippets, keyboard navigation and local style isolation. No additional product decision or rebrand is needed.

Keep a single installable userscript, German/English copy, existing GM storage keys, dark palette, system fonts, incremental highlighting and 300-row match limit. No runtime dependencies. Retain the current isolated cloud checkout (branch `work`); no worktree or publication.

Approach: repair the existing light-DOM panel with a scoped reset, CSS variables, semantic controls and explicit transient state. A Shadow DOM rewrite was considered but is unnecessary for the demonstrated host CSS failures and would change the integration/selector contract. An incremental cosmetic-only pass would leave the confirmed behavior defects unresolved.

Layout: compact header, status/navigation, add form with persistent label and color preview, optional advanced options, keyword management with clearable search and undo, optional contextual match list, optional settings. The panel is a nonmodal named region: no focus trap. Touch drag, arrow-key header movement, reset position and resize clamping keep it recoverable. Reflow stays inside the viewport, including visualViewport changes.

Behavior: validate regex and duplicates before create or rename; retain bad input and associate errors. IME composition cannot submit or run global shortcuts. Language changes retain drafts, focus, disclosure and scroll state. Deletion is reversible (latest removal) without a confirmation. Deactivation clears stale counters/list immediately. Highlight foreground is contrast-selected, and reduced-motion navigation uses instant scrolling.

Acceptance: regressions for each R1–R10; full existing suite green; narrow/desktop screenshots; German/English, empty/error/keyboard/host CSS/reduced-motion checks. Manual real extension, Safari and screen-reader checks remain outside the available Chromium harness and must be reported honestly.
