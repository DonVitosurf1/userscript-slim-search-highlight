# 🖍️ Slim Search Highlight

Schlankes Userscript für **Tampermonkey** / **Violentmonkey** zum Hervorheben von Keywords auf Webseiten.

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

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/) installieren
2. Die Datei `userscript/slim-search-highlight.user.js` öffnen und den Inhalt kopieren
3. Im Userscript-Manager ein neues Skript anlegen und den Code einfügen
4. Speichern und Seite neu laden

## Verwendung

- Panel über den Button unten rechts öffnen (oder Menübefehl)
- Keywords hinzufügen oder automatisch von Suchmaschinen übernehmen
- Mit **Alt + →** / **Alt + ←** zwischen Highlights navigieren
- Rechtsklick auf ein Highlight → Suche in der konfigurierten Suchmaschine
- Positionsanzeige rechts zeigt die Verteilung der Treffer

## Projektstruktur

```
userscript/
  slim-search-highlight.user.js   ← Haupt-Skript
README.md
LICENSE
```

## Lizenz

MIT
