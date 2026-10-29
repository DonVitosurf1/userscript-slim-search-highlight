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

## Geheimnisse und GitHub-Workflows

- Vor dem Commit `node scripts/check-secrets.mjs` ausführen; in einem vollständigen Clone prüft `node scripts/check-secrets.mjs --history` auch die erreichbare Git-Historie. Umfang und Grenzen stehen in [SECURITY.md](SECURITY.md). Für die Prüfung werden keine Zugangsdaten benötigt.
- `.env`-Dateien, lokale Konfigurationen und private Schlüssel bleiben lokal. Die `.gitignore` schützt nur noch nicht versionierte Dateien. Beispieldateien wie `.env.example` dürfen ausschließlich Platzhalter enthalten. Echte Tokens niemals als Testfixture verwenden.
- Bei einem Fund keine geheimen Werte in Issues, Pull Requests oder Logs kopieren. Bereits veröffentlichte Zugangsdaten zuerst rotieren; Sicherheitsprobleme über den privaten Meldeweg in [SECURITY.md](SECURITY.md) melden.
- GitHub Actions mit vollständigem, im offiziellen Repository überprüftem Commit-SHA und Versionskommentar pinnen. Checkout-Zugangsdaten nicht persistieren; Berechtigungen auf das pro Job erforderliche Minimum beschränken. Keine nicht vertrauenswürdigen PR-Inhalte mit `pull_request_target` ausführen.
- Der Build übernimmt den vollständigen MIT-Lizenztext aus `LICENSE` hinter den Userscript-Metadaten in die installierbare Datei. Bei Distributionsänderungen diesen Hinweis erhalten.

Serverseitige Regeln müssen separat in GitHub eingerichtet werden; siehe [Sicherheitseinstellungen](.github/security-settings.md). Dateien im Repository aktivieren diese Funktionen nicht automatisch.

Details: [Dokumentationsindex](docs/README.md), [Architektur](docs/architecture.md), [Datenformat](docs/data-format.md), [Release-Prüfung](docs/releasing.md).

## English

Use the [development guide](docs/development.md) for setup and verification. Edit `src/`, regenerate the single installable userscript, and submit both together. Keep regression coverage for behavior changes and update the German/English usage guides together. Documentation-only changes do not require a product version bump. Historical evidence belongs in `docs/archive/`; generated local output belongs in ignored `artifacts/`. Follow the [release checklist](docs/releasing.md) and report checks that have not been performed.

Before committing, run `node scripts/check-secrets.mjs`; add `--history` in a full clone to scan reachable history. Use placeholders in example files and never put real credentials in fixtures or logs. See [SECURITY.md](SECURITY.md) for scanner limits and private reporting. Pin Actions to verified full commit SHAs, keep checkout credentials disabled, and grant only required job permissions. Retain the full MIT notice embedded by the build. GitHub rulesets and security features require separate [maintainer setup](.github/security-settings.md).
