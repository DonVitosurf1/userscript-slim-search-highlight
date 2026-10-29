# Release checklist

[Documentation index](README.md) · [Development](development.md)

This is a procedure for future releases, not a record that every check has already been performed. Record actual results and outstanding checks in the release or pull request.

## Prepare the change

1. Make behavior changes in `src/`, with regression coverage in `tests/suites/`.
2. For a product release, update `src/metadata.txt`, CHANGELOG and affected German/English documentation. Documentation-only changes do not require a userscript version bump.
3. Run `npm ci`, then `npm run build` and `npm test`. Chromium installation and `CHROMIUM_PATH` are described in [Development](development.md).
4. For search performance changes, run `npm run benchmark` and confirm the expected match counts. For UI changes, run `npm run screenshots` and inspect the logo tile and menu in light/dark and desktop/narrow views.
5. Run `npm run check:secrets`, `node scripts/check-secrets.mjs --history` from a full clone, and `npm audit`. Check actual hosted Security/CodeQL results separately.
6. Check local documentation links and `git diff --check`. Include sources and regenerated userscript together; exclude local `artifacts/` and dependencies.

## Manual browser checks

Automated tests use Chromium and simulated GM bindings. They do not replace these checks in the actual browser/manager combinations intended for support:

- Install/update through Tampermonkey and Violentmonkey; verify settings and explicit page saving survive reload.
- Select words, sentences and inline-formatted passages. Confirm every same-page occurrence, result navigation and native context menus.
- Activate both halves of web search by pointer and keyboard: the labeled left action opens a new tab in the same window; the right icon requests a separate window. Confirm the selected text, chosen engine, retained reading page and popup behavior in each supported browser.
- Check keyboard use, screen-reader labels/status, zoom, touch and mobile keyboard behavior. Check shortcut conflicts on the target OS/browser.
- Verify Alt+Shift+P opens/closes from both page and panel focus, stays inactive in editing fields/IME/repeat, and preserves an existing marking assignment. Check shortcut hover hints after recording, disabling, resetting and changing language.
- Switch theme and transparency; verify saved choices and rollback on write failure. Confirm the logo tile has no additional button frame and that expanded copy actions fit short/narrow viewports.
- Verify isolated DOM/content-world execution in each manager; page-world injection is unsupported. Check the new download grant, successful Markdown/JSON exports and denial/error reporting without a page-visible export link.
- Try clipboard denial and manual copying, missing saved text and storage failure behavior. Confirm domain-scoped keyword visibility, explicit Save/Enter edits and manager-menu-only search history.
- Check a browser with CSS Custom Highlights and the unsupported-API explanation where that API is unavailable.

Publish only the compatibility claims supported by actual checks. Keep unresolved limitations visible in the release notes.

## Integrate and verify

Commit the reviewed change and use the repository's chosen branch/PR workflow. Before updating `main`, confirm the target and the tested tree; do not force-push to bypass a changed remote or failed check.

After integration, verify the remote commit and the [GitHub Actions result](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml). A local passing suite does not establish that hosted CI passed. If CI status cannot be read, report it as unverified.

The stable installation/update path is `userscript/slim-search-highlight.user.js` on `main`. Moving it would break existing update URLs. A tag or GitHub Release is a separate optional publishing step; merging into `main` does not create one automatically.
