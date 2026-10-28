# Saved page data (version 1)

[Documentation index](README.md) · [Usage (DE)](usage.de.md) · [Usage (EN)](usage.en.md)

Page passages are stored locally by the userscript manager only after explicit saving. The `hl_page_annotations` value is separate from `hl_keywords`:

```json
{
  "version": 1,
  "pages": {
    "https://example.test/article": {
      "title": "Example article",
      "options": { "wholeWords": false, "articleOnly": false },
      "terms": [{
        "id": "p1",
        "text": "Solarenergie",
        "color": "#ffe082",
        "anchor": {
          "exact": "Solarenergie",
          "prefix": "An exact quote near ",
          "suffix": " appears in the article."
        }
      }]
    }
  }
}
```

The key is the complete page URL; query parameters and fragments distinguish pages, including hash-routed applications. Transient records are never included. On restore, IDs/colors/text are validated, duplicate passages are removed and text is normalized. All current literal occurrences are searched; quote/context records are evidence for the saved passage, not permission to silently substitute similar text. A passage that cannot be found remains in the list with a visible missing-text status.

Saving one page merges the latest other-page entries. Concurrent edits to the **same URL** use the latest write; there is no multi-user synchronization or conflict-merging service. Forgetting a passage removes its saved data and retains the current temporary highlighting. Clearing/removing a saved passage also updates its URL record; page undo can restore that change during the current session.

Unknown schema versions are not overwritten by save actions. “Export saved pages” downloads the original local data as JSON, including an unknown version, for preservation. JSON export is a data export; this version does not offer a file-import UI. Do not treat it as a round-trip import feature.

## Appearance preferences

These independent local preferences apply across pages. They are separate from page annotations and are not included in the saved-pages JSON export:

| Key | Values | Default |
|---|---|---|
| `hl_ui_theme` | `dark`, `light` | `dark` |
| `hl_launcher_size` | 44–80 px, steps of 4 | 56 |
| `hl_launcher_position` | `bottom-right`, `bottom-left`, `top-right`, `top-left` | `bottom-right` |
| `hl_launcher_inset` | 8–80 px, steps of 4 | 20 |

Unknown theme/position values use the default; numeric sizes/insets are rounded and bounded, and invalid types use the default. Failed writes restore the last saved appearance. Size reset affects only `hl_launcher_size`.

## Exports

Markdown export contains the current page passages with source URLs. “Quote + URL” copies the current selection in plain text or Markdown. Text-fragment copying falls back to the page URL when unsupported. Exported quotes and full URLs can contain personal information; export/copy is always an explicit action, with no background upload.
