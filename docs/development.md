# Development and verification

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

The `-k` filter matches names; zero selected tests is an error. `tests/run_tests.js` remains the stable entry point. Fixtures live in `tests/helpers/browser.cjs`; suites cover permanent keywords, panel interaction, selections, review regressions and page features. Each test closes its own browser contexts.

## Performance checks

The benchmark measures a single long text node and the same number of occurrences split across paragraphs. It reports synchronous handler time **and** time until all expected ranges are ready. For a comparison against an older local artifact:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/benchmark.cjs --script /path/to/older.user.js
```

Treat timings as machine-specific evidence, not universal guarantees. Performance tests should preserve actual match counts and test cancellation as well as speed.

## Manual release checks

Automated coverage is Chromium with simulated GM bindings. Before publishing, exercise the real script in Tampermonkey/Violentmonkey and supported browser engines, plus keyboard/screen-reader, mobile touch/keyboard, zoom and OS-shortcut conflicts. Verify clipboard denial/manual copy, local downloads and saving on the actual userscript manager. CSS Custom Highlights support is required for page passages; unsupported browsers show a disabled-action explanation.

CI runs the deterministic check, frozen installation and the full browser suite. Do not disable TLS/checksums or weaken assertions to make environment failures pass.
