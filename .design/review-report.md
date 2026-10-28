# Review: Slim Search Highlight 4.0.3

Datum: 27.10.2026. Gegenstand: `userscript/slim-search-highlight.user.js`, schwebendes Panel, Keyword-Verwaltung und Navigation. Bericht ohne Änderungen am Produktcode.

## Methode und Grenzen

Design Partner Review, Impeccable Technical Audit und Frontend Design Premium als Prüfraster. Kein formaler Impeccable-`critique`-Lauf mit unabhängigen Assessments. Prüfung in Chromium 154 über Playwright 1.64.1; synthetische deutsche Leseseite mit nachgebildeten GM-Funktionen entsprechend dem vorhandenen Testansatz. Viewports: 1280×900, 390×844, 320×568. Zusätzlich leere Liste, kein Suchergebnis, ungültiger Regex, Duplikat, Sprachwechsel, gespeicherte Position außerhalb des Viewports, kollidierende Host-CSS und reduzierte Bewegung.

Screenshots und Messungen unter [evidence](evidence/). Quellreferenzen gelten für den unveränderten Stand dieses Reviews. Kein neues DESIGN.md: rein prüfender Auftrag; kein neues Gestaltungssystem beschlossen.

## Einschätzung

Ein nützliches, schlankes Recherchewerkzeug mit nachvollziehbarer Farbcodierung und guter funktionaler Basis. Den größten Nutzen bringen ein erreichbares Panel, zugängliche Bedienelemente und eine Hierarchie, die neue Keywords vor Verwaltung und Einstellungen stellt.

Die dunkle Werkzeugpalette und das Textmarker-Gelb passen zur Aufgabe. Eine neue Schrift, zusätzliche Dekoration oder ein kompletter visueller Neustart sind derzeit weniger wertvoll als die Behebung der bestätigten Bedienprobleme.

## Was bleiben sollte

- Eigene Farben pro Begriff, Trefferzahlen und Positionsanzeige verbinden Verwaltung mit Fundstellen.
- Navigation über Alt+Pfeil und das Übernehmen markierten Textes reduzieren Bedienaufwand.
- Deutsche und englische Texte sowie eigene Meldungen für leere Listen und Suchergebnisse sind bereits vorhanden.
- Inkrementelle DOM-Verarbeitung, gebündelte Nachverarbeitung und auf 300 Einträge begrenzte Trefferliste sind sinnvolle Optimierungen. Alle 40 vorhandenen Tests bestehen auch in diesem Review.
- Keine Produktionsabhängigkeiten und kein Framework für diese kompakte Oberfläche nötig.

## Technische Scorecard

Orientierende Bewertung von 0 bis 4, keine Konformitätszertifizierung.

| Dimension | Wert | Begründung |
|---|---:|---|
| Barrierefreiheit | 1/4 | Unbenannte Felder, mausgebundene Trefferliste und frei wählbare unlesbare Highlight-Farben |
| Performance | 3/4 | Vorhandene Performance-Tests bestehen, inkrementelle Verarbeitung und Listenlimit; kein umfassendes Profiling |
| Responsive Darstellung | 1/4 | 320px-Viewport schneidet Panel ab, gespeicherte Position kann es vollständig verstecken |
| Theming / Tokens | 1/4 | Kohärente dunkle Palette, aber feste verstreute Werte und keine kontrastsichere Highlight-Farbwahl |
| Implementierungskonsistenz | 2/4 | Kompaktes Werkzeug mit sinnvollen Mustern, jedoch Host-CSS-Einfluss und uneinheitliche Fehler-/Fokusbehandlung |
| Gesamt | 8/20 | Größere Schwächen bei Erreichbarkeit und Zugänglichkeit |

Der Wert priorisiert technische Robustheit. Ein heller Modus ist optional; dessen Abwesenheit allein ist kein Defekt.

## Bestätigte Befunde

HIGH entspricht P1, MEDIUM P2, LOW P3. Keine P0-Ausfälle im geprüften Desktop-Hauptablauf.

