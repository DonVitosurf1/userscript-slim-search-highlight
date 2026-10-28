# Umsetzung 4.3.0

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../../README.md).

Stand: 27.10.2026. Die Empfehlungen aus [dem Review](../code-review-report.md) und die vier dort vorgeschlagenen Erweiterungsgruppen wurden umgesetzt. Der bestehende Arbeitsstand blieb erhalten; historische Review-Berichte wurden nicht überschrieben.

## Verhalten und Korrekturen

- Die ausgewählte Passage wird über das schwebende Textmarker-Symbol oder den konfigurierbaren Shortcut auf der Seite gesucht. Alle Vorkommen werden markiert. Rechtsklick und Doppelklick bleiben beim Browser; eine Websuche erfolgt nur durch die eigene Aktion.
- Versteckte Inline-Inhalte und Inline-Blocks erzeugen keine falschen Textgrenzen. Änderungen der Webseite innerhalb bestehender Keyword-Markierungen aktualisieren die Seiten-Ranges.
- Entfernte oder geänderte Auswahlquellen schließen auch eine fokussierte Toolbar. Seitenaktionen prüfen die aktuelle URL, bevor gespeicherte Daten geändert werden. SPA-Wechsel von einer leeren Seite zu einer gespeicherten Seite stellen Markierungen wieder her.
- Statusmeldungen folgen dem Sprachwechsel; schmale Toolbar-Controls erreichen mindestens 44px. Auswahlaktionen bleiben über dem Panel. Das manuelle Kopierfeld bleibt bei Sprachwechsel erhalten und beim Fokussieren sichtbar.
- Normalisierte Text-Offsets werden einmal berechnet und schwach gecacht. Auch große einzelne Textknoten werden in Schritten verarbeitet. Neue Suchläufe brechen veraltete Generationen ab. Die Positionsleiste verwendet höchstens 500 aggregierte Marken; alle Treffer bleiben navigierbar.

## Erweiterungen

1. Eigene Farbe je Seitenpassage und Rückgängig für bis zu 20 Seitenzustände.
2. Zitat mit URL in Klartext oder Markdown, Textfragment-Link, manuelles Kopieren bei verweigerter Zwischenablage und Markdown-Export der aktuellen Seite.
3. Ausdrückliches Merken, Wiederherstellen und Vergessen pro vollständiger URL, getrennt von globalen Keywords. Fehlende Passagen werden angezeigt. JSON-Export gespeicherter Seiten; unbekannte Datenversionen bleiben erhalten. Speicherfehler rollen betroffene Änderungen zurück.
4. Optionale Suche nach ganzen Wörtern und im Artikelbereich. Standard bleibt die vollständige Passage auf der gesamten Seite.

## Projekt und Dokumentation

Entwicklung unter `src/`, explizite Reihenfolge in `src/manifest.json`, deterministischer Build unter `scripts/`. Die Installation bleibt eine Datei am bisherigen Pfad. Ein Aktualitätscheck verhindert, dass Quellen und ausgeliefertes Userscript auseinanderlaufen. Die Quellabschnitte teilen bewusst einen dokumentierten privaten Gültigkeitsbereich.

Die Browser-Fixtures und fünf Testsuites liegen getrennt unter `tests/`; der bisherige Test-Einstiegspunkt bleibt bestehen. Der Lockfile wird versioniert; CI verwendet `npm ci` und prüft den generierten Stand.

Neu geordnet: [README](../../../../README.md), [englischer Einstieg](../../../../README.en.md), [Bedienung DE](../../../usage.de.md)/[EN](../../../usage.en.md), [Architektur](../../../architecture.md), [Entwicklung](../../../development.md), [Datenformat](../../../data-format.md), Mitwirkungsanleitung, DESIGN und Changelog. Der öffentliche Screenshot zeigt die neue Oberfläche.

## Nachweise

| Prüfung | Ergebnis |
|---|---|
| Vollständige Chromium-Suite | **115 bestanden, 0 fehlgeschlagen**; [Log](tests.log) |
| Gefrorene Installation | `npm ci` erfolgreich |
| Build/Syntax | `npm run check` erfolgreich; wiederholter Build byte-identisch |
| Veraltetes Artefakt | Wegwerf-Probe wird abgewiesen, ohne die Datei umzuschreiben |
| Diff/Markdown | `git diff --check` und lokale Links der gepflegten Dokumentation geprüft |
| Oberfläche | Desktop 1280×900 und schmal 390×844; Panel innerhalb des Viewports, jeweils zwei Treffer, keine Browserfehler; [Messwerte](browser.json) |
| Unabhängiger Review | Drei zusätzliche Befunde mit Regressionen behoben; fokussierter Folge-Review bestätigt die Korrekturen |

Benchmark auf derselben Maschine, jeweils 2.001 tatsächliche Treffer:

| Struktur | Synchron vorher → nachher | Alle Ranges bereit vorher → nachher |
|---|---:|---:|
| Ein langer Textknoten | 884,1 → 52,0 ms | 1.061,7 → 319,5 ms |
| Getrennte Absätze | 58,7 → 32,5 ms | 99,3 → 103,7 ms |

Einzelmessungen unter wechselnder Last; keine allgemeine Beschleunigungsgarantie. Vollständige Daten: [vorher](benchmark-before.json), [nachher](benchmark-after.json). Der Benchmark wartet auf die erwartete Trefferzahl und misst nicht nur das Starten der asynchronen Arbeit.

## Grenzen

Automatisiert geprüft wurde Chromium mit simulierten GM-Bindings. Echte Tampermonkey-/Violentmonkey-Installationen, andere Browser-Engines, Screenreader und mobile Betriebssysteme bleiben manuelle Release-Prüfungen. Seitenpassagen benötigen CSS Custom Highlights.

Textfragment-Links verwenden die ausgewählte Passage; bei wiederholtem Text kann der Browser das erste Vorkommen wählen. Geänderte Seiten und blockübergreifende Auswahlen können die Auflösung verhindern. JSON ist ein Exportformat; eine Datei-Importoberfläche gehört nicht zu dieser Version. Gleichzeitige Änderungen derselben URL verwenden den letzten Schreibstand. Schatten-DOM, Frames und Cloud-Synchronisierung wurden nicht ergänzt.

Zum Zeitpunkt dieses Berichts lagen die Änderungen lokal im Arbeitsverzeichnis.

**Integrationsnachtrag vom 28.10.2026:** Alle Änderungen wurden mit Commit [`31cca1d`](https://github.com/DonVitosurf1/userscript-slim-search-highlight/commit/31cca1d7fd6f8cc4ae8c1d03751a1b161ab889ba) committet, gepusht und per Fast-Forward nach `main` übernommen. Vor der Integration bestanden erneut alle 115 Tests. Eine gesonderte GitHub-Release-Veröffentlichung und die oben genannten manuellen Browserprüfungen sind dadurch nicht belegt. Dieser Bericht ist ein archivierter Nachweis; die [aktuelle Dokumentation](../../../README.md) beschreibt den heutigen Projektaufbau.
