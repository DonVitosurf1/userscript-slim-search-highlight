'use strict';
/* Automatische Tests für slim-search-highlight.user.js
 *
 * Voraussetzung (einmalig):  npm install && npx playwright install chromium
 * Aufruf:  node tests/run_tests.js          # alle Tests
 *          node tests/run_tests.js -k perf  # nur Tests, deren Name den Text enthält
 *
 * Kein Netzwerk nötig: alle Seiten sind synthetisch. Das Userscript wird mit einer kleinen
 * GM_*-Nachbildung geladen; Aufrufe von GM_setValue und createTreeWalker werden mitgezählt.
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'userscript', 'slim-search-highlight.user.js'), 'utf8');
const KW = [
    { text: 'lorem', color: '#ffe082' },
    { text: 'ipsum', color: '#90caf9' },
    { text: 'dolor', color: '#a5d6a7' },
];

const paragraphs = n => Array.from({ length: n }, (_, i) =>
    `<p>Lorem ipsum dolor sit amet <b>consectetur</b> adipiscing elit ${i} sed do eiusmod tempor lorem.</p>`).join('');

async function open(browser, { html = paragraphs(10), keywords = KW, url = null, panelOpen = false, store = {} } = {}) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    page.on('pageerror', e => { page.__errors = (page.__errors || []).concat(e.message); });
    await page.addInitScript(([kw, panelOpen, extra]) => {
        const store = Object.assign({ hl_keywords: kw, hl_panel_state: { open: panelOpen, minimized: false } }, extra);
        window.__store = store; window.__sets = 0; window.__walkers = 0;
        window.GM_getValue = (k, d) => (k in store ? JSON.parse(JSON.stringify(store[k])) : d);
        window.GM_setValue = (k, v) => { window.__sets++; store[k] = v; };
        window.GM_addStyle = css => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
        window.GM_registerMenuCommand = () => {};
        const orig = Document.prototype.createTreeWalker;
        Document.prototype.createTreeWalker = function (...a) { window.__walkers++; return orig.apply(this, a); };
    }, [keywords, panelOpen, store]);
    if (url) {
        await page.route('**/*', r => r.fulfill({ contentType: 'text/html', body: `<body>${html}</body>` }));
        await page.goto(url);
    } else {
        await page.goto('about:blank');
        await page.setContent(`<body>${html}</body>`);
    }
    await page.addScriptTag({ content: SRC });
    return page;
}

const hits = page => page.evaluate(() => document.querySelectorAll('.slim-hl').length);

/** Wartet, bis die Trefferzahl 400 ms lang unverändert (und > 0) ist. */
async function settled(page, timeout = 60000) {
    await page.waitForFunction(() => {
        const n = document.querySelectorAll('.slim-hl').length;
        if (n > 0 && window.__n === n && Date.now() - window.__t > 400) return true;
        if (window.__n !== n) { window.__n = n; window.__t = Date.now(); }
        return false;
    }, null, { polling: 50, timeout });
}

function eq(a, b, msg) { if (a !== b) throw new Error(`${msg || 'eq'}: erwartet ${b}, erhalten ${a}`); }
function ok(c, msg) { if (!c) throw new Error(msg || 'assertion failed'); }

