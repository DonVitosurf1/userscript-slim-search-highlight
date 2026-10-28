# Selection-first highlighting

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

Approved brief: selecting text shows a small floating symbol; expanding it offers “Highlight and find on this page” (one action, always every occurrence) and an explicitly chosen web search. Right-click ALWAYS remains native. The default shortcut is Alt+Shift+H, configurable or disabled. The user corrected the earlier context-menu proposal; do not implement a custom right-click menu.

Page selections are literal case-insensitive passages, whitespace-normalized, including paragraphs and inline formatting. They are transient, never written into saved keywords or cross-page search history. Navigation prioritizes page results while page selections exist; otherwise existing saved-keyword navigation remains. Changing page URL or reloading clears transient selections. Overlapping occurrences across selected passages are consolidated, favoring the longer passage at the same starting point, otherwise the earlier occurrence.

Architecture: retain existing saved-keyword DOM engine and storage. Use CSS Custom Highlights and DOM Ranges for page selections, avoiding destructive wrapping across inline elements. Recompute ranges after relevant DOM changes and persistent highlighting; unsupported browsers receive a clear message (current Chromium/Firefox/Safari versions supporting CSS Custom Highlights are the target). Match extraction excludes script/form/editable/hidden/owned UI. Native context menus remain untouched. A compact scoped selection toolbar shares panel tokens; saved keywords move into their own disclosure. Native OS select remains intentional for web engine selection.

Toolbar must preserve a snapshot of selected text through pointer/focus interactions, show keyboard-accessible actions, remain in viewport and dismiss on Escape/outside interaction/stale selection/scroll. Shortcut only handles valid document selections outside editing fields, IME, repeats and exclusions. Recording a shortcut requires a modifier plus letter/digit and offers cancel/reset/disable. Only deliberate Web action sends selection to configured search engine.

No new dependencies, framework, worktree, publication or environment setup. Build on current uncommitted 4.1.0 changes without discarding prior work. Version this behavior as 4.2.0.
