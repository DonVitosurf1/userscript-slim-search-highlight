# Mitwirken / Contributing

Issues und Pull Requests sind willkommen. Sicherheitsprobleme bitte gemäß [SECURITY.md](SECURITY.md) privat melden.

## Setup

Node.js 22+ verwenden. Installation, Chromium-Setup und Prüfkommandos stehen zentral in der [Entwicklungsanleitung](docs/development.md).

## Quellen und Änderungen

- Die wartbaren Quellabschnitte liegen unter `src/`; die Reihenfolge steht in `src/manifest.json`, die Userscript-Metadaten in `src/metadata.txt`.
- `userscript/slim-search-highlight.user.js` ist das **generierte** installierbare Ergebnis. Nach Quelländerungen `npm run build` ausführen und Quelle plus Artefakt zusammen einreichen.
- Die Auslieferung bleibt bewusst eine Datei, ohne Framework oder Laufzeitabhängigkeiten. Die Quellabschnitte teilen einen privaten lexikalischen Scope; keine Initialisierung vor dem Lifecycle-Abschnitt starten.
- Verhalten mit einem zunächst fehlschlagenden Test in der passenden `tests/suites/`-Datei absichern. Fixtures nicht pro Suite duplizieren.
- Bei Verhaltensänderungen `src/metadata.txt`-Version, CHANGELOG und deutsche/englische Bedienungsdokumentation aktualisieren.
- `npm run check`, die volle Testsuite und für Suchänderungen der Benchmark gehören zur Prüfung. Null ausgewählte Tests sind kein Erfolg.
- Neue Speicherformate versionieren; temporäre Auswahltexte nie ungefragt speichern oder übertragen. Native Browserinteraktionen erhalten.
- Bei Dokumentationsänderungen lokale Links und deutsche/englische Angaben abgleichen. Historische Berichte gehören nach `docs/archive/`; neue Routine-Screenshots und Logs nach `artifacts/`, nicht ins Archiv.
- Produktänderungen und reine Dokumentations-/Strukturpflege getrennt beschreiben. Reine Dokumentationspflege erfordert keinen Versionssprung des Userscripts.

Details: [Dokumentationsindex](docs/README.md), [Architektur](docs/architecture.md), [Datenformat](docs/data-format.md), [Release-Prüfung](docs/releasing.md).

## English

Use the [development guide](docs/development.md) for setup and verification. Edit `src/`, regenerate the single installable userscript, and submit both together. Keep regression coverage for behavior changes and update the German/English usage guides together. Documentation-only changes do not require a product version bump. Historical evidence belongs in `docs/archive/`; generated local output belongs in ignored `artifacts/`. Follow the [release checklist](docs/releasing.md) and report checks that have not been performed.