| ID | Schwere | Bereich / Ort | Nachweis und Verhalten | Konkrete Korrektur | Nutzen |
|---|---|---|---|---|---|
| R1 | HIGH / P1 | Responsive; Skript:104–128, 663–668, 718–735 | Bei 320×568 liegt das Panel von x=20 bis 340 und y=80 bis 745. Bei gespeicherter Position x=900/y=650 auf 390×844 ist es vollständig seitlich außerhalb. Kein Begrenzen an Viewport/Resize. | Panelbreite auf verfügbare Breite begrenzen; Höhe aus verfügbarem Viewport ableiten; gespeicherte Position beim Öffnen und Resize begrenzen; Position zurücksetzen anbieten. Pointer Events für Touch und tastaturbedienbare Positionierung/Andocken. | Alle Aktionen bleiben nach Fensterwechsel und auf schmalen Ansichten erreichbar. |
| R2 | HIGH / P1 | Tastatur/Fokus; Skript:634–651, 737–748, 883ff | Treffer sind DIVs mit onclick und tabIndex=-1; keine direkte Tastaturauswahl. Beim Öffnen bleibt Fokus auf dem Toggle; beim Schließen wurde Fokus auf dem anschließend verborgenen Schließen-Button beobachtet. Zähler ohne Live-Region. | Treffer als Buttons mit Kontext, für lange Listen begrenztes Tastaturnavigationsmodell; benannte nichtmodale Region; sinnvoller Fokus beim Öffnen und Rückkehr zum Toggle beim Schließen; dezente Statusansage. | Tastatur- und Screenreader-Nutzer können Fundstellen gezielt wählen und bleiben orientiert. WCAG 2.1.1, 2.4.3, 4.1.3 prüfen. |
| R3 | HIGH / P1 | Formulare/Namen; Skript:674–713, 836–841 | Beide Selects, vorhandene Keyword-Textfelder und neue Farbauswahl haben keinen zugänglichen Namen. Symbolbuttons erscheinen im Accessibility-Snapshot als „×“, „−“, „◀“, „▶“; title ersetzt den Namen hier nicht. Neue Textfelder verlassen sich auf Placeholder. | Sichtbare label/for-Zuordnung; lokalisierte aria-labels für Symbolaktionen; Bearbeiten/Löschen/Farbwahl um Keyword-Namen ergänzen; Fokuszustände für alle Controls prüfen. | Einstellungen und ähnliche Aktionen werden eindeutig. WCAG 1.3.1, 3.3.2, 4.1.2. |
| R4 | HIGH / P1 | Kontrast; Skript:431–434 | Markierung erzwingt schwarzen Text. Frei gewähltes #000000 erzeugt rechnerisch und im Browser schwarzen Text auf schwarzem Grund: 1:1. | Für jede Highlight-Farbe passende schwarze oder weiße Textfarbe aus Kontrastberechnung wählen; Auswahl direkt im Kontext zeigen. | Eigene Farben zerstören die Lesbarkeit nicht. Ziel für normalen Text mindestens 4,5:1, WCAG 1.4.3. |
| R5 | MEDIUM / P2 | Hierarchie; Skript:678–714 | Auf Desktop und 390px mit drei Keywords ist „Hinzufügen“ initial unterhalb der sichtbaren Panel-Scrollfläche. Trefferliste zeigt mehrfach nur denselben Begriff, ohne Satzkontext; Keywordsuche steht weit vor dem Eingeben neuer Begriffe. | Eingabe mit Hinzufügen direkt unter Trefferstatus und Navigation; bestehende Keywords darunter. Trefferdetails und seltene Einstellungen aufklappbar. Treffer mit kurzem Satzkontext statt Wortwiederholung. | Häufigste Aktion ist sofort sichtbar, Fundstellen sind unterscheidbar. |
| R6 | MEDIUM / P2 | Eingabe/Fehler; Skript:755–774, 342–360 | Enter im neuen Keyword-Feld fügt nichts hinzu, Klick funktioniert. Duplikat öffnet Browser-alert. Ungültiger Regex wird gespeichert und Eingabe geleert, Fehler erscheint separat ohne Feldbezug oder Live-Ansage. | Gemeinsamer Submit für Button und Enter, IME-sicher. Vor Speichern validieren; Wert behalten, Inline-Fehler mit Korrekturhinweis und aria-describedby/aria-invalid. Duplikat inline melden; bestehendes Keyword zeigen. | Weniger Unterbrechungen, klare Korrektur und verlässliche Eingabe. |
| R7 | MEDIUM / P2 | Lokalisierung/Entwurf; Skript:797–804 | Nach Sprachwechsel verschwindet der eingegebene Entwurf „Entwurf behalten“; Fokus landet auf BODY. Panel wird entfernt und neu erzeugt. | Texte gezielt aktualisieren oder flüchtige Formwerte, Fokus und Scrollposition vor Neuaufbau sichern und wiederherstellen. | Sprachwechsel verliert keine laufende Arbeit. |
| R8 | MEDIUM / P2 | Einbettung/Host-CSS; Skript:104–195 | Mit gewöhnlicher Host-Regel button,input{font-family:serif;font-size:24px;padding:20px;box-sizing:border-box} wächst das Panel von 341 auf 440px; Eingabeschrift ändert sich, Farbfelder werden visuell unbrauchbar. | Zunächst eigener Reset und vollständige Control-Tokens unter dem Panel-Root; Shadow DOM als weitergehende Option abwägen und mit GM_addStyle sowie Navigation testen. Keine globale Host-Seiten-Rücksetzung. | Gleichbleibende Bedienung auf unterschiedlichen Webseiten. |
| R9 | MEDIUM / P2 | Bewegung; Skript:607–618 | Auch unter emuliertem prefers-reduced-motion:reduce wird scrollIntoView mit behavior:smooth aufgerufen. | Bei reduzierter Bewegung sofortiges Scrollen wählen, Fokus-/Aktivzustand sichtbar erhalten; übrige Hover-Übergänge gezielt anpassen. | Reduziert unnötige Bewegung beim häufigen Navigieren. Keine pauschale AA-Verletzung aus diesem Einzelbefund abgeleitet. |
| R10 | LOW / P3 | Visuelle Konsistenz; Skript:104–223 | Feste Farben, Größen und Abstände im Styleblock; einige Controls erhalten eigene Fokusregeln, andere Browser-/Host-Darstellung. Nichtleere Keywordsuche hat keinen expliziten Löschen-Button. | Kleine lokale Tokens für Oberfläche/Text/Trennlinie/Aktion/Fokus und Abstände; einheitliche Control-Zustände; Suchfeld mit lokalisiertem Löschen-Button und Fokus-Rückkehr. | Wartbarkeit und Berechenbarkeit ohne neue Abhängigkeit. |

