<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/icon-dark.svg"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight logo"></picture></p>

# Slim Search Highlight

[Deutsch](README.md) · [Usage](docs/usage.en.md) · [Documentation](docs/README.md)

[![Tests](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml/badge.svg)](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Select words, sentences or paragraphs on webpages and highlight every occurrence. A local Tampermonkey/Violentmonkey userscript with no account, server or runtime dependencies.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. [Install the script](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) and confirm in the manager.
3. Reload the webpage. The userscript manager handles future updates.

Page passages require **CSS Custom Highlights**. Without that browser API, persistent keywords and explicit web search remain available. File exports require the manager's download permission.

## Quick start

- Select text → open the logo symbol → **Highlight all occurrences**. Alternatively use **Alt+Shift+H**; the shortcut is configurable.
- Each new passage gets a different vivid color. Navigate results with the arrows or **Alt+Left / Right**.
- **Remember** saves a passage locally for this URL. Otherwise page highlights remain temporary; **Keywords** manages permanent terms separately.
- **Search the web** explicitly starts a web search. Native right-click remains available.

![Panel and page highlights](assets/screenshot.png)

Automatically capture Google search words, customize colors, undo changes, copy quotes, export and select a light/dark theme: see the [full usage guide](docs/usage.en.md).

## Further information

- [Documentation index](docs/README.md)
- [Design guideline and icons (German)](docs/design/README.md) · [Technical design system](docs/design/DESIGN.md)
- [Development and tests](docs/development.md) · [Contributing](.github/CONTRIBUTING.md)
- [Changelog](CHANGELOG.md) · [Security model](docs/security-model.md) · [Report a vulnerability](SECURITY.md)
- [MIT license](LICENSE)
