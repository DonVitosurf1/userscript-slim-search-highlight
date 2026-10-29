# Changelog

## 4.5.1

- Neue Seitenmarkierungen erhalten automatisch unterschiedliche, kräftige Farben. Bereits belegte Farben der Seite und ihrer aktiven Keywords werden übersprungen; nach der Startpalette folgen zusätzliche helle, gesättigte Farben.
- Alle Vorkommen derselben Passage behalten ihre Farbe. Manuelle Farbwahl, gespeicherte Farben und Rückgängig bleiben erhalten; die Textfarbe wird für lesbaren Kontrast automatisch gewählt.

## 4.5.0

### Sicherheitskorrekturen
- Private UI-Referenzen und geschlossener Shadow-DOM-Bereich im isolierten Userscript-Kontext; künstliche Aktivierungen und globale Bearbeitungs-Shortcuts werden zurückgewiesen. Keywords anderer Domains werden nicht in die aktuelle Webseite gerendert, der private Suchverlauf ist nur im Userscript-Manager-Menü verfügbar.
- Keyword-Änderungen benötigen ausdrücklich Speichern oder Enter. Native Texteingabe mit anschließendem Fokuswechsel schreibt nichts dauerhaft. Markierungen verweisen privat auf das ursprüngliche gespeicherte Keyword; manipulierte DOM-Daten und automatische Treffer können keine fremden Profile löschen.
- Exporte laufen über `GM_download`, ohne Daten- oder Blob-Links im Webseiten-DOM. Das Skript fordert dafür die Download-Berechtigung an; bei fehlender Unterstützung gibt es eine Fehlermeldung statt eines unsicheren Fallbacks.
- Automatische Such-/URL-Texte sind immer wörtlich. Unicode-Leertreffer bewegen den Index um vollständige Codepunkte weiter. Explizite Regexe verwenden eine konservative begrenzte Teilmenge und überspringen Textknoten über 4096 UTF-16-Einheiten.
- Domainfilter prüfen Gleichheit und echte Subdomains; Suchmaschinen werden über eine explizite Domainliste erkannt.

### Repository
- Actions auf geprüfte Commit-SHAs gepinnt, Checkout-Zugangsdaten nicht persistiert. Secret-Scan und CodeQL als zusätzliche CI-Prüfungen, lokale Secret-Prüfung und Ausschlüsse für Zugangsdaten.
- Vollständiger MIT-Hinweis in der Einzeldatei, historisches Archiv aus künftigen Quellarchiven ausgeschlossen. Sicherheitsmodell, Meldeweg und konkrete GitHub-Schutzkonfiguration dokumentiert; serverseitige Aktivierung muss separat bestätigt werden.

## 4.4.2

### Kompakteres Panel
- Standardbreite 320 statt 360 px; das zugeklappte Panel bleibt höchstens 560 px bzw. 80 % des sichtbaren Viewports hoch. Geöffnete Bereiche und manuelles Kopieren können den verfügbaren Platz nutzen.
- Navigation und Trefferbereich zusammengefasst, Merken/Vergessen sowie Löschen/Rückgängig kürzer beschriftet. Seitenaktionen stehen nebeneinander.
- Suchoptionen, Keywords, Trefferdetails, Einstellungen und Hilfe bilden einen kompakten zweispaltigen Bereich. Geöffnete Abschnitte nutzen die volle Breite; Erklärungen und Shortcut-Hinweise stehen unter „Hilfe & Shortcuts“.
- Unveränderte Schriftgrößen und mindestens 44 px hohe Bedienelemente auf schmalen Bildschirmen. Die neuen Layouts sind in beiden Farbschemata geprüft.

## 4.4.1

### Suchwörter auf Ergebnisseiten
- Google-/Suchmaschinen-Suchwörter werden beim Öffnen eines Ergebnisses frisch erfasst, statt nur beim Laden der Suchseite. Das behebt veraltete Begriffe nach dynamischen Suchwechseln und einen während des Lesens abgelaufenen Zwischenspeicher.
- Normale, Strg-/Cmd-, Mittel- und Kontextmenü-Klicks bleiben nativ. Tief verschachtelte Ergebnislinks und Google-`/url`-Weiterleitungen werden erkannt; kein Suchtext wird an Ergebnis-URLs angehängt.
- Zielbezogene Übergaben funktionieren auch ohne vollständigen Referrer. Bis zu zwölf Ziel-URLs bleiben zehn Minuten gültig; verschiedene Such-Tabs überschreiben nicht mehr pauschal alle Zielseiten.
- „Automatisch von Suche übernehmen“ unterbindet nun auch das automatische Speichern neuer Suchkontexte. Leere Suchen übernehmen keine alten Wörter; Speicherfehler brechen weder Navigation noch Anwendungsstart ab.
- Umsetzung nach Vergleich mit SearchJumpers Originalquellen; Grenzen und Unterschiede sind unter `docs/research/` dokumentiert.

