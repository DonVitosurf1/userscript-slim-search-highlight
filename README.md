<p align="center"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight Logo"></p>

# Slim Search Highlight

[English](README.en.md) · [Dokumentation](docs/README.md) · [Bedienung](docs/usage.de.md) · [Entwicklung](docs/development.md)

[![Tests](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml/badge.svg)](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml) [![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)

Wörter, Sätze oder Absätze auf Webseiten auswählen und alle Vorkommen derselben Passage markieren. Ein lokales Userscript für Tampermonkey und Violentmonkey, ohne Konto, Server oder Laufzeitabhängigkeiten.

![Panel und Seitenmarkierungen](assets/screenshot.png)

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/) installieren.
2. [Skript installieren](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) und im Manager bestätigen.
3. Webseite neu laden. Updates erfolgen über den Userscript-Manager.

Seitenmarkierungen benötigen einen Browser mit **CSS Custom Highlights**. Ohne diese API wird die Aktion mit Erklärung deaktiviert. Dauerhafte Keywords und ausdrückliche Websuche bleiben verfügbar.

## Schnellstart

- Text auswählen → Textmarker-Symbol öffnen → **Alle Vorkommen markieren**. Alternativ **Alt+Shift+H** verwenden; die Kombination ist in den Einstellungen änderbar und abschaltbar.
- Mit Vor/Zurück oder **Alt+← / →** durch die Treffer navigieren. Rechtsklick und Doppelklick bleiben beim Browser.
- Jede Seitenpassage hat eine eigene Farbe. Entfernen, Leeren und weitere Seitenänderungen lassen sich rückgängig machen.
- **Für diese Seite merken** speichert nur ausdrücklich gewählte Passagen lokal für diese URL. Sonst bleiben Markierungen temporär. **Dauerhafte Keywords** sind ein eigener Bereich für seitenübergreifende Begriffe.
- **Suchoptionen für diese Seite** bietet ganze Wörter und den Artikelbereich. Standard bleibt die ganze ausgewählte Passage auf der gesamten Seite.
- **Kopieren / Export** an der Auswahl bietet Zitat+URL oder einen Link zur Textstelle. Websuche startet ausschließlich über **Im Web suchen**.
- In den Einstellungen: Klartext/Markdown für Zitate, Markdown-Export der aktuellen Seite und JSON-Export gespeicherter Seiten.
- **Einstellungen → Darstellung:** helles/dunkles Farbschema sowie Größe, Bildschirmecke und Randabstand des Öffnen-Buttons. Standardgröße: 56 px.

Gespeicherte Passagen werden bei Wiederbesuch erneut gesucht. Fehlender Text wird als **Nicht gefunden** gemeldet. Ohne Zwischenablagenzugriff steht ein Feld zum manuellen Kopieren bereit. Vollständige Details und Grenzen: [Bedienung](docs/usage.de.md), [Datenformat](docs/data-format.md).

## Entwicklung

Node.js 22 oder neuer:

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm test
```

Die Entwicklung findet unter `src/` statt. Der deterministische Build erzeugt weiterhin **eine** installierbare Datei unter `userscript/`. `npm run check` erkennt veraltete generierte Dateien. Tests laufen auf synthetischen Seiten ohne Netzwerk.

```text
src/          geordnete Quellabschnitte und Userscript-Metadaten
scripts/      Build, Benchmark und Screenshot-Aufnahmen
tests/        Browser-Fixtures, benannte Suites und Test-Runner
userscript/   generiertes installierbares Userscript
docs/         Aktuelle Leitfäden und historisches Entwicklungsarchiv
assets/       Logo und Screenshot
artifacts/    Lokal erzeugte Screenshots; nicht versioniert
```

[Dokumentationsübersicht](docs/README.md) · [Mitwirken](CONTRIBUTING.md) · [Release-Prüfung](docs/releasing.md) · [Änderungen](CHANGELOG.md) · [Sicherheit](SECURITY.md)

Für Updates von 3.x: Das alte „Slim Search Highlight Pro v3.10“ entfernen; Einstellungen müssen beim Wechsel auf den stabilen Skriptnamen einmal neu angelegt werden.

## Lizenz

[MIT](LICENSE)
