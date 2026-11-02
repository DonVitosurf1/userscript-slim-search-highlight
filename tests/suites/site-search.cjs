'use strict';

module.exports = ({ SRC, open, eq, ok }) => {
    const origin = 'https://library.test';
    const html = '<form id="search" action="/search" role="search"><input type="search" name="q" value="Solarenergie"><button>Search</button></form><a id="result" href="/article">Read</a><p>Solarenergie Windkraft Draftword</p>';
    const page = (browser, options = {}) => open(browser, { keywords: [], url: origin + '/search', panelOpen: true, html, ...options });
    const store = page => page.evaluate(() => structuredClone(window.__store));
    const hits = page => page.locator('.slim-hl').count();
    const waitHits = (page, count) => page.waitForFunction(count => document.querySelectorAll('.slim-hl').length === count, count, { timeout: 4000 });
    async function toggle(page) {
        const checkbox = page.locator('#site-search-enabled');
        eq(await checkbox.count(), 1, 'Current-origin opt-in is available');
        await checkbox.evaluate(node => { for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) if (ancestor.tagName === 'DETAILS') ancestor.open = true; });
        await checkbox.click();
    }
    async function enabled(browser, options) { const source = await page(browser, options); await toggle(source); return source; }
    async function clickResult(source, button = 'left') {
        await source.locator('#result').evaluate(node => node.addEventListener('click', event => { window.__siteNativePrevented = event.defaultPrevented; event.preventDefault(); }, { once: true }));
        await source.locator('#result').click({ button });
    }
    async function submit(source, value) {
        await source.locator('#search').evaluate(node => node.addEventListener('submit', event => { window.__siteNativePrevented = event.defaultPrevented; event.preventDefault(); }, { once: true }));
        await source.locator('#search input:not([type=hidden])').fill(value);
        await source.locator('#search button').click();
    }
    async function nativeNavigation(browser, middleClick) {
        const http = require('node:http');
        const context = await browser.newContext();
        await context.addInitScript(require('../helpers/ui-driver.cjs'));
        const data = { hl_keywords: [], hl_panel_state: { open: true, minimized: false } };
        let received;
        const captured = new Promise(resolve => { received = resolve; });
        await context.exposeBinding('__gmSiteSet', (_, key, value) => {
            data[key] = structuredClone(value);
            if (key === 'hl_site_search_handoffs') received();
        });
        const server = http.createServer(async (request, response) => {
            if (request.url === '/fixture.js') { response.writeHead(200, { 'Content-Type': 'application/javascript' }); response.end(SRC); return; }
            if (request.url === '/article') {
                let timeout;
                try { await Promise.race([captured, new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Native handoff was not captured')), 3000); })]); }
                catch (error) { response.writeHead(503); response.end(error.message); return; }
                finally { clearTimeout(timeout); }
            }
            const bootstrap = '<script>const data=' + JSON.stringify(data) + ';window.GM_getValue=(key,fallback)=>structuredClone(data[key]??fallback);window.GM_setValue=(key,value)=>{data[key]=structuredClone(value);void window.__gmSiteSet(key,value)};window.GM_addStyle=css=>{const style=document.createElement("style");style.textContent=css;document.head.append(style)};window.GM_registerMenuCommand=()=>{};</script>';
            const body = request.url.startsWith('/search') ? '<a id="result" href="/article">Read</a><p>Solarenergie</p>' : '<p>Solarenergie Solarenergie</p>';
            response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'no-referrer' });
            response.end('<!doctype html>' + bootstrap + '<body>' + body + '<script src="/fixture.js"></script></body>');
        });
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            const base = 'http://127.0.0.1:' + server.address().port;
            const source = await context.newPage(); await source.goto(base + '/search?q=Solarenergie');
            await source.locator('#slim-hl-ui').waitFor({ state: 'attached' }); await toggle(source);
            eq(await source.locator('#result').getAttribute('href'), '/article', 'Host link is unchanged');
            let target = source;
            if (middleClick) {
                const popup = context.waitForEvent('page'); await source.locator('#result').click({ button: 'middle' }); target = await popup;
                await target.waitForURL(base + '/article'); await target.bringToFront();
            } else await Promise.all([source.waitForURL(base + '/article'), source.locator('#result').click()]);
            await waitHits(target, 2); eq(await target.evaluate(() => document.referrer), '');
        } finally { await context.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    }
    return {
        async site_search_native_result_navigation_without_referrer(browser) { await nativeNavigation(browser, false); },
        async site_search_native_middle_click_preserves_new_tab(browser) { await nativeNavigation(browser, true); },
        async site_search_is_default_off_and_enables_only_exact_origin(browser) {
            const source = await page(browser, { url: origin + '/search?q=Solarenergie' });
            eq(await hits(source), 0);
            await toggle(source); await waitHits(source, 1);
            const saved = await store(source);
            for (const url of ['https://sub.library.test/search?q=Solarenergie', 'http://library.test/search?q=Solarenergie', 'https://library.test:444/search?q=Solarenergie']) {
                const other = await page(browser, { url, store: saved });
                eq(await other.locator('#site-search-enabled').isChecked(), false); eq(await hits(other), 0);
            }
        },
        async site_search_recognizes_common_url_keys_and_empty_query(browser) {
            const source = await enabled(browser); const saved = await store(source);
            for (const key of ['q', 'query', 'search', 's', 'search_query', 'term', 'keyword', 'keywords']) {
                const target = await page(browser, { url: origin + '/search?' + key + '=Solarenergie', store: saved });
                await waitHits(target, 1);
            }
            const empty = await page(browser, { url: origin + '/search?q=', store: saved });
            eq(await hits(empty), 0, 'An empty URL does not read an unfinished search field');
        },
        async site_search_typing_is_not_submission_and_ajax_submit_refreshes_same_url(browser) {
            const source = await enabled(browser);
            await source.locator('#search input').fill('Draftword');
            await source.waitForTimeout(180); eq(await hits(source), 0, 'Typing stays private');
            await submit(source, 'Solarenergie'); await waitHits(source, 1);
            eq(await source.locator('.slim-hl').textContent(), 'Solarenergie');
            eq(await source.evaluate(() => window.__siteNativePrevented), false, 'Native form behavior remains available');
            await submit(source, 'Windkraft');
            await source.waitForFunction(() => document.querySelector('.slim-hl')?.textContent === 'Windkraft', null, { timeout: 4000 });
            eq(await source.locator('.slim-hl').textContent(), 'Windkraft');
            await submit(source, ''); await waitHits(source, 0);
        },
        async site_search_url_poll_starts_without_initial_terms(browser) {
            const source = await enabled(browser);
            await source.evaluate(() => history.pushState({}, '', '/search?query=Windkraft'));
            await waitHits(source, 1); eq(await source.locator('.slim-hl').textContent(), 'Windkraft');
            await source.evaluate(() => history.pushState({}, '', '/search?query=')); await waitHits(source, 0);
        },
        async site_search_same_origin_result_handoff_is_exact_and_short_lived(browser) {
            const source = await enabled(browser, { url: origin + '/search?q=Solarenergie' });
            await clickResult(source); eq(await source.evaluate(() => window.__siteNativePrevented), false);
            const saved = await store(source);
            const target = await page(browser, { url: origin + '/article', store: saved }); await waitHits(target, 1);
            const other = await page(browser, { url: origin + '/unrelated', store: saved }); eq(await hits(other), 0);
            const expired = structuredClone(saved);
            for (const entry of expired.hl_site_search_handoffs.entries) entry.timestamp = Date.now() - 6 * 60 * 1000;
            const old = await page(browser, { url: origin + '/article', store: expired }); eq(await hits(old), 0);
            eq(saved.hl_keywords.length, 0); eq('hl_search_history' in saved, false, 'Site queries are not global history');
        },
        async site_search_does_not_transfer_to_other_origins(browser) {
            const source = await enabled(browser, { url: origin + '/search?q=Solarenergie' });
            await source.locator('#result').evaluate(node => node.href = 'https://private.test/article');
            await clickResult(source);
            eq((await store(source)).hl_site_search_handoffs?.entries.length || 0, 0);
        },
        async site_search_ignores_untrusted_submits_and_links(browser) {
            const source = await enabled(browser);
            await source.evaluate(() => {
                const form = document.getElementById('search');
                form.addEventListener('submit', event => event.preventDefault());
                document.getElementById('result').addEventListener('click', event => event.preventDefault());
                form.querySelector('input').value = 'Solarenergie';
                form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
                document.getElementById('result').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            });
            eq(await hits(source), 0); eq('hl_site_search_handoffs' in await store(source), false);
        },
        async site_search_rejects_unrelated_and_password_forms(browser) {
            for (const fields of ['<input name="email" value="Solarenergie">', '<input type="search" name="q" value="Solarenergie"><input type="password" value="private">']) {
                const source = await enabled(browser, { html: '<form id="search">' + fields + '<button>Send</button></form><p>Solarenergie</p>' });
                await source.locator('#search').evaluate(node => node.addEventListener('submit', event => event.preventDefault()));
                await source.locator('#search button').click(); eq(await hits(source), 0);
            }
        },
        async site_search_opt_out_and_reenable_cannot_restore_old_handoffs(browser) {
            const source = await enabled(browser, { url: origin + '/search?q=Solarenergie' }); await clickResult(source);
            await toggle(source); await waitHits(source, 0); await toggle(source);
            const target = await page(browser, { url: origin + '/article', store: await store(source) }); eq(await hits(target), 0);
        },
        async site_search_storage_failure_rolls_back_checkbox(browser) {
            const source = await page(browser, { url: origin + '/search?q=Solarenergie' });
            await source.evaluate(() => { window.GM_setValue = () => { throw Error('quota'); }; });
            await toggle(source); eq(await source.locator('#site-search-enabled').isChecked(), false); eq(await hits(source), 0);
            eq((source.__errors || []).length, 0);
        },
        async site_search_unknown_storage_schema_is_preserved(browser) {
            const unknown = { version: 99, origins: ['future'] };
            const source = await page(browser, { store: { hl_site_search_origins: unknown } }); await toggle(source);
            eq(await source.locator('#site-search-enabled').isChecked(), false);
            eq(JSON.stringify((await store(source)).hl_site_search_origins), JSON.stringify(unknown));
        },
        async site_search_handoffs_are_bounded_and_not_dom_attributes(browser) {
            const source = await enabled(browser, { url: origin + '/search?q=Solarenergie' });
            for (let i = 0; i < 15; i++) {
                await source.locator('#result').evaluate((node, i) => node.href = '/article/' + i, i); await clickResult(source);
            }
            const saved = await store(source); eq(saved.hl_site_search_handoffs.version, 1); eq(saved.hl_site_search_handoffs.entries.length, 12);
            ok(!await source.evaluate(() => [...document.querySelectorAll('form,input,a')].some(node => [...node.attributes].some(attribute => /Solarenergie/.test(attribute.value) && !['value', 'href'].includes(attribute.name)))), 'No captured query attributes added to host DOM');
        },
        async site_search_post_result_and_wikipedia_direct_title_redirect(browser) {
            const source = await enabled(browser, { html: '<form id="search" method="post" action="/results"><input type="search" name="q"><button>Search</button></form><p>Solarenergie</p>' });
            await submit(source, 'Solarenergie');
            const target = await page(browser, { url: origin + '/results', store: await store(source) }); await waitHits(target, 1);
            const wiki = await enabled(browser, { url: 'https://en.wikipedia.org/wiki/Main_Page', html: '<form id="search" action="/w/index.php"><input type="search" name="search"><button>Search</button></form><p>Solarenergie</p>' });
            await submit(wiki, 'solarenergie');
            const article = await page(browser, { url: 'https://en.wikipedia.org/wiki/Solarenergie', store: await store(wiki) }); await waitHits(article, 1);
            const different = await page(browser, { url: 'https://en.wikipedia.org/wiki/Windkraft', store: await store(wiki) }); eq(await hits(different), 0);
        },
        async site_search_unknown_handoff_schema_does_not_block_native_submit(browser) {
            const unknown = { version: 99, entries: [{ future: 'preserve' }] };
            const source = await enabled(browser, { store: { hl_site_search_handoffs: unknown } });
            await submit(source, 'Solarenergie'); await waitHits(source, 1);
            eq(await source.evaluate(() => window.__siteNativePrevented), false);
            eq(JSON.stringify((await store(source)).hl_site_search_handoffs), JSON.stringify(unknown));
        },
        async site_search_rejects_external_password_form_controls(browser) {
            const source = await enabled(browser, { html: '<form id="search"><input type="search" name="q"><button>Send</button></form><input type="password" form="search" value="private"><p>Solarenergie</p>' });
            await submit(source, 'Solarenergie'); await source.waitForTimeout(180); eq(await hits(source), 0);
        },
        async site_search_does_not_persist_unbounded_target_urls(browser) {
            const source = await enabled(browser, { url: origin + '/search?q=Solarenergie' });
            await source.locator('#result').evaluate(node => node.href = '/article/' + 'x'.repeat(9000));
            await clickResult(source); eq((await store(source)).hl_site_search_handoffs?.entries.length || 0, 0);
        },
        async site_search_confirmed_get_form_supports_custom_search_names_and_routing_fields(browser) {
            const source = await enabled(browser, { html: '<form id="search" action="/results" method="get"><input type="search" name="needle"><input type="hidden" name="category" value="docs"><button>Search</button></form><p>Solarenergie</p>' });
            await submit(source, 'Solarenergie');
            const saved = await store(source);
            const target = await page(browser, { url: origin + '/results?needle=Solarenergie&category=docs', store: saved }); await waitHits(target, 1);
            const wrongQuery = await page(browser, { url: origin + '/results?needle=Windkraft&category=docs', store: saved }); eq(await hits(wrongQuery), 0);
            const wrongPath = await page(browser, { url: origin + '/private?needle=Solarenergie', store: saved }); eq(await hits(wrongPath), 0);
            const noQuery = await page(browser, { url: origin + '/results', store: saved }); eq(await hits(noQuery), 0);
        },
        async site_search_native_enter_and_space_confirm_submission(browser) {
            for (const key of ['Enter','Space']) {
                const source=await enabled(browser);
                await source.locator('#search').evaluate(form=>form.addEventListener('submit',event=>event.preventDefault()));
                await source.locator('#search input').fill('Windkraft');
                if(key==='Enter')await source.locator('#search input').press('Enter');
                else{await source.locator('#search button').focus();await source.keyboard.press('Space');}
                await waitHits(source,1);eq(await source.locator('.slim-hl').textContent(),'Windkraft','Native '+key+' commits the search');
            }
        },
        async site_search_auto_search_opt_out_blocks_capture(browser) {
            const source = await enabled(browser, { url: origin + '/search?q=Solarenergie', store: { hl_auto_search: false } });
            await clickResult(source); eq(await hits(source), 0); eq('hl_site_search_handoffs' in await store(source), false);
        }
    };
};