## 4.4.0

### Darstellung
- Helles und dunkles Farbschema in den Einstellungen. Panel, Auswahlaktionen und native Formularfelder wechseln gemeinsam; Fokus, Hinweistexte und Fehlerfarben bleiben kontrastreich. Dunkel bleibt die Voreinstellung.
- Größerer Öffnen-Button: standardmäßig 56 statt 48 px, per Tastatur und Regler von 44 bis 80 px einstellbar und zurücksetzbar.
- Position in allen vier Bildschirmecken und Randabstand von 8 bis 80 px einstellbar. Sichere Geräte-Ränder werden berücksichtigt.
- Darstellungsoptionen werden lokal gespeichert, gelten sofort und bleiben beim Sprachwechsel erhalten. Fehler beim Speichern setzen die betreffende Änderung zurück.

### Dokumentation und Projektpflege
- Zentraler Dokumentationsindex, Release-Checkliste und aktualisierte deutsche/englische Bedienung. Veraltete Aussagen zu Speicherung, Build und Integration korrigiert.
- Historische Reviews, Nachweise, Spezifikationen und Pläne unter `docs/archive/` gebündelt. Das aktuelle Screenshot-Werkzeug liegt unter `scripts/`; neue Aufnahmen landen in nicht versioniertem `artifacts/`.

## 4.3.0

### Korrekturen und Performance
- Versteckte Inline-Inhalte und Inline-Blocks erzeugen keine erfundenen Textgrenzen mehr. Fremde Änderungen innerhalb bestehender Keyword-Highlights aktualisieren die Seiten-Ranges; veraltete Auswahl-Snapshots werden auch bei fokussierter Toolbar verworfen.
- Statusmeldungen werden nach einem Sprachwechsel neu übersetzt; schmale Toolbar-Controls sind mindestens 44px hoch.
- Normalisierte Text-Offsets werden einmalig abgebildet und schwach gecacht. Größere Suchen laufen in abbrechbaren Schritten; Trefferzahlen verwenden einen Index und die Positionsleiste höchstens 500 gebündelte Ticks.

### Seitenfunktionen
- Eigene Farbe pro Passage und Rückgängig für die letzten 20 Seitenänderungen.
- Ausdrückliches Merken für die aktuelle vollständige URL, getrennt von globalen Keywords. Fehlende gespeicherte Texte werden gemeldet; Vergessen/Entfernen/Leeren aktualisiert lokale Daten. Speicherfehler rollen Änderungen zurück, unbekannte Datenversionen bleiben erhalten.
- Zitat+URL in Klartext/Markdown, Textfragment-Link mit Fallback, manuelles Kopieren bei Zwischenablagenfehlern sowie lokale Markdown-/JSON-Exporte.
- Ganze Wörter und Artikelbereich als optionale Seiten-Suchmodi.

### Projekt
- Geordnete Quellen unter src/, deterministischer dependency-freier Build und unveränderte installierbare Userscript-URL. Generierte Dateien werden auf Aktualität geprüft.
- Browser-Fixtures und benannte Testsuites getrennt; Lockfile wird eingecheckt und CI verwendet npm ci. Neue Bedienungs-, Entwicklungs-, Architektur- und Datenformat-Dokumentation.

## 4.2.0

### Auswahl zuerst
- Text auswählen: Ein schwebendes Textmarker-Symbol bietet **Alle Vorkommen markieren** und eine getrennte, ausdrücklich gewählte Websuche. Kein Abfangen von Rechtsklick oder Doppelklick mehr.
- Seitenmarkierungen sind temporär und von dauerhaften Keywords getrennt. Alle Vorkommen derselben Passage werden auch über Inline-Formatierung und Zeilenumbrüche gefunden. Navigation priorisiert diese Treffer; überlappende Fundstellen werden konsolidiert.
- Standardshortcut **Alt+Shift+H**, in den Einstellungen änderbar, deaktivierbar und zurücksetzbar. Alt+H legt keine dauerhaften Keywords mehr an. Eingabefelder, IME und Tastenwiederholung bleiben geschützt.
- CSS Custom Highlights erhalten die Seitenstruktur. Änderungen an Inhalt und Sichtbarkeit aktualisieren Treffer; URL-Wechsel und Neuladen entfernen die temporäre Auswahl. Aktuelle Browser mit dieser API sind Voraussetzung.
- Dauerhafte Keywords bleiben in einem eigenen aufklappbaren Bereich erhalten. Deutsche und englische Beschriftungen sowie neue Browser-Regressionstests.

