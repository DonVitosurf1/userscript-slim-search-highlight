# Development and verification

[Documentation index](README.md) · [Architecture](architecture.md) · [Release checklist](releasing.md)

Use Node.js 22 or newer (CI uses 22) and the checked-in lockfile:

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm test
```

The cloud environment also provides `/usr/bin/chromium`. To use it instead of a Playwright browser download:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

No credentials, environment file, database or server is needed. Browser tests use synthetic pages and GM-function adapters, with no live webpage traffic.

## Daily workflow

1. Change the appropriate source section under `src/`.
2. For behavior changes, first add a failing browser regression in `tests/suites/`.
3. Run `npm run build`, then focused tests and the full suite.
4. Update `src/metadata.txt` version, CHANGELOG and relevant documentation when behavior changes.
5. Commit source and regenerated artifact together.

| Command | Purpose |
|---|---|
| `npm run build` | Deterministically regenerate the installable userscript |
| `npm run check` | Detect stale generated output and syntax errors |
| `npm test` | Build check and every browser suite |
| `npm run test:selection` | Existing selection regressions |
| `npm run test:features` | Page color/undo/storage/sharing/options regressions |
| `node tests/run_tests.js -k correction_` | Review defect and long-node regressions |
| `node tests/run_tests.js --list` | List test names without launching a browser |
| `npm run benchmark` | Verify actual match counts while measuring handler and completion times |
| `npm run screenshots` | Capture desktop/narrow selection actions, panel, options and manual copying |

The `-k` filter matches names; zero selected tests is an error. `tests/run_tests.js` remains the stable entry point. Fixtures live in `tests/helpers/browser.cjs`; suites cover permanent keywords, panel interaction, selections, review regressions, page features and appearance preferences. Each test closes its own browser contexts. Use `node tests/run_tests.js -k appearance_` for theme, launcher geometry, persistence and preference-error recovery.

## Performance checks

The benchmark measures a single long text node and the same number of occurrences split across paragraphs. It reports synchronous handler time **and** time until all expected ranges are ready. For a comparison against an older local artifact:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/benchmark.cjs --script /path/to/older.user.js
```

Treat timings as machine-specific evidence, not universal guarantees. Performance tests should preserve actual match counts and test cancellation as well as speed.

## Screenshots and local output

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run screenshots
```

Omit `CHROMIUM_PATH` to use the installed Playwright Chromium, as with tests. The maintained capture script lives in `scripts/screenshots.cjs`. It uses a synthetic page and simulated GM bindings, creates PNGs for light/dark desktop and narrow layouts plus `browser.json` in `artifacts/screenshots/`, and checks panel bounds, both expected matches and page errors. Inspect the captures visually; geometry checks alone do not establish usability.

`artifacts/` is ignored by Git and safe to regenerate. Copy a deliberately chosen public screenshot to `assets/screenshot.png` when updating the README. Commit only evidence needed for a specific review; do not keep appending routine captures to the documentation. Older reports and evidence live in the [archive](archive/README.md); their scripts are historical snapshots.

## Release checks

Follow the [release checklist](releasing.md) for real userscript-manager/browser tests, accessibility and integration checks. Automated Chromium coverage is not a substitute for those manual checks.

CI runs the deterministic check, frozen installation and the full browser suite. Do not disable TLS/checksums or weaken assertions to make environment failures pass.
