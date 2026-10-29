'use strict';
module.exports = ({ SRC, paragraphs, open, hits, settled, eq, ok }) => ({
    async header_metadata() {
        const header = SRC.slice(0, SRC.indexOf('==/UserScript=='));
        for (const key of ['@noframes', '@updateURL', '@downloadURL', '@author', '@license', '@homepageURL', '@supportURL']) {
            ok(header.includes(key), `Header ohne ${key}`);
        }
        ok(/@name\s+Slim Search Highlight\s*\n/.test(header), '@name ohne Versionsnummer erwartet');
        ok(!header.includes('data:'), '@icon darf kein Data-URI enthalten (Logo steht schon im Skript)');
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
        await page.locator('#settings-section').evaluate(el => { el.open = true; });
        await page.locator('#chk-enabled').click();
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
        await page.locator('#settings-section > summary').click();
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
        await page.locator('#settings-section > summary').click();
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
        const probe = async page => {
            await page.evaluate(() => {
                const handler = event => {
                    if(event.key !== 'ArrowLeft') return;
                    window.__prevented = event.defaultPrevented;
                    event.preventDefault(); document.removeEventListener('keydown',handler);
                };
                document.addEventListener('keydown',handler);
            });
            await page.keyboard.press('Alt+ArrowLeft');
            return page.evaluate(()=>window.__prevented);
        };
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

    async auto_search_setting_is_respected(browser) {
        const terms = { terms: ['hello'], timestamp: Date.now() };
        const on = await open(browser, { html: '<p>hello</p>', keywords: [], store: { hl_cross_terms: terms, hl_auto_search: true } });
        await settled(on);
        eq(await hits(on), 1, 'Übernahme aus der Suche (an)');
        const off = await open(browser, { html: '<p>hello</p>', keywords: [], store: { hl_cross_terms: terms, hl_auto_search: false } });
        await off.waitForTimeout(700);
        eq(await hits(off), 0, 'Übernahme aus der Suche (aus)');
    },

    async history_button_works_even_when_auto_search_is_off(browser) {
        const page = await open(browser, { html: '<p>hello world</p>', keywords: [], panelOpen: true, store: { hl_auto_search: false, hl_search_history: ['hello'] } });
        await page.waitForTimeout(400);
        await page.locator('#history-details > summary').click();
        await page.evaluate(()=>Object.entries(window.__menus).find(([name])=>name.endsWith(': hello'))[1]());
        await page.waitForFunction(() => document.querySelectorAll('.slim-hl').length === 1, null, { timeout: 3000 });
    },

    async edited_keyword_loses_stale_regex_flag(browser) {
        const page = await open(browser, { html: '<p id="t">abc</p>', keywords: [{ text: 'abc', color: '#ff0', regex: true }] });
        await settled(page);
        eq(await page.evaluate(() => document.querySelectorAll('#t .slim-hl').length), 1, 'Keyword mit altem regex-Flag');
    },

    async editing_keyword_text_updates_regex_flag(browser) {
        const page = await open(browser, { html: '<p id="t">abc ABC</p>', keywords: [{ text: '/abc/i', color: '#ff0', regex: true }], panelOpen: true });
        await settled(page);
        await page.fill('.kw-item input[type=text]', 'abc');
        await page.locator('.kw-item input[type=text]').press('Enter');
        await page.waitForTimeout(500);
        eq(await page.evaluate(() => window.__store.hl_keywords[0].regex), false, 'regex-Flag nach Umbenennen');
        eq(await page.evaluate(() => document.querySelectorAll('#t .slim-hl').length), 2);
    },

    async content_added_during_a_run_is_not_lost(browser) {
        const page = await open(browser, { html: paragraphs(2500), panelOpen: true });
        await settled(page);
        await page.fill('#new-kw', 'eiusmod');
        await page.click('#add-kw-btn');
        await page.waitForFunction(() => document.querySelectorAll('.slim-hl[data-kw="eiusmod"]').length > 0);
        await page.evaluate(() => { document.body.insertAdjacentHTML('afterbegin', '<p id="late">lorem</p>'); });
        await page.waitForFunction(() => document.querySelectorAll('.slim-hl[data-kw="eiusmod"]').length === 2500, null, { timeout: 20000 });
        await page.waitForTimeout(800);
        eq(await page.evaluate(() => document.querySelectorAll('#late .slim-hl').length), 1, 'während des Durchlaufs eingefügter Inhalt');
    },

    async own_page_title_counter_keeps_page_prefix(browser) {
        const page = await open(browser, { html: '<title>x</title><p>lorem</p>', panelOpen: true });
        await page.evaluate(() => { document.title = '(3) Inbox'; });
        await page.locator('#settings-section').evaluate(el => { el.open = true; }); await page.locator('#chk-enabled').click();
        await page.locator('#settings-section').evaluate(el => { el.open = true; }); await page.locator('#chk-enabled').click();
        await settled(page);
        eq(await page.evaluate(() => document.title), '(1) (3) Inbox', 'Titel mit Zähler');
        await page.locator('#settings-section').evaluate(el => { el.open = true; }); await page.locator('#chk-enabled').click();
        eq(await page.evaluate(() => document.title), '(3) Inbox', 'Titel nach Deaktivieren');
    },

    async scroll_does_not_rebuild_position_bar(browser) {
        const page = await open(browser, { html: paragraphs(200) });
        await settled(page);
        await page.evaluate(() => { document.querySelector('#slim-pos-bar .mark').id = 'first-mark'; });
        await page.mouse.wheel(0, 1500);
        await page.waitForTimeout(400);
        ok(await page.evaluate(() => !!document.getElementById('first-mark')), 'Positionsleiste wurde beim Scrollen neu aufgebaut');
    },

    async keyword_edit_survives_background_updates(browser) {
        const page = await open(browser, { html: paragraphs(20), panelOpen: true });
        await settled(page);
        await page.focus('.kw-item input[type=text]');
        await page.keyboard.press('End');
        await page.keyboard.type('zusatz');
        await page.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<p>lorem noch mehr</p>'); });
        await page.waitForTimeout(800);
        eq(await page.evaluate(() => document.activeElement && document.activeElement.value), 'loremzusatz', 'Eingabe im Keyword-Feld verloren');
    },

    async match_list_is_capped(browser) {
        const page = await open(browser, { html: paragraphs(800), panelOpen: true });
        await settled(page);
        await page.waitForTimeout(500);
        const n = await page.evaluate(() => document.querySelectorAll('#match-list > *').length);
        ok(n <= 301, `Trefferliste hat ${n} Einträge (Limit 301)`);
    },
});
