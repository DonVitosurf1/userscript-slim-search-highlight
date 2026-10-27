<p align="center"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight logo"></p>

# Slim Search Highlight

[Deutsche Version](README.md)

A lightweight userscript for **Tampermonkey** / **Violentmonkey** that highlights keywords on web pages.

![Screenshot](assets/screenshot.png)

## Features

- Multiple keywords with individual colors
- Floating panel with next/previous navigation
- Position bar on the right with clickable markers
- Keyword filter field in the panel
- Cross-page persistence (terms are taken over from search engines)
- Regex support, whole words or partial matches
- Live updates without reloading, also for dynamically loaded content
- Profiles: keep keywords in named sets and switch quickly
- Export and import (JSON) for backups and moving to another browser
- Configurable keyboard shortcuts
- Optionally also inside iframes (setting in the panel, off by default)
- The panel lives in a Shadow DOM, so page CSS cannot break it
- Alt+H adds the selected text as a keyword
- Configurable search engine for the right-click lookup

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
2. Click [**install script**](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) and confirm in your userscript manager
3. Reload the page

Updates are delivered automatically by the userscript manager. The interface is available in English and German (follows the browser language by default, can be changed in the panel settings).

> **Upgrading from 3.x to 4.0:** the script was renamed. Please delete the old script “Slim Search Highlight Pro v3.10”. Saved keywords and settings have to be re-entered once (see the [changelog](CHANGELOG.md)).

## Usage

- Open the panel with the button at the bottom right (or the menu command)
- **Alt + →** / **Alt + ←** jump between highlights (configurable in the settings)
- Right-click a highlight to search for it in the configured search engine
- **Alt + click** on a highlight removes its keyword

## Tests

```
npm install && npx playwright install chromium
npm test
```

## License

MIT
