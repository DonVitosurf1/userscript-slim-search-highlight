'use strict';
const { chromium } = require('playwright');
const fixtures = require('./helpers/browser.cjs');
const suites = ['keywords', 'panel', 'selection', 'regressions', 'page-features', 'appearance', 'search-handoff'];
const tests = {};
for (const suite of suites) {
  for (const [name, run] of Object.entries(require(`./suites/${suite}.cjs`)(fixtures))) {
    if (tests[name]) throw new Error(`Duplicate test name: ${name}`);
    tests[name] = run;
  }
}

(async () => {
  const index = process.argv.indexOf('-k');
  if (index >= 0 && !process.argv[index + 1]) throw new Error('-k requires a filter');
  const filter = index >= 0 ? process.argv[index + 1] : '';
  const selected = Object.entries(tests).filter(([name]) => name.includes(filter));
  if (!selected.length) throw new Error(`No tests match: ${filter}`);
  if (process.argv.includes('--list')) {
    console.log(selected.map(([name]) => name).join('\n'));
    return;
  }
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  let failed = 0;
  try {
    for (const [name, run] of selected) {
      const start = Date.now();
      try { await run(browser); console.log(`PASS ${name} (${Date.now() - start} ms)`); }
      catch (error) { failed++; console.log(`FAIL ${name}: ${error.message.split('\n')[0]}`); }
      finally { await Promise.all(browser.contexts().map(context => context.close())); }
    }
  } finally { await browser.close(); }
  console.log(`\n${selected.length - failed} passed, ${failed} failed, ${selected.length} executed`);
  console.log(failed ? `${failed} Test(s) fehlgeschlagen` : 'Alle Tests bestanden');
  process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
