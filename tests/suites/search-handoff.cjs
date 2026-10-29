'use strict';

module.exports = ({ SRC, open, settled, hits, eq, ok }) => {
    const google = (browser, options = {}) => open(browser, {
        url: 'https://www.google.com/search?q=Solarenergie', keywords: [],
        html: '<textarea name="q">Solarenergie</textarea><a id="result" href="https://article.test/energy"><h3><span id="result-text">Ergebnis</span></h3></a>',
        ...options,
    });
    const activate = (page, type = 'click', fields = {}) => page.evaluate(([type, fields]) => {
        const link = document.getElementById('result');
        link.addEventListener(type, event => { window.__blockedNavigation = event.defaultPrevented; event.preventDefault(); }, { once: true });
        document.getElementById('result-text').dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: type === 'auxclick' ? 1 : type === 'contextmenu' ? 2 : 0, ...fields }));
        return window.__blockedNavigation;
    }, [type, fields]);
    const store = page => page.evaluate(() => window.__store);
    const destination = (browser, data, options = {}) => open(browser, {
        url: 'https://article.test/energy', keywords: [], store: data,
        html: '<p>Solarenergie hilft. Solarenergie spart Energie. Windkraft hilft ebenfalls.</p>',
        ...options,
    });
    // Actual HTTP navigation between two local origins, with shared GM bindings.
    // A local server also covers middle-click popups whose initial request can
    // bypass Playwright routing in Chromium. No external service is contacted.
    const realNavigation = async (browser, middleClick) => {
        const http = require('node:http');
        const context = await browser.newContext();
        const data = { hl_keywords: [], hl_auto_search: true };
        let received, targetURL;
        const handoff = new Promise(resolve => { received = resolve; });
        await context.exposeBinding('__gmSet', (_, key, value) => {
            data[key] = structuredClone(value);
            if (key === 'hl_search_handoffs' && value.entries.some(entry => entry.target === targetURL)) received();
        });
        const server = http.createServer(async (request, response) => {
            try {
                const url = new URL(request.url, 'http://' + request.headers.host);
                if (url.pathname === '/fixture.user.js') {
                    response.writeHead(200, { 'Content-Type': 'application/javascript' }); response.end(SRC); return;
                }
                if (url.hostname === 'article.localhost') {
                    let timer;
                    try { await Promise.race([handoff, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('No native handoff')), 3000); })]); }
                    finally { clearTimeout(timer); }
                }
                const body = url.hostname === 'www.google.com'
                    ? '<textarea name="q">alteSuche</textarea><a id="result" href="' + targetURL + '"><h3><span>Ergebnis öffnen</span></h3></a>'
                    : '<p>Solarenergie hilft. Solarenergie spart Energie.</p>';
                const bootstrap = `<script>
                    const data=${JSON.stringify(data)};
                    window.GM_getValue=(key,fallback)=>structuredClone(data[key]??fallback);
                    window.GM_setValue=(key,value)=>{data[key]=structuredClone(value);void window.__gmSet?.(key,value)};
                    window.GM_addStyle=css=>{const style=document.createElement('style');style.textContent=css;document.head.append(style)};
                    window.GM_registerMenuCommand=()=>{};
                    </script>`;
                response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'no-referrer' });
                response.end('<!doctype html>' + bootstrap + '<body>' + body + '<script src="/fixture.user.js"></script></body>');
            } catch (error) { response.writeHead(503); response.end(error.message); }
        });
        await new Promise(resolve => server.listen(0, resolve));
        try {
            const port = server.address().port;
            targetURL = 'http://article.localhost:' + port + '/energy';
            const source = await context.newPage();
            await source.goto('http://www.google.com:' + port + '/search?q=alteSuche');
            await source.locator('#slim-hl-ui').waitFor({state:'attached'});
            await source.evaluate(() => {
                history.replaceState({}, '', '/search?q=Solarenergie');
                document.querySelector('[name=q]').value = 'Solarenergie';
            });
            eq(await source.locator('#result').getAttribute('href'), targetURL, 'Keine URL-Umschreibung');
            let target = source;
            if (middleClick) {
                const popup = context.waitForEvent('page');
                await source.locator('#result').click({ button: 'middle' }); target = await popup;
                await target.waitForURL(targetURL);
                await target.waitForLoadState('domcontentloaded');
                await target.bringToFront();
            } else {
                await Promise.all([source.waitForURL(targetURL), source.locator('#result').click()]);
            }
            await settled(target, 2500);
            eq(target.url(), targetURL);
            eq(await hits(target), 2, 'Aktuelle Suchwörter nach echter Navigation');
            eq(await target.evaluate(() => document.referrer), '', 'Browser respektiert no-referrer');
        } finally {
            await context.close();
            server.closeAllConnections();
            await new Promise(resolve => server.close(resolve));
        }
    };
    return {
        async search_handoff_native_cross_origin_navigation(browser) {
            await realNavigation(browser, false);
        },
        async search_handoff_native_middle_click_opens_highlighted_tab(browser) {
            await realNavigation(browser, true);
        },
        async search_handoff_spa_query_is_fresh_at_result_click(browser) {
            const source = await google(browser, { url: 'https://www.google.com/search?q=alteSuche' });
            await source.evaluate(() => {
                history.replaceState({}, '', '/search?q=Solarenergie');
                document.querySelector('[name=q]').value = 'Solarenergie';
            });
            eq(await activate(source), false, 'Nativer Klick wird nicht blockiert');
            const target = await destination(browser, await store(source));
            await settled(target, 2000);
            eq(await hits(target), 2, 'Aktuelle Suchwörter kommen ohne Referrer an');
            eq(await target.evaluate(() => document.referrer), '');
            eq(await target.evaluate(() => window.__store.hl_keywords.length), 0, 'Keine dauerhaften Keywords angelegt');
        },
        async search_handoff_renews_expired_search_on_middle_click(browser) {
            const source = await google(browser);
            await source.evaluate(() => { window.__store.hl_cross_terms.timestamp = Date.now() - 20 * 60 * 1000; });
            eq(await activate(source, 'auxclick'), false, 'Mittelklick bleibt nativ');
            const target = await destination(browser, await store(source));
            await settled(target, 2000); eq(await hits(target), 2);
        },
        async search_handoff_context_menu_and_modified_click_are_native(browser) {
            for (const [type, fields] of [['contextmenu', {}], ['click', { ctrlKey: true }], ['click', { metaKey: true }]]) {
                const source = await google(browser, { url: 'https://www.google.com/search?q=veraltet' });
                await source.evaluate(() => history.replaceState({}, '', '/search?q=Solarenergie'));
                eq(await activate(source, type, fields), false, type + ' bleibt nativ');
                const target = await destination(browser, await store(source));
                await settled(target, 2000); eq(await hits(target), 2);
            }
        },
        async search_handoff_distinguishes_concurrent_destinations(browser) {
            const first = await google(browser);
            await activate(first);
            const second = await google(browser, { url: 'https://www.google.com/search?q=Windkraft', store: await store(first) });
            await second.evaluate(() => { document.getElementById('result').href = 'https://article.test/wind'; });
            await activate(second);
            const data = await store(second);
            const solar = await destination(browser, data);
            await settled(solar, 2000); eq(await hits(solar), 2, 'Spätere Suche überschreibt das erste Ziel nicht');
            const wind = await destination(browser, data, { url: 'https://article.test/wind' });
            await settled(wind, 2000); eq(await hits(wind), 1);
        },
        async search_handoff_matches_exact_destination_not_substring(browser) {
            const source = await google(browser); await activate(source);
            const other = await destination(browser, await store(source), { url: 'https://article.test/energy-other' });
            await other.waitForTimeout(350);
            eq(await hits(other), 0, 'Kein Übertragen auf eine unbeteiligte Seite');
        },
        async search_handoff_unwraps_google_result_redirect(browser) {
            const source = await google(browser, { url: 'https://www.google.com/search?q=alt' });
            await source.evaluate(() => {
                history.replaceState({}, '', '/search?q=Solarenergie');
                document.getElementById('result').href = '/url?url=' + encodeURIComponent('https://article.test/energy#section');
            });
            await activate(source);
            const target = await destination(browser, await store(source));
            await settled(target, 2000); eq(await hits(target), 2, 'Google-Weiterleitung wird dem Artikel zugeordnet');
        },
        async search_handoff_uses_live_input_only_without_url_query(browser) {
            const fallback = await google(browser, { url: 'https://www.google.com/search' });
            await activate(fallback);
            const target = await destination(browser, await store(fallback));
            await settled(target, 2000); eq(await hits(target), 2, 'Suchfeld als Fallback');
            const source = await google(browser);
            await source.evaluate(() => { document.querySelector('[name=q]').value = 'UnabgeschickterEntwurf'; });
            await activate(source);
            const actual = await destination(browser, await store(source));
            await settled(actual, 2000); eq(await hits(actual), 2, 'Bestätigte URL hat Vorrang vor einem Entwurf');
        },
        async search_handoff_opt_out_does_not_store_or_apply_queries(browser) {
            const source = await google(browser, { store: { hl_auto_search: false } });
            await activate(source);
            const data = await store(source);
            eq('hl_cross_terms' in data, false, 'Automatische Speicherung abgeschaltet');
            eq('hl_search_handoffs' in data, false, 'Keine Übergaben bei Opt-out');
            const target = await destination(browser, data); await target.waitForTimeout(350);
            eq(await hits(target), 0);
        },
        async search_handoff_empty_query_cannot_reuse_previous_words(browser) {
            const source = await google(browser);
            await source.evaluate(() => {
                history.replaceState({}, '', '/search?q=');
                document.querySelector('[name=q]').value = '';
            });
            await activate(source);
            const target = await destination(browser, await store(source)); await target.waitForTimeout(350);
            eq(await hits(target), 0, 'Leere Suche übernimmt keine alten Wörter');
        },
        async search_handoff_storage_failure_does_not_block_navigation(browser) {
            const source = await google(browser);
            await source.evaluate(() => { window.GM_setValue = () => { throw Error('quota'); }; });
            eq(await activate(source), false);
            eq((source.__errors || []).length, 0, 'Speicherfehler bleibt behandelt');
        },
        async search_handoff_accepts_origin_only_referrer_without_query(browser) {
            const source = await google(browser); await activate(source);
            const target = await destination(browser, await store(source), { referrer: 'https://www.google.com/' });
            await settled(target, 2000); eq(await hits(target), 2);
            eq(await target.evaluate(() => document.referrer), 'https://www.google.com/');
        },
        async search_handoff_expired_records_are_not_reused(browser) {
            const source = await google(browser); await activate(source);
            const data = await store(source);
            data.hl_cross_terms.timestamp = Date.now() - 20 * 60 * 1000;
            for (const entry of data.hl_search_handoffs.entries) entry.timestamp = data.hl_cross_terms.timestamp;
            const target = await destination(browser, data, { referrer: 'https://www.google.com/' });
            await target.waitForTimeout(350); eq(await hits(target), 0);
        },
        async search_handoff_retains_only_twelve_recent_destinations(browser) {
            const source = await google(browser);
            for (let i = 0; i < 16; i++) {
                await source.evaluate(i => { document.getElementById('result').href = 'https://article.test/entry' + i; }, i);
                await activate(source);
            }
            const data = (await store(source)).hl_search_handoffs;
            eq(data.version, 1); eq(data.entries.length, 12);
            eq(data.entries[0].target, 'https://article.test/entry15');
            ok(!data.entries.some(entry => entry.target.endsWith('/entry0')), 'Älteste Übergabe verworfen');
        },
        async search_handoff_unknown_schema_is_preserved(browser) {
            const unknown = { version: 99, entries: [{ future: 'keep' }] };
            const source = await google(browser, { store: { hl_search_handoffs: unknown } });
            eq(await activate(source), false);
            eq(JSON.stringify((await store(source)).hl_search_handoffs), JSON.stringify(unknown));
            eq((source.__errors || []).length, 0);
        },
        async search_handoff_initial_cache_failure_keeps_panel_available(browser) {
            const context = await browser.newContext();
            await context.addInitScript(() => {
                Object.defineProperty(window, 'GM_setValue', { get: () => () => { throw Error('quota'); }, set: () => {} });
            });
            const source = await google(context);
            eq(await source.locator('#slim-hl-toggle').count(), 1, 'Initialer Speicherfehler bricht die Anwendung nicht ab');
            eq((source.__errors || []).length, 0);
        },
    };
};
