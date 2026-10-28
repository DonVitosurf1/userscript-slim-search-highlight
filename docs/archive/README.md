# Entwicklungsarchiv / Development archive

[Aktuelle Dokumentation / Current documentation](../README.md)

Dieses Archiv enthält die Reviews, Pläne und Nachweise vom **27.10.2026**, aus denen die Versionen 4.1–4.3 entstanden sind. Es ist kein offener Arbeitsplan. Frühere Aussagen wie „nicht gepusht“, alte Dateinamen und damalige Testergebnisse gehören zum jeweiligen historischen Stand.

**Integration:** Version 4.3.0 wurde am 28.10.2026 mit Commit [`31cca1d`](https://github.com/DonVitosurf1/userscript-slim-search-highlight/commit/31cca1d7fd6f8cc4ae8c1d03751a1b161ab889ba) nach `main` übernommen. Das ist kein Nachweis einer gesonderten GitHub-Release-Veröffentlichung oder einer manuellen Prüfung aller Browser.

## Berichte und Nachweise

| Stand | Bericht | Nachweise |
|---|---|---|
| Erstes UI-Review | [Review](reviews/review-report.md) | [Screenshots und Messwerte](reviews/evidence/) |
| 4.1: Panel und Bedienung | [Umsetzung](reviews/implementation-report.md) | [Browseraufnahmen](reviews/implementation-evidence/) |
| 4.2: Auswahl und Seitensuche | [Umsetzung](reviews/selection-implementation-report.md) | [Browseraufnahmen](reviews/selection-evidence/) |
| 4.2: Code-Review | [Befunde und Quellenvergleich](reviews/code-review-report.md) | [Quellen und Performance](reviews/code-review-evidence/) |
| 4.3: Korrekturen und Erweiterungen | [Abschlussbericht](reviews/release-4.3/implementation-report.md) | [Tests, Screenshots und Benchmark](reviews/release-4.3/) |

Die ursprünglichen Capture-/Probe-Skripte neben älteren Nachweisen sind historische Momentaufnahmen, keine aktuellen Werkzeuge. Sie können alte Selektoren und umgebungsspezifische Pfade enthalten. Für neue Aufnahmen steht [scripts/screenshots.cjs](../../scripts/screenshots.cjs) bereit; die Bedienung steht in der [Entwicklungsanleitung](../development.md).

## Pläne und Spezifikationen

| Thema | Spezifikation | Plan | Ausführungsprotokoll |
|---|---|---|---|
| Panel | [Spec](specs/2026-10-27-panel-improvements-design.md) | [Plan](plans/2026-10-27-panel-improvements.md) | [Protokoll](plans/2026-10-27-panel-improvements-progress.md) |
| Auswahl | [Spec](specs/2026-10-27-selection-highlights-design.md) | [Plan](plans/2026-10-27-selection-highlights.md) | [Protokoll](plans/2026-10-27-selection-highlights-progress.md) |
| Review und Erweiterungen | [Spec](specs/2026-10-27-review-and-features-design.md) | [Plan](plans/2026-10-27-review-and-features.md) | [Protokoll](plans/2026-10-27-review-and-features-progress.md) |

Bei der Aufräumung am 28.10.2026 wurde `.design/` nach `docs/archive/reviews/` verschoben und `docs/superpowers/` in `docs/archive/plans/` und `docs/archive/specs/` eingeordnet. Vorhandene Nachweise bleiben erhalten. Einzelne früher erwähnte lokale Logs wurden damals nicht eingecheckt und lassen sich aus diesem Archiv nicht rekonstruieren.

Historical evidence is preserved here for context, not as the current specification or a promise that old capture scripts still run. Follow the [current guides](../README.md) and [release checklist](../releasing.md) for new work.
