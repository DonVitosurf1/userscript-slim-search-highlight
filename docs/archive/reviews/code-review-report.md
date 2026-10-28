# Code-Review 4.2.0 und Vergleich mit ähnlichen Werkzeugen

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

27.10.2026. Review mit `mattpocock-skills:code-review`: Standards und Spec wurden von zwei unabhängigen Reviewern getrennt untersucht. Der Hauptagent ergänzte eine Laufzeitmessung und den Vergleich mit Primärquellen im Internet. Produktcode, Tests und Abhängigkeiten blieben unverändert.

## Umfang und Verifikation

Basis: ursprüngliches `HEAD` `750e9e8f34f9384910ea667c42bc89560abfe1be`; Ziel: aktueller uncommitteter Arbeitsstand einschließlich neuer Tests, Specs und DESIGN.md. Ein `HEAD...HEAD` wäre leer, daher wurde ausdrücklich `git diff HEAD -- <Produkt-/Test-/Dokumentationsdateien>` plus die neuen Dateien geprüft. Keine neuen Commits seit der Basis. Die Anforderungen stehen in den beiden lokalen Specs unter docs/archive/specs; kein Issue-Tracker musste eingerichtet werden.

Erneuter vollständiger Testlauf: **85 PASS, 0 FAIL, Exit 0** über `CHROMIUM_PATH=/usr/bin/chromium npm test`. Syntax- und Diff-Prüfung erfolgreich. Die unten beschriebenen zusätzlichen Probe-Fälle sind in der vorhandenen Suite nicht abgedeckt. Kleine Chromium-Proben bestätigten die Befunde; es wurden keine Korrekturen am Produkt vorgenommen.

Geprüft: Single-File-Userscript, Panel/Toolbar, temporäre Ranges, gespeicherte Keywords, Shortcut/Locale und Observer. Keine vollständige Sicherheitsprüfung, kein echter Userscript-Manager und keine Safari-/Firefox-Laufzeitprüfung. Wettbewerber wurden anhand ihrer Original-Dokumentation bzw. ihres Codes verglichen, nicht installiert oder leistungsmäßig gegeneinander vermessen.

## Standards

Die beiden Befunde betreffen dokumentierte Regeln, keine hypothetischen Stilpräferenzen.

### ST1 — P3: Status bleibt nach Sprachwechsel in alter Sprache

Ort: `userscript/slim-search-highlight.user.js:1332,1356`; Regel: `DESIGN.md:42`, eigene UI-Texte folgen der aktiven Sprache.

Reproduktion: Keyword löschen, Rückgängig betätigen, Deutsch auf Englisch umstellen. Im englischen Panel bleibt „Suchbegriff wiederhergestellt.“ stehen. Die Sprachumschaltung speichert und restauriert einen bereits übersetzten Text statt seiner Bedeutung.

Empfehlung: Status als `{ key, args }` halten und bei Darstellung übersetzen. Regression für Löschen/Rückgängig → Sprachwechsel ergänzen.

### ST2 — P3: Mobile Toolbar unterschreitet die eigene Control-Größe

Ort: Skript:170–172,291–295; Regel: `DESIGN.md:69`, mindestens 44px Höhe für schmale Buttons.

Gemessen bei 320×568: Trigger 40px, Websuche 40px; die schmale Media-Regel erfasst nur Panel-Controls. Toolbar in dieselbe Mindesthöhenregel aufnehmen. Das ist eine Abweichung vom eigenen Designvertrag; aus 40px allein folgt kein pauschaler WCAG-AA-Verstoß.

Kein eigener handlungsrelevanter Fowler-Smell-Befund. Eine einzelne installierbare Datei ist nach CONTRIBUTING.md ausdrücklich beabsichtigt. Eine bessere interne Gliederung kann sinnvoll sein; eine Framework- oder Mehrdatei-Auslieferung wäre kein notwendiger Fix.

**Standards: 2 Befunde, höchste Schwere P3.**

## Spec

Maßgeblich: `docs/archive/specs/2026-10-27-selection-highlights-design.md`.

### SP1 — P2: Die ausgewählte Fundstelle kann selbst fehlen

Anforderung Zeilen 3/5: „always every occurrence“ und „literal … passages, whitespace-normalized, including … inline formatting“.

Ort: Skript:398–405.

Reproduktion: `<p>hello<span hidden>invisible</span>world</p>` plus ein zweites `<p>helloworld</p>`. Der Browser liefert für die erste Auswahl `helloworld`; der Index fügt an der versteckten Stelle einen NUL-Trenner ein. Markiert wird nur die zweite Fundstelle: **1 statt 2**. Ein entsprechender Fehler tritt mit einem Inline-Block auf, weil dessen Display-Wert als künstliche Wortgrenze behandelt wird.

