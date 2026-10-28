'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const index = process.argv.indexOf('--script');
  const script = index >= 0 ? process.argv[index + 1] : path.join(__dirname, '../userscript/slim-search-highlight.user.js');
  if (!script) throw new Error('--script requires a path');
  const source = fs.readFileSync(script, 'utf8');
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const samples = [];
  try {
    for (const [repetitions, separateNodes] of [[500, false], [1000, false], [2000, false], [2000, true]]) {
      const page = await browser.newPage();
      const text = separateNodes ? Array.from({ length: repetitions }, () => '<p>alpha </p>').join('') : `<p>${'alpha '.repeat(repetitions)}</p>`;
      await page.setContent(`<p id="choose">alpha</p>${text}`);
      await page.evaluate(() => {
        const store = { hl_keywords: [], hl_auto_search: false };
        window.GM_getValue = (key, fallback) => store[key] ?? fallback;
        window.GM_setValue = (key, value) => { store[key] = value; };
        window.GM_addStyle = css => { const el = document.createElement('style'); el.textContent = css; document.head.append(el); };
        window.GM_registerMenuCommand = () => {};
      });
      await page.addScriptTag({ content: source });
      const synchronousMs = await page.evaluate(() => {
        const range = document.createRange(); range.selectNodeContents(document.getElementById('choose'));
        getSelection().removeAllRanges(); getSelection().addRange(range);
        window.__benchmarkStart = performance.now();
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'H', altKey: true, shiftKey: true, bubbles: true, cancelable: true }));
        return performance.now() - window.__benchmarkStart;
      });
      await page.waitForFunction(expected => CSS.highlights.get('slim-page')?.size === expected && document.getElementById('page-list')?.getAttribute('aria-busy') !== 'true', repetitions + 1, { timeout: 15000 });
      const result = await page.evaluate(() => ({ readyMs: performance.now() - window.__benchmarkStart, matches: CSS.highlights.get('slim-page').size }));
      samples.push({ repetitions, separateNodes, synchronousMs, ...result });
      await page.close();
    }
  } finally { await browser.close(); }
  console.log(JSON.stringify({ script: path.basename(script), samples }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
