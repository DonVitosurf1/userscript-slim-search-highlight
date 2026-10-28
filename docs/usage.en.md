# Usage

## Select and find

Select a word, sentence or paragraph. Hover or click the small highlighter symbol to reveal **Highlight all occurrences** and **Search the web**. Highlighting always finds the full selected passage and its other occurrences on this page. Web search and sharing require an explicit action.

Search is literal, case-insensitive and whitespace-normalized, including line breaks and inline formatting. Invisible text does not invent visible word boundaries. Overlapping matches count once; a longer passage wins at the same start. Code, editing fields and owned controls are excluded. Frames and Shadow DOM content are not searched.

## Color, removal and undo

Each page passage has a color and count. Remove one passage or clear all page highlights. **Undo page change** restores text/color/saved state, retaining the latest 20 page states in memory. Navigation/reload ends that undo history.

While page terms exist, Previous/Next and **Alt+Left / Right** navigate their results. Otherwise navigation uses saved/automatic keyword matches. Position ticks are aggregated to at most 500 and match details to 300 rows; every actual occurrence remains accessible through navigation.

## Remember for this page

Highlights start as temporary. **Remember for this page** explicitly stores a passage, color and quote context locally in the userscript manager. Revisiting searches the exact text again; missing text is labeled **Not found**, without silently substituting similar content.

**Forget saved passage** removes persistence but keeps temporary highlights. Removing/clearing saved passages updates stored data too; undo can restore it during the current session. Keys use the complete URL, including query and fragment. Concurrent tabs editing the same URL use the latest saved write.

Storage errors retain the previous state and report a failure. Unknown data versions are not overwritten. **Export saved pages (JSON)** preserves local data; this release does not have a file-import interface.

## Search options

- **Match whole words** prevents partial matches such as “art” inside “start”, accounting for Unicode letters and numbers.
- **Article only** searches `article`, falling back to `main` or `[role=main]`. If no article area exists, the application explains this instead of silently broadening the search.

Options belong to current page terms and are retained with passages explicitly saved for that URL.

## Copy and export

Expand **Copy / export** beside a selection:

- **Copy quote + URL** uses the plain-text or Markdown format chosen in Settings.
- **Copy link to text** creates a `#:~:text=` link for supported HTTP(S) pages. Otherwise it copies a normal page link and explains why. Repeated text can resolve to the first matching occurrence. Changed text, selections crossing block boundaries and browser support can affect link resolution.

If clipboard access fails, a labeled manual-copy field appears. Settings also exports current page passages as Markdown and all saved pages as versioned JSON. These explicit local exports contain selected text and full URLs; nothing is uploaded automatically.

## Keyboard and panel

**Alt+Shift+H** highlights all occurrences directly. Settings can record another shortcut, disable it or restore the default. Use Alt/Ctrl/Meta plus a letter/digit, with optional Shift. Escape cancels recording. Browser/OS shortcut conflicts cannot be universally avoided.

The shortcut does not handle editing fields, active IME or key repeat. Native right-click and double-click remain intact; Alt+H no longer saves keywords.

Escape dismisses selection actions or the panel and restores focus. Tab to the panel header and move it with arrow keys; Shift makes larger moves, Home/reset restores position. Mouse/touch dragging remains supported. Match details supports Up/Down, Home/End and Enter. Navigation respects reduced motion.

## Saved keywords and limits

**Saved keywords** remains a separate disclosure for cross-page terms, regex, colors and domain restrictions. Enter/Add submits; validation retains invalid input and explains the problem inline. The userscript menu can exclude the current domain.

Page passages require CSS Custom Highlights. Real browser-manager/device, screen-reader and mobile keyboard checks complement automated Chromium coverage; no full accessibility certification is claimed.
