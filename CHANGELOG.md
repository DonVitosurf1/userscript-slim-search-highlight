# Changelog

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