## Empfohlene Gestaltung und Reihenfolge

### Jetzt: Erreichbarkeit und Zugänglichkeit

R1–R4 zuerst umsetzen. Abnahme: Panel nach Resize und gespeicherter Außenposition sichtbar; alle Kernaktionen per Tastatur; alle Felder benannt; frei wählbare Farben bleiben lesbar. Touch-Ziele mindestens im konkreten Layout gegen WCAG 2.5.8 prüfen; häufige Aktionen für Touch großzügiger gestalten. 44px ist ein ergonomisches Ziel, kein pauschales WCAG-AA-Minimum.

### Danach: Einen Begriff ohne Suchen hinzufügen

R5–R7 umsetzen. Vorgeschlagene Reihenfolge:

1. Header mit Produktname, Minimieren und Schließen.
2. Verständlicher Status „Treffer 1 von 75“ mit Vor/Zurück.
3. „Suchbegriff hinzufügen“ mit Farbe und direktem Submit; Domain- und Regex-Hilfe unter „Erweitert“.
4. Gespeicherte Begriffe mit Trefferzahl, Bearbeiten und sicherem Entfernen.
5. Optionale Trefferdetails mit Satzkontext und aufklappbare Einstellungen.

Löschen sollte einen Rückgängig-Weg anbieten. Nicht jede einzelne reversible Löschung mit einem Bestätigungsdialog unterbrechen. Suchbegriffe und Einstellungen brauchen für dieses Userscript keine URL-Persistenz.

### Später: Stabilität und Feinschliff

