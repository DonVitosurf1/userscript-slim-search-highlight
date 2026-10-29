'use strict';

module.exports = ({ open, settled, hits, eq, ok }) => {
    // Test-only loop fuse: a regression must fail instead of wedging Chromium.
    // It does not protect a single expensive exec; unsafe-shape tests use tiny inputs.
    const guardedBrowser = browser => ({
        async newPage(options) {
            const page = await browser.newPage(options);
            await page.addInitScript(() => {
                const exec = RegExp.prototype.exec;
                const counts = new WeakMap();
                RegExp.prototype.exec = function (value) {
                    const n = (counts.get(this) || 0) + 1;
                    counts.set(this, n);
                    if (n > 10000) throw Error('Security test: regex loop budget exceeded');
                    return exec.call(this, value);
                };
            });
            return page;
        },
    });
    const marks = page => page.locator('#subject .slim-hl').allTextContents();
    const noErrors = page => eq((page.__errors || []).length, 0, 'No unhandled script errors');
    return {
        async security_query_automatic_sources_are_literal(browser) {
            const term = '/hello/i';
            const record = { terms: [term], timestamp: Date.now() };
            const cases = [
                { url: 'https://www.google.com/search?q=' + encodeURIComponent(term) },
                { url: 'https://article.test/#hl=' + encodeURIComponent(term) },
                { url: 'https://article.test/', referrer: 'https://www.google.com/search?q=' + encodeURIComponent(term) },
                { url: 'https://article.test/', store: { hl_cross_terms: record } },
                { url: 'https://article.test/', store: { hl_search_handoffs: { version: 1, entries: [{ ...record, target: 'https://article.test/', source: 'https://www.google.com' }] } } },
            ];
            for (const options of cases) {
                const page = await open(browser, { html: '<p id="subject">hello /hello/i HELLO</p>', keywords: [], ...options });
                await settled(page, 2000);
                eq((await marks(page)).join('|'), term, 'Automatic terms must match their literal spelling: ' + JSON.stringify(options));
                noErrors(page);
                await page.close();
            }
        },

        async security_query_url_regex_cannot_loop_on_emoji(browser) {
            const term = '/(?:)/u';
            const page = await open(guardedBrowser(browser), {
                url: 'https://article.test/#hl=' + encodeURIComponent(term), keywords: [],
                html: '<p id="subject">😀 /(?:)/u 😀</p>',
            });
            await page.waitForTimeout(300);
            eq((await marks(page)).join('|'), term, 'URL regex syntax is literal');
            noErrors(page);
        },

        async security_query_explicit_unicode_empty_matches_advance(browser) {
            const page = await open(guardedBrowser(browser), {
                keywords: [{ text: '/(?=.)|hello/gu', color: '#ff0' }, { text: 'hello', color: '#0ff' }],
                html: '<p id="subject">😀 hello 😀</p>',
            });
            await page.waitForTimeout(300);
            eq((await marks(page)).join('|'), 'hello', 'Other matchers complete after Unicode empty matches');
            noErrors(page);
        },

        async security_query_rejects_unsafe_explicit_regex(browser) {
            for (const text of ['/(a+)+$/', '/(a|aa)+$/', '/(a?){50}$/', '/a+a+$/', '/(a)\\1+/', '/' + 'a'.repeat(257) + '/']) {
                const page = await open(browser, { keywords: [{ text, color: '#ff0' }], panelOpen: true, html: '<p id="subject">aaaa</p>' });
                await page.waitForTimeout(200);
                eq((await marks(page)).length, 0, 'Unsafe regex skipped: ' + text);
                ok((await page.locator('#regex-error').textContent()).length > 0, 'Unsafe regex reported: ' + text);
                noErrors(page);
                await page.close();
            }
        },

        async security_query_preserves_useful_explicit_regex(browser) {
            const page = await open(browser, {
                keywords: [{ text: '/(?:solar|wind)/i', color: '#ff0' }, { text: '/[0-9]{2,4}/', color: '#0ff' }, { text: '/x*/', color: '#f0f' }],
                html: '<p id="subject">Solar wind 123 xxx</p>',
            });
            await settled(page, 2000);
            eq((await marks(page)).join('|'), 'Solar|wind|123|xxx', 'Useful explicit regex syntax is retained');
            noErrors(page);
        },

        async security_query_explicit_regex_has_text_node_limit(browser) {
            const page = await open(browser, {
                keywords: [{ text: '/a+b/', color: '#ff0' }, { text: 'literal', color: '#0ff' }],
                html: '<p id="subject">' + 'a'.repeat(5000) + 'b literal</p><p id="short">aab</p>',
            });
            await settled(page, 2000);
            eq((await marks(page)).join('|'), 'literal', 'Literal keywords still work on long text nodes');
            eq(await page.locator('#short .slim-hl').textContent(), 'aab', 'Regex still works on short text nodes');
            noErrors(page);
        },

        async security_query_only_official_search_hosts(browser) {
            for (const host of ['google.attacker.test', 'www.google.com.attacker.test', 'bing.attacker.test', 'duckduckgo.attacker.test', 'google.localhost']) {
                const page = await open(browser, { url: 'https://' + host + '/search?q=privateword', keywords: [], html: '<p>privateword</p>' });
                await page.waitForTimeout(150);
                eq(await page.evaluate(() => 'hl_cross_terms' in window.__store), false, host + ' must not store queries');
                eq(await hits(page), 0, host + ' must not use queries');
                await page.close();
            }
            for (const host of ['google.com', 'www.google.de', 'www.google.co.uk', 'cn.bing.com', 'duckduckgo.com', 'search.yahoo.co.jp', 'www.baidu.com', 'yandex.ru', 'www.startpage.com', 'www.ecosia.org', 'www.qwant.com']) {
                const page = await open(browser, { url: 'https://' + host + '/search?q=privateword', keywords: [], html: '<p>privateword</p>' });
                await settled(page, 2000);
                eq(await hits(page), 1, host + ' is an official engine');
                await page.close();
            }
        },

        async security_query_domain_restrictions_and_blacklist_use_host_boundaries(browser) {
            for (const host of ['private.test', 'sub.private.test', 'private.test.attacker.test', 'notprivate.test']) {
                const allowed = host === 'private.test' || host === 'sub.private.test';
                const page = await open(browser, {
                    url: 'https://' + host + '/', html: '<p>privateword</p>',
                    keywords: [{ text: 'privateword', color: '#ff0', domains: ['PRIVATE.TEST'] }],
                });
                await page.waitForTimeout(200);
                eq(await hits(page), Number(allowed), 'Domain restriction: ' + host);
                await page.close();
                const blocked = await open(browser, {
                    url: 'https://' + host + '/', html: '<p>privateword</p>',
                    keywords: [{ text: 'privateword', color: '#ff0' }], store: { hl_blacklist: ['PRIVATE.TEST'] },
                });
                await blocked.waitForTimeout(200);
                eq(await hits(blocked), Number(!allowed), 'Blacklist: ' + host);
                await blocked.close();
            }
        },
    };
};
