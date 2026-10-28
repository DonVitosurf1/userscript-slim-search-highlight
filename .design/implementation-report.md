# Umsetzung des Reviews — Version 4.1.0

Der Nutzer hat die vollständige Umsetzung des Reviews beauftragt. Die zehn Befunde sind im bestehenden einzelnen Userscript bearbeitet; keine neue Laufzeitabhängigkeit, kein Framework und keine Änderung bestehender GM-Storage-Schlüssel.

## Änderungen und Nachweise

| Review | Umsetzung | Regression / Browsernachweis |
|---|---|---|
| R1 | Begrenzte Breite/Höhe, Korrektur gespeicherter Positionen, Resize/visualViewport und Panel-ResizeObserver, Pointer-Drag, Header-Pfeiltasten/Pos1 und Reset | `review_panel_stays_inside_narrow_viewport`, `review_panel_growth_stays_inside_viewport`, `review_position_keyboard_reset_and_minimize`; 240/320/390px und Desktop |
| R2 | Benannte nichtmodale Region, Fokus beim Öffnen/Schließen, Escape, Live-Zähler und Status, native Kontexttreffer-Buttons mit einem Tabstop und Pfeilnavigation | `review_open_close_restores_focus`, `review_match_list_keyboard_and_context`, `review_controls_have_localized_accessible_names` |
| R3 | Labels für alle Felder und lokalisiert benannte Symbolaktionen, gemeinsame Fokusregeln | `review_controls_have_localized_accessible_names`; Deutsch/Englisch im Browser |
| R4 | Schwarze/weiße Vordergrundfarbe nach sRGB-Kontrast; direkte Farb-/Textvorschau | `review_highlight_foreground_has_contrast`: fünf helle, mittlere und dunkle Farben ≥4,5:1 |
| R5 | Add-Form oben, gelbe Hauptaktion, optionale erweiterte Felder, Treffer/Verlauf/Einstellungen aufklappbar; Kontext statt bloßer Begriffswiederholung | `review_primary_action_visible_on_small_screen`, `review_match_list_keyboard_and_context` |
| R6 | Enter/Klick-Submit, IME-Schutz, Validierung vor Create/Edit, zugeordnete Inline-Fehler und Erhalt ungültiger Eingaben; keine nativen Produktdialoge | `review_enter_submits_and_ime_does_not`, `review_invalid_regex_retains_input_and_storage`, `review_duplicate_error_is_inline`, `review_invalid_keyword_edit_is_not_saved` |
| R7 | Sprachwechsel erhält neue Formularwerte, aktive Keyword-Entwürfe, offene Bereiche, Fokus und Scrollposition | `review_locale_preserves_draft_focus_and_disclosures` |
| R8 | Lokaler Reset mit niedriger Spezifität und SVG-Ausnahme, explizite Control-Stile; Navigationsselektor auf eigene Treffer begrenzt | `review_scoped_controls_resist_host_css`, `review_scoped_reset_preserves_header_and_button_layout`, `review_svg_controls_remain_visible_after_reset`, `review_navigation_does_not_change_host_match_items` |
| R9 | Instant-Scroll bei reduzierter Bewegung und keine Farbtransition unter reduce | `review_reduced_motion_scroll_is_instant` |
| R10 | Lokale semantische --hl-Tokens, gemeinsame Zustände, scoped Scrollbars/Selektion, sofort löschbarer Suchfilter mit Fokus-Rückkehr | `review_clear_search_and_undo_deletion`; DESIGN.md dokumentiert Runtime-Mapping |

Zusätzlich: Letzte Keyword-Löschung ist rückgängig zu machen. Abschalten und Domain-Ausschluss entwerten geplante Highlight-Frames; ausgeschlossene Seiten ignorieren bereits registrierte globale Shortcuts. Damit bleiben Zähler und Trefferliste beim Deaktivieren korrekt leer. Bestehender Domain-Ausschluss verwendet eine Panelmeldung anstelle von Browserdialog und Reload; es wurde kein zusätzlicher Schalter zum Entfernen allgemeiner Blacklist-Regeln eingeführt.

## Superpowers-Ablauf

- Review als konkret bestätigte Vorgabe; Design/Plan und Entscheidungen unter docs/superpowers/.
- Zuerst 16 neue Tests: alle am erwarteten Verhalten fehlgeschlagen, danach bestanden.
- Unabhängige Codeprüfung bestätigte drei zusätzliche Probleme: SVG-Reset, ausstehende Highlight-Frames und Panelwachstum. Tests reproduzierten diese, anschließend Korrektur und Nachprüfung.
- Die visuelle Abnahme zeigte, dass SVG-Paint allein nicht reicht: Geometrie und Header-/Control-Layout sind nun ebenfalls durch Regressionen geschützt. Der Reset nutzt `:where()` und nimmt SVG samt Nachfahren aus.
- Ein weiterer Isolationstest reproduzierte Änderungen an einer fremden `.match-item`-Klasse; Navigation ist jetzt auf das eigene Panel begrenzt.
- Resize-Regression wartet auf das tatsächlich asynchron ausgelieferte Resize-Ereignis, statt alte Geometrie unmittelbar mit der neuen Viewportvorgabe zu vergleichen.

## Verifikation

**Endstand: 63 Tests bestanden, 0 fehlgeschlagen, Exit 0.** Der vollständige Lauf steht in `implementation-evidence/tests.log` (vollständiger `CHROMIUM_PATH=/usr/bin/chromium npm test`-Lauf). Syntaxprüfung mit `node --check userscript/slim-search-highlight.user.js`; Whitespaceprüfung mit `git diff --check`.

Browserdurchlauf erfolgreich: Desktop, 320/390px, leere Liste, Inline-Fehler, Tastaturnavigation mit Kontext, englische Einstellungen/nativer Select, fremdes CSS und aufgeklappte Bereiche nach Wiederherstellen einer externen Position. Screenshots, Browserprotokoll und reproduzierbarer Capture-Helfer liegen in `implementation-evidence/`.

Bestehender Review samt ursprünglichen Nachweisen unter `.design/evidence/` bleibt erhalten. README in beiden Sprachen, Changelog und DESIGN.md sind aktualisiert. Keine Veröffentlichung, kein Push oder Merge; Änderungen liegen prüfbar im Workspace.

## Grenzen

Chromium mit nachgebildeten GM-Funktionen; keine echte Tampermonkey-/Violentmonkey-Installation und kein Screenreader-Hörtest. Safari/Firefox, echte Touchhardware, Bildschirmtastatur und echter Browserzoom bleiben manuelle Anschlussprüfungen. Keine umfassende WCAG-Zertifizierung. Impeccable-Launcher und Premium-Static-Auditor waren in dieser Umgebung nicht installiert; es werden keine Ergebnisse dieser Werkzeuge behauptet. Ein optionaler heller Modus, Shadow-DOM-Neubau oder Virtualisierungsframework waren im Review ausdrücklich keine erforderlichen Korrekturen.
