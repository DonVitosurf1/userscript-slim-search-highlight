# Changelog

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
