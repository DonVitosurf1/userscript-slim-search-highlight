# Auswahl zuerst — 4.2.0

> Historischer Stand vom 27.10.2026. Aussagen zu Tests, Dateipfaden und Veröffentlichungen beziehen sich auf den damaligen Arbeitsstand. [Archivhinweise](../README.md).

Die zuletzt bestätigte Vorgabe ist umgesetzt: Text auswählen, schwebendes Textmarker-Symbol öffnen, **Alle Vorkommen markieren** oder **Im Web suchen** wählen. Der erste Button führt immer die kombinierte Aktion aus: ausgewählte Passage und alle weiteren gleichen Vorkommen auf derselben Seite hervorheben. Der Tooltip erklärt den Seitenbezug ausführlicher. Rechtsklick und Doppelklick bleiben beim Browser.

## Verhalten

- Alt+Shift+H löst die Seitenmarkierung direkt aus. In den Einstellungen aufzeichenbar, abschaltbar oder zurücksetzbar. Alt+H speichert keine dauerhaften Keywords mehr.
- Explizite Seitenpassagen werden literal und ohne Beachtung der Groß-/Kleinschreibung gesucht. Leerzeichen und Zeilenumbrüche werden vereinheitlicht; Inline-Formatierung und BR unterbrechen den Treffer nicht. Überlappungen zählen einmal, bei gleichem Beginn wird die längere Passage verwendet.
- Native CSS Custom Highlights/Ranges erhalten die Seitenstruktur. Auswahltexte gelangen weder in die dauerhaften Keywords noch in Suchhistorie oder GM-Storage. Nur die Shortcut-Präferenz wird zusätzlich gespeichert.
- Seitenmarkierungen haben einen eigenen primären Panelbereich mit Einzelentfernung und Löschen aller Markierungen. Navigation, Kontexttreffer, Positionsleiste und Zähler beziehen sich auf die Seitenpassagen, solange solche vorhanden sind; sonst auf gespeicherte/automatische Keywords.
- Dauerhafte Keywords bleiben in einem eigenen aufklappbaren Bereich verfügbar.
- Text-/Sichtbarkeitsänderungen aktualisieren Treffer. Versteckter Text, Code und Eingabefelder einschließlich plaintext-only werden ausgelassen. URL-Wechsel (auch History API) und Neuladen löschen die temporären Markierungen. Der URL-Identitätsvergleich läuft nur solange temporärer Zustand existiert; keine Manipulation der Host-History-Methoden.
- Hover-/Klickaktionen bewahren einen Auswahl-Snapshot; Tastatur, Escape und Fokus-Rückkehr sind berücksichtigt. Der Shortcut greift nicht in Eingabefeldern, bei IME oder Wiederholung ein. Nur die bewusste Webaktion sendet den Text an die ausgewählte Suchmaschine.

## Verifikation

- **85 Tests bestanden, 0 fehlgeschlagen, Exit 0**, vollständiger Lauf: `CHROMIUM_PATH=/usr/bin/chromium npm test`. Davon 22 neue Auswahl-Regressionen, ergänzt zu den bestehenden 63 Tests. Pro Test werden dessen Browser-Kontexte geschlossen.
- `node --check userscript/slim-search-highlight.user.js` und `git diff --check`: erfolgreich.
- TDD: neue fehlende Auswahlfunktionen zunächst mit fehlschlagenden Tests belegt. Unabhängige Prüfung reproduzierte vier Randfälle (BR, Sichtbarkeit, History API, plaintext-only), die anschließend durch neue RED→GREEN-Tests und unabhängige Nachprüfung abgesichert wurden.
- Ein neuer charakterdatenbasierter Observer erfasste zunächst auch eigene Textsplits, was einen unnötigen weiteren Durchlauf erzeugte und den bestehenden Scroll-Test verletzte. Ein isolierter Regressionstest reproduzierte die Ursache. Eigene Splits werden nun gefiltert; der neue Test und der vollständige bestehende Testlauf bestehen.
- Browser-/Screenshotprüfung in Chromium bei 1280×900 und 390×844: Symbol, aufgeklappte Aktionen, zwei tatsächliche markierte Textbereiche, Seitenpanel, standardmäßig geschlossene Keyword-Verwaltung und englische Einstellungen. Toolbar bleibt innerhalb des Viewports. Belege und Capture-Helfer: `selection-evidence/`.
- READMEs beider Sprachen, CHANGELOG.md und DESIGN.md sind aktualisiert. Vorhandene Änderungen und ältere Reviewbelege wurden erhalten. Keine Veröffentlichung oder Git-Push.

## Grenzen

Seitenmarkierungen benötigen CSS Custom Highlights. Ohne diese Browserfunktion ist die Markieraktion mit einer Erklärung deaktiviert; explizite Websuche und bisherige Keyword-Funktionen bleiben verfügbar. Geprüft wurde Chromium mit nachgebildeten GM-Funktionen. Echte Tampermonkey-/Violentmonkey-Installation, Screenreader, andere Browser und reale Touch-/Systemshortcut-Konflikte bleiben manuelle Anschlussprüfungen. Kein Shortcut ist systemübergreifend garantiert konfliktfrei.