Empfehlung: Suchtext und DOM-Offsets aus konsistenten Regeln für tatsächlich gerenderten Auswahltext ableiten. Versteckte Zeichen auslassen, ohne automatisch ein sichtbares Trennzeichen zu erfinden. Inline-/Inline-Block-Übergänge nicht mit Absatzumbrüchen gleichsetzen. Tests für versteckte Inline-Knoten und Inline-Blocks ergänzen.

### SP2 — P2: Änderungen innerhalb vorhandener Highlights hinterlassen falsche Treffer

Anforderung Zeile 7: „Recompute ranges after relevant DOM changes and persistent highlighting.“

Ort: Skript:1509 und 859–862 (`isOwnNode`).

Reproduktion: Dauerhaftes Keyword und temporäre Seitenmarkierung für `Solarenergie` anlegen. Den Textknoten innerhalb einer existierenden `.slim-hl` auf `Windkraft` ändern. Auch nach 800ms bleiben **2 Ranges und `1 / 2`**, obwohl der zweite Range leer geworden ist. Der Observer verwirft Änderungen innerhalb aller als eigen klassifizierten Markierungen, einschließlich späterer Änderungen durch die Host-Seite.

Empfehlung: Eigene Schreibvorgänge gezielt von späteren Host-Mutationen unterscheiden. Relevante externe Text-/Entfernungsänderungen müssen den temporären Index invalidieren, ohne die bereits behobene Schleife durch eigene Textsplits wieder einzuführen. Leere oder abgetrennte Ranges vor Zählung/Navigation aussortieren.

### SP3 — P2: Fokussiertes Auswahlmenü kann veraltete Texte weiterverwenden

Anforderung Zeile 9: bei „stale selection“ ausblenden.

Ort: Skript:575 sowie 563–567.

Reproduktion: Absatz auswählen, Trigger fokussieren/aufklappen, ausgewählten Absatz aus dem DOM entfernen. Nach 500ms bleibt die Toolbar sichtbar. Ihre Webaktion verwendet den inzwischen entfernten Text. Der Fokus-Sonderfall überspringt Gültigkeitsprüfungen; die Aktionshandler vertrauen dem Snapshot.

Empfehlung: Text-Snapshot während legitimer Toolbar-Interaktion erhalten, aber DOM-Verbindung und Inhalt des zugehörigen Ranges vor Anzeige und jeder Aktion prüfen. Bei entferntem/geändertem Ursprung schließen und Fokus sinnvoll zurückgeben. Der beobachtete Webaufruf bleibt eine explizite Nutzeraktion; es wurde kein automatisches Versenden ohne Klick festgestellt.

**Spec: 3 Befunde, höchste Schwere P2.**

## Zusätzliche Performance-Messung

### PF1 — P2: Endpunktberechnung skaliert bei langen Textknoten ungünstig

Ort: Skript:415–424 und 441–445. Für jeden Treffer werden zwei Endpunkte berechnet. `point()` scannt dafür den Rohtext des gefundenen Segments wieder vom Anfang. Viele Treffer in einem langen Knoten erzeugen dadurch quadratische Arbeit; die gesamte neue Seiten-Suche läuft synchron im Shortcut-/Klick-Handler.

Chromium auf dieser Maschine, Auswahl `alpha`, jeweils ein zusätzlicher Ausgangstreffer. Einzelmessungen, kein allgemeiner Benchmark:

| Wiederholungen im Zieltext | Struktur | Synchroner Aktionspfad | Korrekte Gesamtzahl |
|---:|---|---:|---:|
| 500 | ein Textknoten | 83 ms | 501 |
| 1.000 | ein Textknoten | 241 ms | 1.001 |
| 2.000 | ein Textknoten | 870 ms | 2.001 |
| 2.000 | getrennte Absätze | 75 ms | 2.001 |

Empfehlung: pro Segment normalisierte Offsets einmalig auf Rohtext-Offsets abbilden oder die sortierten Treffer in einem Vorwärtsdurchlauf abarbeiten. Erst danach komplexere Cache-/Worker-Lösungen abwägen. Längere Indexläufe wie den vorhandenen permanenten Highlighter in abbrechbare Arbeitsscheiben aufteilen. Performance-Regression explizit mit vielen Treffern in einem langen Textknoten testen; die vorhandenen Performance-Tests decken überwiegend den alten Keyword-Pfad ab.

Weitere Optimierungskandidaten, noch ohne separate Messung: stabile Textsegmente bei DOM-Updates wiederverwenden, die mehrfachen `pageMatches.filter()`-Zählungen durch einen einmaligen Count-Index ersetzen, Positionsmarken bei sehr hohen Trefferzahlen aggregieren. Diese Punkte sind Kandidaten für Profiling, keine bereits bewiesenen neuen Defekte.

## Vergleich mit Originalquellen aus dem Internet