## 4.1.0

### Bedienung und Barrierefreiheit
- Suchbegriffe lassen sich direkt oben im Panel mit Enter oder Klick hinzufügen. Erweiterte Optionen, Trefferdetails, Verlauf und Einstellungen sind aufklappbar.
- Benannte Formularfelder, lokalisierte Symbolaktionen, sichtbarer Fokus, Statusmeldungen und tastaturbedienbare Treffer mit Satzkontext. Escape schließt das Panel und setzt den Fokus auf den Öffnen-Button zurück.
- Panel passt in den verfügbaren Viewport, auch nach Größenänderungen und beim Aufklappen. Verschieben per Maus/Touch oder Pfeiltasten im fokussierten Header; Pos1 bzw. Reset-Button stellt die Position zurück.
- Ungültige Regex und doppelte Begriffe werden vor dem Speichern geprüft, mit Hinweisen direkt am Feld. Texteingabe mit IME löst keine vorzeitige Übernahme aus.
- Gelöschte Keywords können rückgängig gemacht und Suchfilter mit einem Button geleert werden. Sprachwechsel erhält Entwürfe, Fokus, Scrollposition und aufgeklappte Bereiche.

### Robustheit
- Highlight-Textfarbe passt sich der gewählten Hintergrundfarbe an. Lokale Design-Tokens und ein begrenzter CSS-Reset schützen das Panel gegen übliche Webseiten-Stile.
- Reduzierte Bewegung wird beim Navigieren berücksichtigt. Abschalten und Domain-Ausschluss stoppen auch bereits geplante Highlight-Durchläufe; die Ausschlussmeldung erscheint ohne Browserdialog im Panel.
- Regressionstests für diese Abläufe ergänzen die vorhandenen Funktions- und Performance-Tests.

## 4.0.3

### Fehlerbehebungen
- Die Einstellung „Automatisch von Suche übernehmen“ wirkt jetzt. Ist sie aus, werden weder gespeicherte Suchbegriffe noch der Referrer der Suchmaschine übernommen. Die Verlaufs-Schaltflächen im Panel und `#hl=` in der URL funktionieren weiterhin.
- Ein umbenanntes Keyword behielt das alte Regex-Kennzeichen und wurde dann falsch ausgewertet. Ob ein Keyword ein Regex ist, ergibt sich jetzt allein aus seinem Text (`/…/flags`).
- Inhalte, die die Seite während eines laufenden Durchlaufs hinzufügt, gehen nicht mehr verloren. Der Beobachter bleibt dauerhaft verbunden; eigene Änderungen werden einzeln erkannt statt den Beobachter abzuschalten.
- Ein „(3)“ am Anfang des Seitentitels, das die Seite selbst setzt, bleibt erhalten. Entfernt wird nur der eigene Trefferzähler.

### Performance
- Die Positionsleiste wird beim Scrollen nicht mehr neu aufgebaut (die Positionen ändern sich dabei nicht), sondern nur bei Größenänderungen der Seite.
- Nach Highlight-Durchläufen werden nur noch die Trefferzahlen der Keyword-Liste aktualisiert. Ein gerade bearbeitetes Eingabefeld geht dabei nicht mehr verloren.

## 4.0.2

