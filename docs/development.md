# Development and verification

[Documentation index](README.md) · [Architecture](architecture.md) · [Release checklist](releasing.md)

Use Node.js 22 or newer (CI uses 22) and the checked-in lockfile:

```sh
npm ci
npx playwright install --with-deps --no-shell chromium
npm run build
npm test
```

The cloud environment also provides `/usr/bin/chromium`. To use it instead of a Playwright browser download:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

No credentials, environment file, database or separate server setup is needed. Browser tests use synthetic pages and GM-function adapters, with no live webpage traffic. The native search-navigation tests start and stop their own ephemeral HTTP server using local origins (including an official Google hostname mapped to loopback by the test runner) so normal and middle-click navigation are exercised without contacting Google or another external service.

The test runner explicitly uses Playwright's full Chromium channel in new headless mode, rather than its separate headless shell. This preserves native browser tab behavior for the middle-click navigation test. `CHROMIUM_PATH` may select an installed full Chromium executable instead. CI uses the same channel and publishes named test failures as GitHub check annotations.

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
| `npm run screenshots` | Capture both symbol variants in light/dark desktop/narrow views, including panel and manual copying |

The `-k` filter matches names; zero selected tests is an error. `tests/run_tests.js` remains the stable entry point. Fixtures live in `tests/helpers/browser.cjs`; suites cover permanent keywords, panel interaction, selections, review regressions, page features, appearance preferences and search-result handoff. Each test closes its own browser contexts. Use `node tests/run_tests.js -k appearance_` for theme/launcher preferences, or `node tests/run_tests.js -k search_handoff_` for current queries, native link activation, concurrent destinations, referrers, expiry and storage-error recovery.

For the current UI, `-k appearance_selection_` covers symbol choice, save/restore/error behavior and narrow actions; `-k panel_shortcut_` covers native panel toggling and assignment conflicts; `-k selection_hover_hints` covers tooltip/accessible shortcut updates after recording, disabling, resetting and locale changes. Keep synthetic-event rejection intact: native keyboard input must exercise privileged actions.

## Performance checks

`node tests/run_tests.js -k compact_panel_` checks the compact overview in both themes, narrow touch targets, and expansion/help/locale behavior. Opening a tool section may increase the panel's height within the viewport; the closed overview has its own smaller height cap.

The benchmark measures a single long text node and the same number of occurrences split across paragraphs. It reports synchronous handler time **and** time until all expected ranges are ready. For a comparison against an older local artifact:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/benchmark.cjs --script /path/to/older.user.js
```

Treat timings as machine-specific evidence, not universal guarantees. Performance tests should preserve actual match counts and test cancellation as well as speed.

## Screenshots and local output

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run screenshots
```

Omit `CHROMIUM_PATH` to use the installed Playwright Chromium, as with tests. The maintained capture script lives in `scripts/screenshots.cjs`. It uses a synthetic page and simulated GM bindings, creates PNGs for both symbol styles × light/dark × desktop/narrow layouts plus `browser.json` in `artifacts/screenshots/`, and checks panel bounds, both expected matches and page errors. The default logo style retains names such as `light-desktop-toolbar.png`; button-style captures use the `-button` suffix before the state, such as `light-desktop-button-toolbar.png`. `browser.json` records `symbolStyle`. Inspect the captures visually; geometry checks alone do not establish usability.

`artifacts/` is ignored by Git and safe to regenerate. Copy a deliberately chosen public screenshot to `assets/screenshot.png` when updating the README. Commit only evidence needed for a specific review; do not keep appending routine captures to the documentation. Older reports and evidence live in the [archive](https://github.com/DonVitosurf1/userscript-slim-search-highlight/blob/6007c7328b6fbc1792ea27bc3fff2c10c2afa7c3/docs/archive/README.md); their scripts are historical snapshots.

## Release checks

Run `npm run check:secrets` for current files and `node scripts/check-secrets.mjs --history` from a full clone for reachable history. The scanner is a documented pattern check, not proof that every secret format is absent. CI also provides CodeQL; its actual GitHub result must be verified separately.

Security regressions run with `node tests/run_tests.js -k security_`. Unlike functional fixtures, UI security tests use actual isolated execution worlds and closed roots, with no open-root inspection adapter. Functional fixtures expose UI to the driver for assertions without spoofing event trust. Native navigation tests map the official Google hostname to their ephemeral local HTTP server through test-only Chromium resolver arguments; production domain recognition contains no test-host exception.

Follow the [release checklist](releasing.md) for real userscript-manager/browser tests, accessibility and integration checks. Automated Chromium coverage is not a substitute for those manual checks.

CI runs the deterministic check, frozen installation and the full browser suite. Do not disable TLS/checksums or weaken assertions to make environment failures pass.