| Werkzeug / Quelle | Belegtes Prinzip | Übertragbarer Nutzen |
|---|---|---|
| [mark.js](https://github.com/julmot/mark.js/blob/master/src/lib/mark.js) | Suchbibliothek mit `acrossElements`, `separateWordSearch`, Ausschlüssen, Filter-/Fertig-Callbacks; eigene Range-/DOM-Zuordnung | Explizite Trennung von Suchmodus, Indexierung und Darstellung. Eure zusammenhängende Passage als Standard beibehalten; Whole-word/Genauigkeit optional ergänzen. Kein Grund für einen pauschalen Bibliothekswechsel. |
| [web-highlighter](https://github.com/alienzhou/web-highlighter#how-it-works) | Auswahl zu serialisierbarem HighlightSource; Wiederherstellung über DOM-Pfade und Text-Offsets; dokumentierte Grenzen bei geänderter DOM-Struktur und Tabellen | Falls spätere Persistenz gewünscht ist: ein eigenes Seitenmarkierungsformat und robustes Wiederfinden einführen. Nicht die globalen Keywords zweckentfremden. |
| [Hypothesis client](https://github.com/hypothesis/client) und [Anchoring](https://github.com/hypothesis/client/blob/main/src/annotator/anchoring/html.ts) | Browser-Anmerkungen; mehrere Ankerstrategien mit Range, Textposition und Textzitat; gespeichertes Zitat wird bei Wiederherstellung geprüft | Für optional gespeicherte Fundstellen Kontext/Zitat plus Position kombinieren und fehlgeschlagene Wiederherstellung sichtbar machen. Ein vollständiger Account-/Server-Unterbau wäre für dieses lokale Userscript überdimensioniert. |
| [MDN: CSS Custom Highlight API](https://github.com/mdn/content/blob/main/files/en-us/web/api/css_custom_highlight_api/index.md) | Native Gestaltung beliebiger Ranges ohne DOM-Strukturänderung; mehrere Highlight-Gruppen möglich | Bestätigt die grundsätzliche Architekturentscheidung für temporäre Passagen. Unterschiedliche Farben pro Seitenpassage sind möglich, ohne Wrapper einzuführen. |
| [MDN: Text fragments](https://github.com/mdn/content/blob/main/files/en-us/web/uri/reference/fragment/text_fragments/index.md) | Textstellen über `#:~:text=` teilen, optional mit Präfix/Suffix; Browser- und Inhaltsänderungsgrenzen dokumentiert | Bewusste Aktion „Link zu dieser Fundstelle kopieren“. Bei fehlender Unterstützung auf normalen Seitenlink/Zitat zurückfallen. |

Abruf: 27.10.2026, Primärquellen auf GitHub bzw. raw.githubusercontent.com. markjs.io, highlightthis.net, web.hypothes.is und developer.mozilla.org waren direkt durch den Netzwerkproxy mit 403 gesperrt. Für mark.js, Hypothesis und MDN wurden stattdessen deren Original-Repositories gelesen. Über Highlight This werden mangels gelesener Primärquelle keine Produktbehauptungen gemacht. Einige vermutete Dokumentationspfade lieferten 404; sie sind kein Beleg. Abrufstatus steht in `code-review-evidence/sources.json`.

## Sinnvolle Erweiterungen nach den Korrekturen

1. **Farbe je Seitenpassage und Undo für Seitenmarkierungen.** Verbessert den täglichen Leseablauf; bleibt lokal und temporär. Vorhandene permanente Keyword-Farben/Undo sind als Verhaltensvorbild nutzbar.
2. **„Zitat + URL kopieren“ / Textfragment-Link.** Auswahl als zitierfähigen Ausschnitt übernehmen, optional Markdown-Export. Kein ungefragter Webaufruf oder automatisches Teilen.
3. **Optionale seitenbezogene Speicherung.** Ausdrücklich „Für diese Seite merken“, mit späterem Löschen/Export. Standard bleibt temporär wie vereinbart; keine Vermischung mit dauerhaften globalen Keywords. Verankerung mit Zitat/Kontext statt bloßer alter Bildschirmposition.
4. **Suchbereich und Genauigkeit.** Optional „nur Artikel“ und „ganzes Wort“; die bestätigte Suche nach der vollständigen ausgewählten Passage bleibt Standard. Schatten-DOM und Frames wären ein eigener, größerer Ausbau mit klaren technischen Grenzen, kein kleiner Nebenfix.

Erst SP1–SP3 und PF1 korrigieren, dann gezielt ausgewählte Erweiterungen bauen. Ein Frameworkwechsel, Cloud-Sync oder neue Accounts sind für den aktuellen Zweck keine Voraussetzung.

## Ergebnis

Standards: **2 Befunde, P3** (Locale-/Control-Konsistenz). Spec: **3 Befunde, P2** (Trefferabdeckung, Mutation, stale Toolbar). Separat: **1 gemessener P2-Performance-Befund**. Die 85 Tests bestehen, decken diese neuen Randfälle aber nicht ab. Produktcode unverändert.
