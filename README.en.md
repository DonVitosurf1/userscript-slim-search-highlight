<p align="center"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight logo"></p>

# Slim Search Highlight

[Deutsch](README.md) · [Documentation](docs/README.md) · [Usage](docs/usage.en.md) · [Development](docs/development.md)

[![Tests](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml/badge.svg)](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Select words, sentences or paragraphs and highlight every occurrence of the same passage. A local Tampermonkey/Violentmonkey userscript with no account, server or runtime dependencies.

![Panel and page highlights](assets/screenshot.png)

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. [Install the script](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) and confirm in the manager.
3. Reload the webpage. The userscript manager handles updates.

Page passages require a browser supporting **CSS Custom Highlights**. Unsupported browsers disable that action with an explanation; persistent keywords and explicit web search remain available.

## Quick start

- Select text → open the highlighter symbol → **Highlight all occurrences**. Alternatively use **Alt+Shift+H**, configurable or disabled in Settings.
- Move through results with Previous/Next or **Alt+Left / Right**. Native right-click and double-click remain intact.
- Set a color for each page passage. Undo page changes, removals and clearing.
- **Remember for this page** explicitly saves chosen passages locally for that URL. Otherwise they stay temporary. **Saved keywords** is a separate cross-page term list.
- **Page search options** offers whole-word and article-only search. The default remains the entire selected passage across the full page.
- **Copy / export** beside a selection offers quote+URL or a link to text. Web search runs only when **Search the web** is explicitly chosen.
- Settings includes plain-text/Markdown quotes, Markdown export of the current page and JSON export of saved pages.
- **Settings → Appearance:** light/dark theme, plus open-button size, screen corner and edge distance. Default size: 56 px.

Saved passages are searched again when revisiting a page. Missing text is shown as **Not found**. Clipboard failure provides a manual-copy field. See [Usage](docs/usage.en.md) and the [data format](docs/data-format.md) for behavior and limits.

## Development

Node.js 22 or newer:

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm test
```

Edit `src/`; a deterministic build still produces **one** installable file under `userscript/`. `npm run check` detects stale generated output. Browser tests use synthetic pages without network requests.

```text
src/          ordered source sections and userscript metadata
scripts/      build, benchmark and screenshot capture
tests/        browser fixtures, named suites and runner
userscript/   generated installable userscript
docs/         current guides and historical development archive
assets/       logo and screenshot
artifacts/    local generated screenshots; not tracked
```

[Documentation index](docs/README.md) · [Contributing](CONTRIBUTING.md) · [Release checklist](docs/releasing.md) · [Changelog](CHANGELOG.md) · [Security](SECURITY.md)

When upgrading from 3.x, remove “Slim Search Highlight Pro v3.10”; settings need to be recreated once when switching to the stable script name.

## License

[MIT](LICENSE)
