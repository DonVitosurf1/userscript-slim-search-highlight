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

## Temporary term visibility

The combined page overview does not merge storage formats. Its hidden-term Set is memory-only and scoped to the complete current URL. It is absent from `hl_keywords`, `hl_page_annotations`, undo snapshots and all exports. Hiding a saved passage or a query matching a permanent keyword never modifies that record. Markdown/JSON exports still include hidden passages belonging to that export; hiding is not removal. A reload or URL transition clears hidden state; explicitly saved records remain visible again. Accepted automatic terms are also retained only in a document-local URL snapshot; handoff expiry still applies before first acceptance on a new page.

## Appearance preferences

Panel placement uses `hl_panel_pos`: `null` (or an absent/invalid value) means automatic right-center placement; `{x, y}` stores a manually selected position in viewport pixels. Coordinates are kept inside the visible viewport. Reset stores `null`, so automatic placement continues to follow viewport and panel-height changes.

These independent local preferences apply across pages. They are separate from page annotations and are not included in the saved-pages JSON export:

| Key | Values | Default |
|---|---|---|
| `hl_ui_theme` | `dark`, `light` | `dark` |
| `hl_ui_transparency` | 0–80%, steps of 5; 0 = opaque | 0 |
| `hl_launcher_size` | 44–80 px, steps of 4 | 56 |
| `hl_launcher_position` | `bottom-right`, `bottom-left`, `top-right`, `top-left` | `bottom-right` |
| `hl_launcher_inset` | 8–80 px, steps of 4 | 20 |

Unknown theme/position values use the default; numeric sizes/insets/transparency are rounded and bounded, and invalid types use the default. Failed writes restore the last saved appearance. Size reset affects only `hl_launcher_size`; transparency reset affects only `hl_ui_transparency`.

The retired `hl_selection_style` preference is no longer read or written. Existing values are ignored; every installation uses the logo tile. Other preferences and saved page records are unchanged.

## Keyboard preferences

`hl_selection_shortcut` stores an object such as `{"key":"h","alt":true,"ctrl":false,"shift":true,"meta":false}`; `null` disables selection highlighting by shortcut. A valid key is a single letter/digit string with Alt, Ctrl or Meta; invalid records fall back to Alt+Shift+H. The explicit reset restores that default.

Alt+Shift+P is the panel toggle and has no separate stored preference. If a saved selection shortcut uses that exact combination, the selection assignment wins and the panel combination is unavailable. Changing/resetting the selection shortcut restores the panel binding. Tooltip hints and accessible shortcut metadata follow the active assignment.

## Search-result context (separate from saved pages)

With automatic search transfer enabled, `hl_cross_terms` contains `{terms, timestamp, source}` where `source` is the search origin. `hl_search_handoffs` contains `{version: 1, entries: [{target, source, terms, timestamp}]}`. Targets are normalized HTTP(S) URLs without fragments. At most twelve destination entries are retained; expired entries are pruned on the next capture.

These records are valid for ten minutes; expiry stops their use, rather than guaranteeing immediate deletion from userscript storage. Automatic capture is disabled by the search-transfer option. Unknown handoff versions are not overwritten. The same destination uses its latest captured context; cross-tab writes are not transactional. Search caches are separate from `hl_keywords` and `hl_page_annotations`, and are not included in saved-page JSON export. No query words are appended to result links or sent to a service by the script.

## Finder and website search

`hl_find_shortcut` uses the same validated modifier/key object as the marking shortcut; default is `{ "key":"f", "ctrl":true, "shift":true, "alt":false, "meta":false }`, and `null` disables it. Failed writes retain the previous setting. Finder query, preview ranges, counter and options are memory-only, separate from page records and history. Existing marking/panel bindings win conflicts.

`hl_site_search_origins` contains `{version:1, origins:[{origin,generation}]}` with at most 128 exact HTTP(S) origins (maximum 512 characters each). Each new opt-in gets a generation; disabling/re-enabling does not resurrect old handoffs. Only the current-origin boolean appears in owned UI.

`hl_site_search_handoffs` contains `{version:1, entries:[{origin,generation,target,terms,timestamp,query?}]}`. Targets are same-origin HTTP(S) URLs without fragments (maximum 8192 characters); twelve entries/five-minute use TTL. Query input is bounded to 4096 characters, 64 terms and 256 characters per term. Expiry restricts use, not immediate physical deletion. Unknown versions are retained without writes.

For a confirmed GET form with a custom search-field name, optional `query:{name,value}` records only that search control (name≤128, value≤4096); restoration requires the exact action pathname and exact submitted parameter value within the opted-in origin/generation. Other form values are not read. Concurrent manager writes use the latest read/merge/write, without transactional guarantees.

Form submission requires a recent native submit-button/Enter activation, not merely `submit.isTrusted` (JavaScript `requestSubmit()` can create trusted events). Activation tokens contain form identity/time/URL/generation in memory, are consumed once and expire after two seconds; subsequent native editing invalidates them. These caches do not enter keyword/page exports or shared search history. Cross-origin site-search transfer is blocked.

## Exports

Markdown export contains the current page passages with source URLs. “Quote + URL” copies the current selection in plain text or Markdown. Text-fragment copying falls back to the page URL when unsupported. Exported quotes and full URLs can contain personal information; export/copy is always an explicit action, with no background upload.