const tests = {
    async header_metadata() {
        const header = SRC.slice(0, SRC.indexOf('==/UserScript=='));
        for (const key of ['@noframes', '@updateURL', '@downloadURL', '@author', '@license', '@homepageURL', '@supportURL']) {
            ok(header.includes(key), `Header ohne ${key}`);
        }
    },

    async perf_initial_highlight(browser) {
        const page = await open(browser, { html: paragraphs(800), panelOpen: true });
        const t0 = Date.now();
        await settled(page);
        const ms = Date.now() - t0;
        eq(await hits(page), 3200, 'Treffer (4 pro Absatz)');
        ok(ms < 3000, `Initiales Highlighting ${ms} ms (Limit 3000)`);
    },

    async perf_navigation(browser) {
        const page = await open(browser, { html: paragraphs(800), panelOpen: true });
        await settled(page);
        const t0 = Date.now();
        for (let i = 0; i < 5; i++) await page.keyboard.press('Alt+ArrowRight');
        const ms = Date.now() - t0;
        ok(ms < 2500, `5x Navigation ${ms} ms (Limit 2500)`);
    },

    async no_rebuild_after_navigation_or_scroll(browser) {
        const page = await open(browser, { html: paragraphs(300), panelOpen: true });
        await settled(page);
        await page.evaluate(() => { window.__walkers = 0; });
        for (let i = 0; i < 3; i++) await page.keyboard.press('Alt+ArrowRight');
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(1200);
        eq(await page.evaluate(() => window.__walkers), 0, 'Komplett-Neuaufbau durch eigene DOM-Änderungen');
    },

    async incremental_update_keeps_existing_marks(browser) {
        const page = await open(browser, { html: paragraphs(50) });
        await settled(page);
        await page.evaluate(() => { document.querySelector('.slim-hl').id = 'first-mark'; window.__walkers = 0; });
        await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<p id="added">neu: lorem ipsum</p>'); });
        await page.waitForFunction(() => document.querySelectorAll('#added .slim-hl').length === 2, null, { timeout: 5000 });
        ok(await page.evaluate(() => !!document.getElementById('first-mark')), 'Bestehende Markierung wurde neu aufgebaut');
    },

    async drag_saves_only_on_release(browser) {
        const page = await open(browser, { panelOpen: true });
        await settled(page);
        await page.evaluate(() => { window.__sets = 0; });
        const box = await page.locator('#slim-hl-header').boundingBox();
        await page.mouse.move(box.x + 20, box.y + 10);
        await page.mouse.down();
        for (let i = 0; i < 30; i++) await page.mouse.move(box.x + 20 + i * 3, box.y + 10 + i);
        await page.mouse.up();
        const sets = await page.evaluate(() => window.__sets);
        ok(sets > 0 && sets <= 10, `GM_setValue-Aufrufe beim Verschieben: ${sets} (Limit 10)`);
    },

    async zero_length_regex_does_not_hang(browser) {
        const page = await open(browser, { keywords: [{ text: '/x*/', color: '#ff0', regex: true }] });
        const r = await Promise.race([
            page.evaluate(() => document.body.textContent.length),
            new Promise(res => setTimeout(() => res('hang'), 5000)),
        ]);
        ok(r !== 'hang', 'Seite hängt bei Regex mit leeren Treffern');
    },

    async regex_without_g_flag_marks_all(browser) {
        const page = await open(browser, { html: '<p id="t">lorem und noch ein Lorem</p>', keywords: [{ text: '/lorem/i', color: '#ff0', regex: true }] });
        await settled(page);
        eq(await page.evaluate(() => document.querySelectorAll('#t .slim-hl').length), 2, 'Treffer pro Textknoten');
    },

    async search_engine_detected_by_host_only(browser) {
        const page = await open(browser, { url: 'http://example.test/google.html?q=geheimwort' });
        await page.waitForTimeout(300);
        ok(!(await page.evaluate(() => 'hl_cross_terms' in window.__store)), 'Nicht-Suchmaschine wurde als Suchmaschine erkannt');
        const page2 = await open(browser, { url: 'https://www.google.com/search?q=geheimwort' });
        await page2.waitForTimeout(300);
        ok(await page2.evaluate(() => 'hl_cross_terms' in window.__store), 'Google wurde nicht als Suchmaschine erkannt');
    },

    async disabling_restores_text_nodes(browser) {
        const page = await open(browser, { html: '<p id="t">lorem ipsum dolor</p>', panelOpen: true });
        await settled(page);
        await page.evaluate(() => { document.getElementById('chk-enabled').click(); });
        eq(await page.evaluate(() => document.getElementById('t').childNodes.length), 1, 'Textknoten nach Deaktivieren');
    },

    async all_matches_in_one_text_node(browser) {
        const page = await open(browser, { html: '<p id="t">lorem ipsum dolor lorem</p>' });
        await settled(page);
        eq(await page.evaluate(() => [...document.querySelectorAll('#t .slim-hl')].map(e => e.textContent).join(',')), 'lorem,ipsum,dolor,lorem');
        eq(await page.evaluate(() => document.getElementById('t').textContent), 'lorem ipsum dolor lorem', 'Text unverändert');
    },

    async overlapping_keywords_do_not_corrupt_text(browser) {
        const page = await open(browser, { html: '<p id="t">lorem ipsum</p>', keywords: [{ text: 'lorem ip', color: '#ff0', wholeWord: false }, { text: 'ipsum', color: '#0ff', wholeWord: false }] });
        await settled(page);
        eq(await page.evaluate(() => document.getElementById('t').textContent), 'lorem ipsum', 'Text nach Überlappung');
    },

    async match_list_is_capped(browser) {
        const page = await open(browser, { html: paragraphs(800), panelOpen: true });
        await settled(page);
        await page.waitForTimeout(500);
        const n = await page.evaluate(() => document.querySelectorAll('#match-list > *').length);
        ok(n <= 301, `Trefferliste hat ${n} Einträge (Limit 301)`);
    },
};

(async () => {
    const filter = process.argv.includes('-k') ? process.argv[process.argv.indexOf('-k') + 1] : '';
    const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
    let failed = 0;
    for (const [name, fn] of Object.entries(tests)) {
        if (filter && !name.includes(filter)) continue;
        const t0 = Date.now();
        try { await fn(browser); console.log(`PASS ${name} (${Date.now() - t0} ms)`); }
        catch (e) { failed++; console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`); }
    }
    await browser.close();
    console.log(failed ? `\n${failed} Test(s) fehlgeschlagen` : '\nAlle Tests bestanden');
    process.exit(failed ? 1 : 0);
})();
