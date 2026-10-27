<p align="center"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight Logo"></p>

# Slim Search Highlight

[English version](README.en.md)

Schlankes Userscript für **Tampermonkey** / **Violentmonkey** zum Hervorheben von Keywords auf Webseiten.

![Screenshot](assets/screenshot.png)

## Features

- Mehrere Keywords mit eigenen Farben
- Floating Panel mit Navigation (Nächstes/Vorheriges)
- Positionsanzeige (rechte Leiste mit klickbaren Markierungen)
- Keyword-Suchfeld im Panel
- Cross-Page Persistenz (von Suchmaschinen)
- Regex-Unterstützung
- Ganze Wörter / Teilwörter
- Live-Updates ohne Reload
- Alt+H zum Hinzufügen markierten Textes
- Konfigurierbare Suchmaschine für Rechtsklick
- Profile: Keywords in benannten Sätzen verwalten und schnell wechseln
- Export und Import (JSON) für Backup und Umzug
- Konfigurierbare Tastenkürzel
- Optional auch in iframes (Einstellung im Panel, standardmäßig aus)
- Panel im Shadow DOM: Seiten-CSS stört es nicht
- Oberfläche auf Deutsch und Englisch (automatisch nach Browsersprache, umschaltbar im Panel)

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/) installieren
2. [**Skript installieren**](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) anklicken und im Userscript-Manager bestätigen
3. Seite neu laden

Updates kommen automatisch über den Userscript-Manager.

> **Update von 3.x auf 4.0:** Das Skript wurde umbenannt. Das alte Skript „Slim Search Highlight Pro v3.10“ bitte löschen. Gespeicherte Keywords und Einstellungen müssen einmalig neu angelegt werden (siehe [Changelog](CHANGELOG.md)).

## Verwendung

- Panel über den Button unten rechts öffnen (oder Menübefehl)
- Keywords hinzufügen oder automatisch von Suchmaschinen übernehmen
- Mit **Alt + →** / **Alt + ←** zwischen Highlights navigieren (anpassbar unter „Einstellungen“)
- Rechtsklick auf ein Highlight → Suche in der konfigurierten Suchmaschine
- Positionsanzeige rechts zeigt die Verteilung der Treffer

## Tests

```
npm install && npx playwright install chromium
npm test
```

Die Tests laden das Skript in Chromium auf synthetischen Seiten (kein Netzwerk nötig) und prüfen u. a. Performance, Treffer-Korrektheit und das Verhalten bei dynamischen Seiten.

## Projektstruktur

```
userscript/
  slim-search-highlight.user.js   ← Haupt-Skript
tests/run_tests.js                ← Browser-Tests
assets/icon.svg                   ← Logo
CHANGELOG.md
README.md
README.en.md
LICENSE
```

## Lizenz

MIT
