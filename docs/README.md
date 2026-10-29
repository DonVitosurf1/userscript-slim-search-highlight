# Dokumentation / Documentation

[Projektstart / Project home](../README.md) · [English overview](../README.en.md)

## Bedienung / Using the script

| Dokument | Inhalt |
|---|---|
| [Bedienung (Deutsch)](usage.de.md) | Auswahl markieren, Navigation, Speicherung, Shortcuts und Export |
| [Usage (English)](usage.en.md) | Selection, navigation, saving, shortcuts and export |
| [Änderungen / Changelog](../CHANGELOG.md) | Versionsverlauf und Migrationen |
| [Sicherheit / Security](../SECURITY.md) | Sicherheitsprobleme vertraulich melden |
| [Designrichtlinie](design-guidelines.de.md) | Helles Logo, Symbolfamilie, Farbrollen und Gestaltungsregeln |

## Entwicklung / Development

Die technischen Leitfäden sind auf Englisch; die Bedienungsanleitung ist zweisprachig.

| Document | Purpose |
|---|---|
| [Contributing](../CONTRIBUTING.md) | Scope, contribution rules and review expectations |
| [Development](development.md) | Setup, build, tests, screenshots and benchmark |
| [Architecture](architecture.md) | Source ownership, lifecycle and the two highlighting paths |
| [Saved data format](data-format.md) | URL identity, storage schema and export limits |
| [Design system](../DESIGN.md) | UI tokens, accessibility and interaction contracts |
| [Release checklist](releasing.md) | Automated checks, manual browser checks and integration |
| [Security model](security-model.md) | Host-page boundaries, permitted profile display, downloads and regex limits |
| [SearchJumper comparison](research/searchjumper-search-handoff.md) | Primary-source research behind search-result term transfer |

## Repository layout

```text
.github/       CI, dependency updates, issue and pull-request templates
assets/        Shared logo, SVG action icons and public screenshots
docs/          Current guides and this index
  archive/     Historical reviews, evidence, plans and specifications
  research/    Current technical research with primary-source citations
scripts/       Build, benchmark and current screenshot capture
src/           Ordered source sections and userscript metadata
tests/         Browser runner, shared fixtures and named suites
userscript/    Generated installable userscript at its stable update URL
artifacts/     Local generated screenshots and measurements (gitignored)
```

The repository root keeps the project entry points and repository-wide policies: README files, CHANGELOG, CONTRIBUTING, DESIGN, SECURITY and LICENSE. Work on `src/`; regenerate `userscript/` rather than editing the installable file directly. `node_modules/` and `artifacts/` are generated locally.

[Archived material](archive/README.md) records the work that led to earlier versions. Historical test counts, paths and publication statements describe those snapshots; use the current guides for today's workflow.
