# Mitwirken

Fehler und Ideen gern als [Issue](https://github.com/DonVitosurf1/userscript-slim-search-highlight/issues/new/choose) melden.

## Änderungen vorschlagen

1. Repo forken und einen Branch anlegen
2. Das Skript in `userscript/` ändern und die Tests laufen lassen:

```
npm install && npx playwright install chromium
npm test
```

3. `@version` im Skript erhöhen und `CHANGELOG.md` ergänzen, wenn sich das Verhalten ändert
4. Pull Request erstellen. Die GitHub-Action prüft Syntax und Tests automatisch.

Das Skript besteht bewusst aus einer einzigen Datei, damit es sich mit einem Klick installieren lässt.