### Fehlerbehebungen
- Eine URL wie `#hl=100%` ließ das Skript dauerhaft hängen, weil das Dekodieren des Hashs einen Fehler warf. Außerdem wird der Parameter nur noch am Anfang oder nach `&` erkannt (`#foo&xhl=en` zählt nicht mehr).
- Mehrere Tabs überschreiben sich nicht mehr gegenseitig: Es werden nur noch Werte gespeichert, die der eigene Tab geändert hat (vorher schrieb jede Panel-Aktion alle Einstellungen).
- Alt + ←/→ und Alt + H sowie Klick- und Rechtsklick-Handler gibt es nur noch auf Seiten, auf denen das Skript aktiv ist. Alt + ← bleibt „Zurück“ im Browser, wenn es keine Treffer gibt oder die Seite auf der Blacklist steht.
- Text in `<pre>`/`<code>` verschachtelt, in `<option>` und in bearbeitbaren Feldern (`contenteditable`) wird nicht mehr markiert. Neu hinzugefügter Text in `<style>`/`<script>` bleibt unangetastet.
- Beim Aufteilen eines Textknotens entstehende Reste wurden erneut durchsucht und konnten falsche Treffer erzeugen (z. B. „fix“ in „prefix“). Auch die eigenen Änderungen eines Durchlaufs werden nicht mehr als Seitenänderung gewertet.

## 4.0.1

### Fehlerbehebungen
- Änderungen im Panel (Keyword hinzufügen, löschen, Farbe ändern, Alt + Klick auf ein Highlight) wurden nicht sofort angewendet, weil der Klick als Textauswahl galt. Neuaufbau-Anfragen werden jetzt nachgeholt statt verworfen, auch wenn gerade ein Durchlauf läuft.
- Ganze-Wörter-Suche versteht Umlaute und Sonderzeichen: „Übung“, „über“, „C++“ und „#tag“ werden jetzt gefunden.
- Wurde das Skript deaktiviert gestartet und später eingeschaltet, wurden nachgeladene Inhalte nie markiert.
- „Vorheriges“ übersprang beim ersten Klick den letzten Treffer; beim schnellen Blättern blieben Umrandungen hängen.
- Das Panel-CSS wirkt nur noch innerhalb des Panels und verändert keine Textfelder, Labels oder Buttons der besuchten Seite mehr.

## 4.0

### Achtung beim Update
- Das Skript heißt jetzt **Slim Search Highlight** (ohne „Pro“ und Versionsnummer im Namen). Userscript-Manager erkennen Skripte am Namen: Das alte Skript „Slim Search Highlight Pro v3.10“ bitte deaktivieren oder löschen. Gespeicherte Keywords und Einstellungen werden **nicht** übernommen und müssen einmalig neu angelegt werden. Danach bleibt der Name bei künftigen Updates stabil.

### Neu
- Oberfläche auf Deutsch und Englisch. Die Sprache folgt standardmäßig dem Browser (Deutsch, sonst Englisch) und lässt sich im Panel unter „Einstellungen“ umstellen.
- Das Logo steckt nur noch einmal im Skript (`@icon` verweist auf die Datei im Repo).

## 3.11

### Performance
- Positionsanzeige liest alle Positionen in einem Durchgang und schreibt einmal. Vorher erzwang jeder Treffer ein komplettes Layout (bei ~1800 Treffern 3,5 s, bei 12 000 Treffern nicht mehr nutzbar). Jetzt weit unter einer Sekunde.
- Navigation (Alt + →/←) schaltet nur noch die aktive Markierung um, statt die Leiste neu aufzubauen.
- Der MutationObserver ignoriert die eigenen Änderungen (Positionsleiste, Panel, Markierungen). Vorher löste jede Navigation einen kompletten Neuaufbau der Seite aus.
- Dynamisch nachgeladene Inhalte werden inkrementell markiert, bestehende Markierungen bleiben erhalten.
- Highlighting läuft in Zeitscheiben von ~10 ms pro Frame statt in festen 80-Knoten-Blöcken.
- Beim Entfernen der Markierungen wird jeder Elternknoten nur einmal normalisiert.
- Die Trefferliste im Panel zeigt höchstens 300 Einträge.
- Panel verschieben speichert nur noch beim Loslassen (vorher bei jeder Mausbewegung).

### Fehlerbehebungen
- Mehrere Treffer im selben Textknoten wurden teilweise nicht markiert.
- Überlappende Keywords konnten den Seitentext beschädigen.
- Ein Regex mit leeren Treffern (z. B. `/x*/`) konnte die Seite einfrieren.
- Suchmaschinen werden nur noch am Hostnamen erkannt, nicht an der gesamten URL.
- Regex-Keywords bekommen immer das `g`-Flag.
- Das Panel überschreibt nicht mehr `document.onmousemove`/`onmouseup` der Seite.

### Sonstiges
- Header: `@noframes`, `@updateURL`, `@downloadURL`, `@author`, `@license`, `@homepageURL`, `@supportURL`.
- Neues Logo, automatische Tests (`npm test`) und CI.
