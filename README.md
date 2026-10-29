<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/icon-dark.svg"><img src="assets/icon.svg" width="96" alt="Slim Search Highlight Logo"></picture></p>

# Slim Search Highlight

[English](README.en.md) · [Bedienung](docs/usage.de.md) · [Dokumentation](docs/README.md)

[![Tests](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml/badge.svg)](https://github.com/DonVitosurf1/userscript-slim-search-highlight/actions/workflows/test.yml) [![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-blue.svg)](LICENSE)

**Text auswählen, alle Vorkommen markieren und den Überblick behalten.** Slim Search Highlight ergänzt Webseiten um farbige Markierungen, Treffernavigation und ein kleines Auswahlmenü für Websuche und Zitate.

Ein **Browser-Userscript für Tampermonkey und Violentmonkey**. Kein Konto, kein eigener Server, keine Laufzeitabhängigkeiten.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/screenshot.png">
  <img src="assets/screenshot-light.png" width="1200" alt="Beispielartikel mit gelben, türkisen und pinken Markierungen. Das Auswahlmenü bietet Markieren, Websuche und Kopieren an; rechts zeigt das Panel sieben Treffer für drei Begriffe und deren Speicherstatus.">
</picture>

*Echte Oberfläche auf einer lokalen Beispielseite: drei Begriffe, sieben Treffer. Die Vorschau folgt deinem GitHub-Farbschema; im Userscript wählst du Hell oder Dunkel selbst.*

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) oder [Violentmonkey](https://violentmonkey.github.io/) installieren.
2. [Skript installieren](https://raw.githubusercontent.com/DonVitosurf1/userscript-slim-search-highlight/main/userscript/slim-search-highlight.user.js) und im Manager bestätigen.
3. Webseite neu laden. Weitere Updates erfolgen über den Userscript-Manager.

Seitenmarkierungen benötigen einen Browser mit **CSS Custom Highlights**. Ohne diese API bleiben dauerhafte Keywords und die Websuche verfügbar. Für Datei-Exporte benötigt der Manager die Download-Berechtigung.

## Schnellstart

1. **Wort, Satz oder Absatz auswählen.** Die Logo-Kachel erscheint neben der Auswahl. Darüberfahren oder anklicken öffnet das Menü; Rechtsklick bleibt beim Browser.
2. **Alle Vorkommen markieren** wählen. Jede neue Passage erhält eine eigene kräftige Farbe. Das Panel zeigt die Trefferzahl; mit den Pfeilen springst du von Fundstelle zu Fundstelle.
3. **Bei Bedarf für diese Seite merken.** Das Lesezeichen speichert eine Passage lokal für dieselbe vollständige URL. Ohne Speichern verschwindet sie beim Neuladen. Dauerhafte Begriffe verwaltest du getrennt unter **Keywords**.

| Aktion | Tastenkombination |
|---|---|
| Auswahl und alle weiteren Vorkommen markieren | **Alt+Shift+H** · einstellbar |
| Panel öffnen / schließen | **Alt+Shift+P** |
| Vorheriger / nächster Treffer | **Alt+← / →** |

Die Hover-Hinweise zeigen die verfügbaren Shortcuts. Ist Alt+Shift+P bereits als Markieren-Shortcut vergeben, behält diese Belegung Vorrang. Das Logo am Bildschirmrand öffnet das Panel jederzeit.

## Weitere Funktionen

- **Websuche und Zitate:** „Im Web suchen“ öffnet die Suche in einem neuen Tab und lässt die Leseseite offen. Außerdem Zitate mit Quelle oder Links zur Textstelle kopieren; Passagen als Markdown und gespeicherte Seiten als JSON exportieren.
- **Google-Suchwörter übernehmen:** Bei aktivierter automatischer Übernahme werden die Suchwörter nach dem Öffnen eines Ergebnisses auf der Zielseite hervorgehoben.
- **Darstellung anpassen:** Unter **Einstellungen → Darstellung** Hell/Dunkel, Transparenz sowie Größe und Lage des Panel-Öffners wählen. Die Einstellungen bleiben lokal gespeichert.

Gespeicherte Passagen, Keywords und Einstellungen liegen lokal im Userscript-Manager. Eine ausdrücklich gestartete Websuche übergibt den ausgewählten Text an die gewählte Suchmaschine. Details und Grenzen erklärt das [Sicherheitsmodell](docs/security-model.md).

Die [Bedienungsanleitung](docs/usage.de.md) erklärt Speicherung, Suchoptionen und Export. Bei Problemen hilft [Problemlösungen](docs/usage.de.md#problemlösungen).

## Weitere Informationen

- [Dokumentationsübersicht](docs/README.md)
- [Designrichtlinie und Symbole](docs/design/README.md)
- [Entwicklung und Tests](docs/development.md) · [Mitwirken](.github/CONTRIBUTING.md)
- [Änderungen](CHANGELOG.md) · [Sicherheitsmodell](docs/security-model.md) · [Sicherheitsproblem melden](SECURITY.md)
- [MIT-Lizenz](LICENSE)
