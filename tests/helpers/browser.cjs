'use strict';
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.join(__dirname, '..', '..', 'userscript', 'slim-search-highlight.user.js'), 'utf8');
const KW = [
    { text: 'lorem', color: '#ffe082' },
    { text: 'ipsum', color: '#90caf9' },
    { text: 'dolor', color: '#a5d6a7' },
];

const paragraphs = n => Array.from({ length: n }, (_, i) =>
    `<p>Lorem ipsum dolor sit amet <b>consectetur</b> adipiscing elit ${i} sed do eiusmod tempor lorem.</p>`).join('');

async function open(browser, { html = paragraphs(10), keywords = KW, url = null, referrer = null, panelOpen = false, store = {}, locale = 'de-DE', viewport = { width: 1200, height: 800 }, permanentOpen = true } = {}) {
    const page = await browser.newPage({ viewport, locale });
    page.on('pageerror', e => { page.__errors = (page.__errors || []).concat(e.message); });
    await page.addInitScript(([kw, panelOpen, extra]) => {
        const store = Object.assign({ hl_keywords: kw, hl_panel_state: { open: panelOpen, minimized: false } }, extra);
        window.__store = store; window.__sets = 0; window.__walkers = 0;
        window.GM_getValue = (k, d) => (k in store ? JSON.parse(JSON.stringify(store[k])) : d);
        window.GM_setValue = (k, v) => { window.__sets++; store[k] = v; };
        window.GM_addStyle = css => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
        window.__menus = {};
        window.GM_registerMenuCommand = (label, action) => { window.__menus[label] = action; };
        const orig = Document.prototype.createTreeWalker;
        Document.prototype.createTreeWalker = function (...a) { window.__walkers++; return orig.apply(this, a); };
    }, [keywords, panelOpen, store]);
    if (url) {
        await page.route('**/*', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: `<body>${html}</body>` }));
        await page.goto(url, referrer ? { referer: referrer } : {});
    } else {
        await page.goto('about:blank');
        await page.setContent(`<body>${html}</body>`);
    }
    await page.addScriptTag({ content: SRC });
    if (panelOpen && permanentOpen && await page.locator('#permanent-keywords').count()) await page.locator('#permanent-keywords').evaluate(e => { e.open = true; });
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


module.exports = { SRC, KW, paragraphs, open, hits, settled, eq, ok };
