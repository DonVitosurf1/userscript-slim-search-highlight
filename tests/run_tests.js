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

async function open(browser, { html = paragraphs(10), keywords = KW, url = null, panelOpen = false, store = {}, locale = 'de-DE' } = {}) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, locale });
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
        ok(/@name\s+Slim Search Highlight\s*\n/.test(header), '@name ohne Versionsnummer erwartet');
        ok(!header.includes('data:'), '@icon darf kein Data-URI enthalten (Logo steht schon im Skript)');
        ok(SRC.split('data:image/svg+xml').length - 1 === 1, 'Logo genau einmal im Skript erwartet');
        ok(/@description:de /.test(header), 'Deutsche @description:de fehlt');
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

    async language_auto_english(browser) {
        const page = await open(browser, { panelOpen: true, locale: 'en-US' });
        await settled(page);
        eq(await page.locator('#add-kw-btn').textContent(), 'Add');
        eq(await page.locator('#slim-hl-toggle').getAttribute('title'), 'Open highlight panel');
    },

    async language_auto_german(browser) {
        const page = await open(browser, { panelOpen: true, locale: 'de-DE' });
        await settled(page);
        eq(await page.locator('#add-kw-btn').textContent(), 'Hinzufügen');
    },

    async language_other_locale_falls_back_to_english(browser) {
        const page = await open(browser, { panelOpen: true, locale: 'fr-FR' });
        await settled(page);
        eq(await page.locator('#add-kw-btn').textContent(), 'Add');
    },

    async language_setting_switches_and_persists(browser) {
        const page = await open(browser, { panelOpen: true, locale: 'en-US' });
        await settled(page);
        await page.selectOption('#ui-lang', 'de');
        eq(await page.locator('#add-kw-btn').textContent(), 'Hinzufügen');
        eq(await page.evaluate(() => window.__store.hl_lang), 'de', 'gespeicherte Sprache');
        eq(await page.locator('#ui-lang').inputValue(), 'de');
    },

    async language_stored_choice_beats_browser_locale(browser) {
        const page = await open(browser, { panelOpen: true, locale: 'en-US', store: { hl_lang: 'de' } });
        await settled(page);
        eq(await page.locator('#add-kw-btn').textContent(), 'Hinzufügen');
    },

    async click_on_add_highlights_immediately(browser) {
        const page = await open(browser, { html: '<p>hello world hello</p>', keywords: [], panelOpen: true });
        await page.waitForTimeout(300);
        await page.fill('#new-kw', 'hello');
        await page.click('#add-kw-btn');
        await page.waitForFunction(() => document.querySelectorAll('.slim-hl').length === 2, null, { timeout: 3000 });
    },

    async keyword_added_during_highlight_run_is_not_lost(browser) {
        const page = await open(browser, { html: paragraphs(800), panelOpen: true });
        await page.fill('#new-kw', 'eiusmod');
        await page.click('#add-kw-btn');
        await page.waitForFunction(() => document.querySelectorAll('.slim-hl[data-kw="eiusmod"]').length === 800, null, { timeout: 20000 });
    },

    async unicode_and_symbol_keywords_match(browser) {
        const page = await open(browser, {
            html: '<p id="t">Die Übung und C++ und über und #tag, aber Übungen nicht</p>',
            keywords: ['Übung', 'C++', 'über', '#tag'].map(text => ({ text, color: '#ff0' })),
        });
        await settled(page);
        eq(await page.evaluate(() => [...document.querySelectorAll('#t .slim-hl')].map(e => e.textContent).join('|')), 'Übung|C++|über|#tag');
    },

    async enabling_after_disabled_start_observes_new_content(browser) {
        const page = await open(browser, { html: '<p>hello</p>', keywords: [{ text: 'hello', color: '#ff0' }], panelOpen: true, store: { hl_enabled: false } });
        await page.waitForTimeout(300);
        await page.click('#chk-enabled');
        await page.waitForFunction(() => document.querySelectorAll('.slim-hl').length === 1, null, { timeout: 3000 });
        await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<p id="n">hello later</p>'));
        await page.waitForFunction(() => document.querySelectorAll('#n .slim-hl').length === 1, null, { timeout: 3000 });
    },

    async previous_from_start_goes_to_last_match(browser) {
        const page = await open(browser, { html: '<p>a1 x a1 y a1 z a1</p>', keywords: [{ text: 'a1', color: '#ff0' }], panelOpen: true });
        await settled(page);
        await page.keyboard.press('Alt+ArrowLeft');
        eq(await page.textContent('#hl-counter'), '4 / 4');
    },

    async fast_navigation_leaves_no_stale_outlines(browser) {
        const page = await open(browser, { html: '<p>a1 x a1 y a1 z a1</p>', keywords: [{ text: 'a1', color: '#ff0' }], panelOpen: true });
        await settled(page);
        for (let i = 0; i < 3; i++) await page.keyboard.press('Alt+ArrowRight');
        await page.waitForTimeout(1000);
        eq(await page.evaluate(() => [...document.querySelectorAll('.slim-hl')].filter(e => e.style.outline).length), 0, 'Elemente mit hängender Umrandung');
    },

    async panel_css_does_not_leak_into_page(browser) {
        const page = await open(browser, { html: '<input type="text" id="x"><label id="l">L</label><button class="btn" id="b">B</button>', keywords: [], panelOpen: true });
        await page.waitForTimeout(300);
        const r = await page.evaluate(() => {
            const cs = id => getComputedStyle(document.getElementById(id));
            return { label: cs('l').display, bg: cs('x').backgroundColor, btn: cs('b').backgroundColor };
        });
        ok(r.label !== 'flex', `<label> der Seite wurde umgestylt (${r.label})`);
        ok(r.bg !== 'rgb(34, 34, 34)', `Textfeld der Seite wurde umgestylt (${r.bg})`);
        ok(r.btn !== 'rgb(45, 45, 45)', `.btn der Seite wurde umgestylt (${r.btn})`);
    },

    async malformed_hash_does_not_break_highlighting(browser) {
        const page = await open(browser, { html: '<p id="t">hello en</p>', keywords: [{ text: 'hello', color: '#ff0' }], url: 'http://example.test/page#hl=100%' });
        await settled(page);
        eq(await page.evaluate(() => document.querySelectorAll('#t .slim-hl').length), 1, 'Treffer trotz kaputtem Hash');
        ok(!(page.__errors || []).length, `Seitenfehler: ${(page.__errors || []).join(', ')}`);
        await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<p id="n">hello later</p>'); });
        await page.waitForFunction(() => document.querySelectorAll('#n .slim-hl').length === 1, null, { timeout: 4000 });
    },

    async hash_parameter_must_be_anchored(browser) {
        const bad = await open(browser, { html: '<p id="t">en</p>', keywords: [], url: 'http://example.test/page#foo&xhl=en' });
        await bad.waitForTimeout(600);
        eq(await bad.evaluate(() => document.querySelectorAll('.slim-hl').length), 0, 'xhl= ist kein Suchparameter');
        const good = await open(browser, { html: '<p id="t">en</p>', keywords: [], url: 'http://example.test/page#hl=en' });
        await settled(good);
        eq(await good.evaluate(() => document.querySelectorAll('.slim-hl').length), 1, '#hl=en');
    },

    async save_only_writes_changed_values(browser) {
        const page = await open(browser, { panelOpen: true });
        await settled(page);
        await page.evaluate(() => { window.__store.hl_keywords = [{ text: 'vom-anderen-tab', color: '#ff0' }]; window.__store.hl_blacklist = ['andere.tld']; });
        await page.click('#btn-min');
        eq(await page.evaluate(() => window.__store.hl_keywords[0].text), 'vom-anderen-tab', 'Keywords aus anderem Tab überschrieben');
        eq(await page.evaluate(() => window.__store.hl_blacklist[0]), 'andere.tld', 'Blacklist aus anderem Tab überschrieben');
        ok(await page.evaluate(() => window.__store.hl_panel_state.minimized === true), 'eigene Änderung wurde nicht gespeichert');
    },

    async arrow_keys_untouched_without_matches_or_on_blacklist(browser) {
        const probe = page => page.evaluate(() => {
            const e = new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, cancelable: true, bubbles: true });
            document.dispatchEvent(e);
            return e.defaultPrevented;
        });
        const blacklisted = await open(browser, { html: '<p>hello</p>', keywords: [{ text: 'hello', color: '#ff0' }], url: 'http://example.test/', store: { hl_blacklist: ['example.test'] } });
        await blacklisted.waitForTimeout(500);
        eq(await probe(blacklisted), false, 'Alt+← auf Blacklist-Seite abgefangen');
        const none = await open(browser, { html: '<p>nichts</p>', keywords: [{ text: 'hello', color: '#ff0' }] });
        await none.waitForTimeout(500);
        eq(await probe(none), false, 'Alt+← ohne Treffer abgefangen');
        const some = await open(browser, { html: '<p>hello</p>', keywords: [{ text: 'hello', color: '#ff0' }] });
        await settled(some);
        eq(await probe(some), true, 'Alt+← mit Treffern wird nicht abgefangen');
    },

    async blacklisted_page_ignores_alt_h(browser) {
        const page = await open(browser, { html: '<p id="t">geheim</p>', keywords: [], url: 'http://example.test/', store: { hl_blacklist: ['example.test'] } });
        await page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById('t')); getSelection().removeAllRanges(); getSelection().addRange(r); });
        await page.keyboard.press('Alt+h');
        eq(await page.evaluate(() => window.__store.hl_keywords.length), 0, 'Alt+H hat auf Blacklist-Seite ein Keyword gespeichert');
    },

    async skipped_tags_are_respected_at_any_depth(browser) {
        const page = await open(browser, {
            html: '<pre><span id="a">hello</span></pre><code><span id="b">hello</span></code><select><option id="c">hello</option></select>' +
                  '<div contenteditable="true"><span id="e">hello</span></div><style id="s"></style><p id="d">hello</p>',
            keywords: [{ text: 'hello', color: '#ff0' }],
        });
        await settled(page);
        await page.evaluate(() => { document.getElementById('s').appendChild(document.createTextNode('.hello { color: red }')); });
        await page.waitForTimeout(900);
        const where = await page.evaluate(() => [...document.querySelectorAll('.slim-hl')].map(e => e.parentElement.id).join(','));
        eq(where, 'd', 'markierte Elternelemente');
        eq(await page.evaluate(() => document.getElementById('s').children.length), 0, '<style> wurde verändert');
    },

    async split_remainders_are_not_rescanned(browser) {
        const page = await open(browser, {
            html: '<p id="t">prefix</p>',
            keywords: [{ text: 'pre', color: '#ff0', wholeWord: false }, { text: 'fix', color: '#0ff' }],
        });
        await settled(page);
        eq(await page.evaluate(() => [...document.querySelectorAll('#t .slim-hl')].map(e => e.textContent).join(',')), 'pre', 'Treffer in „prefix“');
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
