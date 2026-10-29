<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/icon-dark.svg"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight Logo"></picture></p>

# Slim Search Highlight

[English](README.en.md) · [Bedienung](docs/usage.de.md) · [Dokumentation](docs/README.md)

[![Tests](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml/badge.svg)](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml) [![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)

Texte im Browser hervorheben, alle Vorkommen finden und im Web suchen. Ein lokales Userscript für Tampermonkey und Violentmonkey – ohne Konto, Server oder Laufzeitabhängigkeiten.

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/) installieren.
2. [Skript installieren](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) und im Manager bestätigen.
3. Webseite neu laden. Weitere Updates erfolgen über den Userscript-Manager.

Seitenmarkierungen benötigen **CSS Custom Highlights**. Ohne diese Browser-API bleiben dauerhafte Keywords und ausdrückliche Websuche verfügbar. Für Datei-Exporte benötigt der Manager die Download-Berechtigung.

## Schnellstart

- Text auswählen → das Logo-Symbol öffnen → **Alle Vorkommen markieren**. Alternativ **Alt+Shift+H** verwenden; der Shortcut ist einstellbar.
- Jede neue Passage bekommt eine andere kräftige Farbe. Mit den Pfeilen oder **Alt+← / →** durch die Treffer wechseln.
- Das **Lesezeichen-Symbol** speichert eine Passage lokal für diese URL. Ohne diese Aktion bleiben Seitenmarkierungen temporär; **Keywords** verwaltet dauerhafte Begriffe getrennt.
- **Im Web suchen** startet ausdrücklich eine Websuche. Rechtsklick bleibt beim Browser.
- Das Logo am Bildschirmrand oder **Alt+Shift+P** öffnet und schließt das Highlight-Panel. Hover-Hinweise zeigen die passenden Shortcuts.

![Panel und Seitenmarkierungen](assets/screenshot.png)

Unter **Einstellungen → Darstellung** wählst du Hell/Dunkel, Transparenz sowie Größe und Lage des Panel-Öffners. Die Darstellungseinstellungen werden lokal gespeichert.

Google-Suchwörter automatisch übernehmen, gespeicherte Passagen verwalten, zitieren und exportieren: [vollständige Bedienungsanleitung](docs/usage.de.md). Bei Problemen hilft der Abschnitt [Problemlösungen](docs/usage.de.md#problemlösungen).

## Weitere Informationen

- [Dokumentationsübersicht](docs/README.md)
- [Designrichtlinie und Symbole](docs/design/README.md)
- [Entwicklung und Tests](docs/development.md) · [Mitwirken](.github/CONTRIBUTING.md)
- [Änderungen](CHANGELOG.md) · [Sicherheitsmodell](docs/security-model.md) · [Sicherheitsproblem melden](SECURITY.md)
- [MIT-Lizenz](LICENSE)
