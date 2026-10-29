# Dokumentation / Documentation

[Projektstart / Project home](../README.md) · [English overview](../README.en.md)

## Schnell zum Ziel / Quick links

- [Installieren](../README.md#installation) / [Install](../README.en.md#installation)
- [Auswählen und markieren](usage.de.md#auswählen-und-suchen) / [Select and highlight](usage.en.md#select-and-find)
- [Darstellung und Symbolvarianten](usage.de.md#darstellung-und-öffnen-button) / [Appearance and symbol styles](usage.en.md#appearance-and-open-button)
- [Tastatur und Panel](usage.de.md#tastatur-und-panel) / [Keyboard and panel](usage.en.md#keyboard-and-panel)
- [Problemlösungen](usage.de.md#problemlösungen) / [Troubleshooting](usage.en.md#troubleshooting)

## Bedienung / Using the script

| Dokument | Inhalt |
|---|---|
| [Bedienung (Deutsch)](usage.de.md) | Auswahl markieren, Navigation, Speicherung, Shortcuts und Export |
| [Usage (English)](usage.en.md) | Selection, navigation, saving, shortcuts and export |
| [Änderungen / Changelog](../CHANGELOG.md) | Versionsverlauf und Migrationen |
| [Sicherheit / Security](../SECURITY.md) | Sicherheitsprobleme vertraulich melden |
| [Designrichtlinie](design/README.md) | Hell/Dunkel, beide Symbolvarianten, Farbrollen und Gestaltungsregeln |

## Entwicklung / Development

Die technischen Leitfäden sind auf Englisch; die Bedienungsanleitung ist zweisprachig.

| Document | Purpose |
|---|---|
| [Contributing](../.github/CONTRIBUTING.md) | Scope, contribution rules and review expectations |
| [Development](development.md) | Setup, build, tests, screenshots and benchmark |
| [Architecture](architecture.md) | Source ownership, lifecycle and the two highlighting paths |
| [Saved data format](data-format.md) | URL identity, storage schema and export limits |
| [Design system](design/DESIGN.md) | UI tokens, accessibility and interaction contracts |
| [Release checklist](releasing.md) | Automated checks, manual browser checks and integration |
| [Security model](security-model.md) | Host-page boundaries, permitted profile display, downloads and regex limits |
| [SearchJumper comparison](research/searchjumper-search-handoff.md) | Primary-source research behind search-result term transfer |

## Repository layout

```text
.github/       CI, dependency updates, issue and pull-request templates
assets/        Shared logo, SVG action icons and public screenshots
docs/          Current guides and this index
  design/      Visual guideline and technical design system
  research/    Current technical research with primary-source citations
scripts/       Build, benchmark and current screenshot capture
src/           Ordered source sections and userscript metadata
tests/         Browser runner, shared fixtures and named suites
userscript/    Generated installable userscript at its stable update URL
artifacts/     Local generated screenshots and measurements (gitignored)
```

The repository root keeps the README files, CHANGELOG, SECURITY, LICENSE and tool configuration. Contribution rules live in `.github/`; both design documents live in `docs/design/`. Work on `src/`; regenerate `userscript/` rather than editing the installable file directly. `node_modules/` and `artifacts/` are generated locally.

Earlier plans, reviews and screenshots remain available in the [Git history before this cleanup](https://github.com/DonVitosurf1/userscript-slim-search-highlight/tree/6007c7328b6fbc1792ea27bc3fff2c10c2afa7c3/docs/archive). They describe historical snapshots, rather than current instructions or open work. Routine new evidence belongs in ignored `artifacts/`.
