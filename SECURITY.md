# Sicherheit / Security

Slim Search Highlight läuft als Userscript auf den besuchten Seiten. Sicherheitskorrekturen richten sich an die aktuelle Version auf `main`; ältere Versionen bitte vor einer Meldung mit der aktuellen Version vergleichen.

## Schwachstelle melden

Wenn im Repository **Security → Report a vulnerability** verfügbar ist, verwende die [private Sicherheitsmeldung auf GitHub](https://github.com/DonVitosurf1/userscript-slim-search-highlight/security/advisories/new). Ob diese GitHub-Funktion aktiviert ist, wird durch diese Datei nicht bestätigt.

Falls die private Meldung nicht verfügbar ist und im [GitHub-Profil des Maintainers](https://github.com/DonVitosurf1) ein privater Kontakt angegeben ist, nutze diesen. Gibt es keinen solchen Kontakt, erstelle ein [öffentliches Issue](https://github.com/DonVitosurf1/userscript-slim-search-highlight/issues/new) ausschließlich mit der Bitte um einen privaten Sicherheitskontakt. **Keine Schwachstellendetails, Zugangsdaten, betroffenen privaten URLs oder Exploits öffentlich posten.**

Eine private Meldung sollte Version, Browser/Userscript-Manager, Voraussetzungen, Auswirkung und möglichst eine kleine Reproduktion auf einer Testseite enthalten. Entferne echte Zugangsdaten und personenbezogene Inhalte. Für dieses Projekt gibt es keine zugesicherte Reaktions- oder Behebungsfrist.

Die Laufzeitgrenzen, Domain-Sichtbarkeit und sicheren Exportpfade beschreibt das [Sicherheitsmodell](docs/security-model.md).

## Prüfungen und Grenzen

- `node scripts/check-secrets.mjs` prüft versionierte und nicht ignorierte neue Dateien im Arbeitsverzeichnis offline auf verbreitete Tokenformate, private Schlüssel, verdächtige Dateinamen und bestimmte Geheimniszuweisungen. Ignorierte lokale Dateien werden dabei nicht gelesen.
- `node scripts/check-secrets.mjs --history` prüft zusätzlich alle über lokale Git-Referenzen erreichbaren Blobs. Dafür ist ein vollständiger Clone erforderlich; CI verwendet `fetch-depth: 0`. Nicht erreichbare Objekte und nicht lokal vorhandene Referenzen sind nicht enthalten.
- Der Scanner gibt ausschließlich Dateinamen und Regeln aus. Er erkennt weder jedes Geheimnisformat noch beliebige vertrauliche Daten; ein grüner Lauf ist keine Garantie. Dateien über 16 MiB oder Lesefehler brechen die Prüfung ab. Binärinhalte werden nur anhand verdächtiger Dateinamen geprüft.
- Der Workflow `Security` enthält außerdem CodeQL für JavaScript. Die Workflow-Datei aktiviert keine GitHub-Einstellungen und beweist keinen erfolgreichen Lauf auf GitHub.

Falls ein echtes Geheimnis veröffentlicht wurde: zuerst beim Anbieter sperren oder rotieren, dann betroffene Dateien und Historie bewerten. Das Löschen aus dem letzten Commit macht ein bereits veröffentlichtes Geheimnis nicht wieder sicher. Eine Bereinigung der Git-Historie muss mit allen Beteiligten abgestimmt werden.

Die einzeln zu aktivierenden serverseitigen Schutzmaßnahmen stehen in [GitHub-Sicherheitseinstellungen](.github/security-settings.md).

## English

Security fixes target the current version on `main`. Use [GitHub private vulnerability reporting](https://github.com/DonVitosurf1/userscript-slim-search-highlight/security/advisories/new) if the repository offers it. Its availability has not been verified here. Otherwise, use a private contact listed on the [maintainer's profile](https://github.com/DonVitosurf1), or open a public issue asking only for a private security contact. Do not disclose vulnerability details, credentials, private URLs, or exploits publicly. Include a minimal reproduction and affected versions in the private report. No response or remediation deadline is guaranteed.

The offline scanner checks known patterns in tracked and non-ignored new files; `--history` also checks blobs reachable from local Git refs and requires a full clone. It prints filenames and rule names only. Ignored files, unreachable history, unknown secret formats, and binary file contents are outside its coverage. Rotate exposed credentials before considering history cleanup. Workflow files do not establish that GitHub protections are enabled; see the [settings guide](.github/security-settings.md).
