# Mitwirken / Contributing

Issues und Pull Requests sind willkommen. Sicherheitsprobleme bitte gemäß [SECURITY.md](SECURITY.md) privat melden.

## Setup

Node.js 22+ und der eingecheckte Lockfile:

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm test
```

Für das vorhandene System-Chromium: `CHROMIUM_PATH=/usr/bin/chromium npm test`.

## Quellen und Änderungen

- Die wartbaren Quellabschnitte liegen unter `src/`; Reihenfolge und Metadaten stehen in `src/manifest.json`.
- `userscript/slim-search-highlight.user.js` ist das **generierte** installierbare Ergebnis. Nach Quelländerungen `npm run build` ausführen und Quelle plus Artefakt zusammen einreichen.
- Die Auslieferung bleibt bewusst eine Datei, ohne Framework oder Laufzeitabhängigkeiten. Die Quellabschnitte teilen einen privaten lexikalischen Scope; keine Initialisierung vor dem Lifecycle-Abschnitt starten.
- Verhalten mit einem zunächst fehlschlagenden Test in der passenden `tests/suites/`-Datei absichern. Fixtures nicht pro Suite duplizieren.
- Bei Verhaltensänderungen `src/metadata.txt`-Version, CHANGELOG und deutsche/englische Bedienungsdokumentation aktualisieren.
- `npm run check`, die volle Testsuite und für Suchänderungen der Benchmark gehören zur Prüfung. Null ausgewählte Tests sind kein Erfolg.
- Neue Speicherformate versionieren; temporäre Auswahltexte nie ungefragt speichern oder übertragen. Native Browserinteraktionen erhalten.

Details: [Entwicklung](docs/development.md), [Architektur](docs/architecture.md), [Datenformat](docs/data-format.md).