R8–R10. Dunkle neutrale Werkzeugpalette, Textmarker-Gelb als Fokusakzent und vorhandene Begriffspalette beibehalten. Systemschrift ist für ein eingebettetes Werkzeug sinnvoll; keine externen Fonts nötig. Einen hellen/automatischen Modus erst bei belegtem Bedarf ergänzen. Erst funktionale und zugängliche Darstellung abschließen, dann `$impeccable polish`.

Passende Folgeschritte: Design Partner `a11y` für R1–R4; anschließend `relayout` für R5–R7. Nach Umsetzung Audit mit denselben Zuständen wiederholen.

## Verifikation

- `CHROMIUM_PATH=/usr/bin/chromium npm test`: in diesem Review erneut ausgeführt, Exit 0, 40 PASS, 0 FAIL. Performance-Schwellen und inkrementelle Aktualisierungen bestanden. Das belegt nicht die Abwesenheit der neu gefundenen UX-Probleme.
- Laufende Oberfläche in sieben Screenshot-Zuständen des ersten Durchgangs; zweiter Durchgang für dunkle Highlight-Farbe, Regex/Duplikat, Enter, Fokus und reduzierte Bewegung. Keine Produktänderungen zwischen den Durchgängen.
- `evidence/measurements.json`: Geometrie, Felder, Accessibility-Snapshot, Enter/Klick und Entwurfsverlust.
- `evidence/confirmations.json`: Kontrastfarben, Browserdialog, gespeicherter ungültiger Regex, Fokus und Scrolloptionen.
- `evidence/test.log`: vollständige Ergebnisse der vorhandenen Tests.
- Impeccable `context` und `detect` tatsächlich versucht: Launcher unter dem dokumentierten Fallbackpfad fehlt. Premium `audit_project.py --mode strict` ebenfalls nicht ausführbar: Datei fehlt. Keine automatischen Detector-Ergebnisse oder Compliance behauptet.
- PRODUCT.md, DESIGN.md, UX-CONTRACT.md und projektspezifische Designbriefs nicht vorhanden. Kontext aus README, Quellcode und bestehenden Tests; keine fiktiven Nutzerforschungsergebnisse.

## Verifikationslücken

Keine echte Tampermonkey-/Violentmonkey-Erweiterung, kein Screenreader-Hörtest, kein Safari/Firefox/iOS, kein echter 200%-Browserzoom oder Bildschirmtastaturtest. Schmaler Viewport ist kein Ersatz für die vollständige Zoom-Matrix. Keine repräsentative Langzeit-Performance-Messung auf produktiven SPAs; keine pauschale Sicherheitsprüfung. Kein dediziertes A11y-Testpaket vorhanden. Einbindung auf fremden Seiten mit extremen !important-Regeln/Transforms separat testen. Hintergrundseiten bleiben im nichtmodalen Werkzeug bedienbar; ein pauschaler Fokus-Trap wäre hier unpassend.

## Nicht als Defekte gewertet

- Nativer Select: für vier Suchmaschinen bzw. drei Spracheinstellungen angemessen; ein eigenes Listbox-System würde zusätzliche Komplexität schaffen.
- Kein Framework und keine externe Schrift: für ein einzelnes Userscript vorteilhaft.
- 300er-Limit der Trefferliste: vorhandener Test und Hinweis auf weitere Treffer; Navigation bleibt möglich. Kein Anlass, ohne Profiling eine Virtualisierungsbibliothek einzuführen.
- Fehlender heller Modus: optionale Produktentscheidung, kein nachgewiesener Bedienfehler.
- Einzelne kleine Positionsmarken: Tastatur-Kernnavigation existiert bereits; Zielgrößen müssen im Kontext der äquivalenten Controls beurteilt werden. Kein pauschaler AA-Verstoß allein aus 8×4px abgeleitet.

## Urteil

**Block für die Freigabe der geprüften Oberfläche als zugänglich und responsive**, solange R1–R4 bestehen. Die funktionale Desktop-Basis funktioniert; alle vorhandenen Tests bestehen. Dieses Urteil bezieht sich auf den geprüften Umfang und ist keine vollständige WCAG-Zertifizierung.
