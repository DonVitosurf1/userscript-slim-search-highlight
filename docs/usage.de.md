# Bedienung

[Dokumentationsübersicht](README.md) · [English](usage.en.md)

## Auswählen und suchen

Wort, Satz oder Absatz auf der Webseite auswählen. Das kleine Textmarker-Symbol erscheint neben der Auswahl; darüberfahren oder anklicken öffnet **Alle Vorkommen markieren** und **Im Web suchen**. Die erste Aktion markiert immer die gewählte Passage und ihre weiteren Vorkommen auf derselben Seite. Websuche und Teilen werden nie automatisch ausgelöst.

Die Suche ist wörtlich, ohne Beachtung der Groß-/Kleinschreibung, mit vereinheitlichten Leerzeichen und Zeilenumbrüchen. Inline-Formatierung unterbricht sie nicht. Unsichtbarer Text zählt nicht als sichtbarer Wortabstand. Überlappende Fundstellen zählen einmal; bei gleichem Beginn gewinnt die längere Passage. Code, Eingabefelder und eigene Bedienelemente werden ausgelassen. Frames und Shadow-DOM-Inhalte werden nicht durchsucht.

## Farben, Löschen und Rückgängig

Unter **Auf dieser Seite** hat jede Passage eine Farbe und Trefferzahl. Entfernen löscht die Passage und alle zugehörigen Markierungen; **Seitenmarkierungen löschen** leert die Liste. **Seitenänderung rückgängig** stellt den vorherigen Zustand einschließlich Farbe und Speicherstatus wieder her. Die letzten 20 Seitenzustände bleiben während der Sitzung erhalten; Navigation oder Neuladen beendet diesen Verlauf.

Solange Seitenpassagen existieren, steuern Vor/Zurück und **Alt+← / →** deren Treffer. Andernfalls werden die gespeicherten/automatischen Keyword-Treffer navigiert. Die Positionsleiste bündelt bei vielen Treffern bis zu 500 Markierungen; die Trefferdetails zeigen bis zu 300 Einträge. Alle tatsächlichen Treffer bleiben über die Navigation erreichbar.

## Für diese Seite merken

Markierungen sind zunächst temporär. **Für diese Seite merken** speichert die jeweilige Passage mit Farbe und Textkontext lokal im Userscript-Manager. Bei einem Wiederbesuch wird genau dieser Text erneut gesucht. Wenn er fehlt, steht **Nicht gefunden** an der Passage; es wird kein ähnlicher Text automatisch eingesetzt.

**Gespeicherte Passage vergessen** entfernt den gespeicherten Eintrag, lässt die aktuelle temporäre Markierung aber stehen. Entfernen/Leeren aktualisiert ebenfalls gespeicherte Einträge; Rückgängig kann das in derselben Sitzung zurücknehmen. Speicherung erfolgt pro vollständiger URL einschließlich Query und Fragment. Zwei Tabs mit derselben URL verwenden beim Speichern den zuletzt geschriebenen Zustand.

Bei einem Speicherfehler bleibt der vorherige Zustand erhalten und die Anwendung meldet den Fehler. Unbekannte Datenversionen werden nicht überschrieben. **Gespeicherte Seiten exportieren (JSON)** erhält die Daten lokal; ein Datei-Import wird aktuell nicht angeboten.

## Suchoptionen

- **Nur ganze Wörter suchen** verhindert Teiltreffer wie „art“ innerhalb von „start“; Buchstaben und Zahlen einschließlich Unicode werden berücksichtigt.
- **Nur Artikel** begrenzt den Bereich auf `article`, ersatzweise `main` oder `[role=main]`. Fehlt ein solcher Bereich, nennt die Anwendung den Grund und erweitert die Suche nicht still auf die gesamte Seite.

Die Optionen gelten für die aktuellen Seitenmarkierungen und werden mit ausdrücklich gespeicherten Passagen für diese URL übernommen.

## Kopieren und Export

Im Auswahlmenü **Kopieren / Export** öffnen:

- **Zitat + URL kopieren** verwendet das in den Einstellungen gewählte Format Klartext oder Markdown.
- **Link zur Textstelle kopieren** erzeugt bei unterstützten HTTP(S)-Seiten einen `#:~:text=`-Link. Sonst wird der normale Seitenlink kopiert und der Grund angezeigt. Bei mehrfach vorkommendem Text kann der Browser zum ersten passenden Vorkommen springen. Geänderter Text, blockübergreifende Auswahlen oder fehlende Browserunterstützung können die Textverknüpfung ungültig machen.

Wenn direkter Zwischenablagenzugriff scheitert, erscheint ein beschriftetes Textfeld zum manuellen Kopieren. Einstellungen bieten außerdem Markdown-Export der aktuellen Passagen und JSON-Export aller gespeicherten Seiten. Diese Dateien enthalten ausgewählten Text und vollständige URLs; sie werden nur auf ausdrückliche Aktion lokal erzeugt, nicht hochgeladen.

## Darstellung und Öffnen-Button

Unter **Einstellungen → Darstellung** stehen **Hell** und **Dunkel** zur Wahl. Panel, Auswahlaktionen und Formularfelder wechseln sofort gemeinsam. Dunkel bleibt die Voreinstellung; Webseitenfarben und die gewählten Markierungsfarben werden nicht verändert.

Der Öffnen-Button ist standardmäßig **56 px** groß. **Größe des Öffnen-Buttons** lässt sich von 44 bis 80 px verändern; **Größe zurücksetzen** stellt 56 px wieder her. **Position des Öffnen-Buttons** bietet die vier Bildschirmecken. **Abstand zum Rand** reicht von 8 bis 80 px und gilt für beide angrenzenden Ränder. Sichere Bildschirmränder, etwa an Geräten mit Aussparungen, haben Vorrang.

Die Regler zeigen den aktuellen Pixelwert und lassen sich mit den Pfeiltasten in 4-px-Schritten bedienen. Änderungen gelten sofort und werden lokal für weitere Seitenaufrufe gespeichert. Bei einem Speicherfehler wird die vorherige Einstellung wiederhergestellt. Der Größen-Reset verändert weder Position noch Farbschema.

![Helles Farbschema mit Seitenmarkierungen](../assets/screenshot-light.png)

## Tastatur und Panel

**Alt+Shift+H** führt direkt „Alle Vorkommen markieren“ aus. Unter Einstellungen ist der Shortcut aufzeichenbar, abschaltbar und zurücksetzbar. Alt, Strg oder Meta plus Buchstabe/Ziffer; Shift ist optional. Escape bricht die Aufzeichnung ab. Betriebssystem-/Browserkonflikte sind nicht grundsätzlich vermeidbar.

In Eingabefeldern, bei IME und Tastenwiederholung greift der Auswahl-Shortcut nicht. Rechtsklick und Doppelklick bleiben nativ; Alt+H speichert keine Keywords mehr.

Escape schließt Auswahlaktionen oder Panel und gibt den Fokus zurück. Der Panelkopf ist per Tab und Pfeiltasten verschiebbar; Shift vergrößert die Schritte, Pos1 bzw. Reset setzt die Position zurück. Maus/Touch-Ziehen bleibt möglich. Trefferdetails unterstützen Pfeil hoch/runter, Pos1/Ende und Enter. Reduzierte Bewegung wird respektiert.

## Dauerhafte Keywords und Grenzen

**Dauerhafte Keywords** bleibt ein eigener aufklappbarer Bereich für seitenübergreifende Begriffe, Regex, Farben und Domain-Einschränkungen. Neue Begriffe mit Enter oder Hinzufügen speichern. Fehler stehen am Feld; die Eingabe bleibt erhalten. Das Ausschließen einer Domain über das Userscript-Menü deaktiviert dort Highlights.

Seitenmarkierungen brauchen CSS Custom Highlights. Browser-/Manager-Tests auf echten Geräten, Screenreader und mobile Bildschirmtastaturen ergänzen die automatisierte Chromium-Prüfung; es wird keine vollständige WCAG-Zertifizierung behauptet.
