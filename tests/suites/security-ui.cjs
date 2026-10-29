'use strict';

module.exports = ({ SRC, eq, ok }) => {
    async function isolated(browser, panelOpen = true, extra = {}, pageURL = 'https://hostile.test/', html = '<p id="text">Visible text.</p>') {
        const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
        await page.route('**/*', route => route.fulfill({ contentType: 'text/html', body: html }));
        await page.goto(pageURL);
        await page.evaluate(() => {
            window.__stolenRoot = null;
            const attach = Element.prototype.attachShadow;
            Element.prototype.attachShadow = function (options) { window.__stolenRoot = attach.call(this, options); return window.__stolenRoot; };
        });
        const cdp = await page.context().newCDPSession(page);
        const tree = await cdp.send('Page.getFrameTree');
        const world = (await cdp.send('Page.createIsolatedWorld', { frameId: tree.frameTree.frame.id, worldName: 'security-owner' })).executionContextId;
        const evaluate = async expression => {
            const result = await cdp.send('Runtime.evaluate', { contextId: world, expression, returnByValue: true, awaitPromise: true });
            if (result.exceptionDetails) throw Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
            return result.result.value;
        };
        const state = { hl_panel_state: { open: panelOpen }, hl_keywords: [{ text: 'PRIVATE_KEYWORD', color: '#ffe082', domains: ['private.test'] }], hl_search_history: ['PRIVATE_HISTORY'], hl_page_annotations: { version: 1, pages: { 'https://private.test/account': { title: 'PRIVATE_TITLE', terms: [{ text: 'PRIVATE_NOTE' }] } } }, ...extra };
        await evaluate(`globalThis.__state=${JSON.stringify(state)};
            globalThis.GM_getValue=(key,fallback)=>structuredClone(__state[key]??fallback);
            globalThis.GM_setValue=(key,value)=>{__state[key]=structuredClone(value)};
            globalThis.GM_addStyle=css=>{const s=document.createElement('style');s.textContent=css;document.head.append(s)};
            globalThis.__menus={};globalThis.GM_registerMenuCommand=(name,action)=>__menus[name]=action;
            globalThis.GM_setClipboard=()=>{globalThis.__clipboardWrites=(globalThis.__clipboardWrites||0)+1};
            globalThis.GM_download=options=>{fetch(options.url).then(r=>r.text()).then(text=>{globalThis.__download={name:options.name,text};options.onload?.()})};
            const attach=Element.prototype.attachShadow;
            Element.prototype.attachShadow=function(options){const root=attach.call(this,options);if(this.id==='slim-hl-ui')globalThis.__ownerRoot=root;return root};
            ${SRC}`);
        const click = async id => {
            const selector = '#' + id;
            const rect = await evaluate(`(async()=>{const el=(globalThis.__ownerRoot||document).querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'nearest'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
            await page.mouse.click(rect.x, rect.y);
        };
        return { page, evaluate, click };
    }
    return {
        async security_ui_automatic_mark_cannot_delete_another_domain_profile(browser) {
            const {page,evaluate}=await isolated(browser,true,{},'https://hostile.test/#hl=PRIVATE_KEYWORD','<p id="subject">PRIVATE_KEYWORD</p>');
            await page.waitForSelector('#subject .slim-hl');
            await page.locator('#subject .slim-hl').click({modifiers:['Alt']});
            ok(await evaluate("__state.hl_keywords.some(item=>item.text==='PRIVATE_KEYWORD')"),'Automatische Treffer besitzen keine fremden permanenten Keywords');
        },
        async security_ui_native_find_cannot_read_other_domains_or_history(browser) {
            const { page } = await isolated(browser);
            for (const text of ['PRIVATE_KEYWORD', 'PRIVATE_HISTORY', 'PRIVATE_NOTE']) {
                eq(await page.evaluate(text => window.find(text, true), text), false, 'Native Suche darf private Profile nicht als Wörterbuch-Orakel verwenden: ' + text);
            }
        },
        async security_ui_native_edit_and_blur_do_not_persist_profile_changes(browser) {
            const { page, evaluate, click } = await isolated(browser, true, { hl_keywords: [{ text: 'PUBLIC_PROFILE', color: '#ffe082' }] });
            await click('permanent-keywords > summary');
            await page.evaluate(() => { window.find('PUBLIC_PROFILE', true); document.execCommand('insertText', false, 'INJECTED'); document.body.tabIndex=0;document.body.focus(); });
            eq(await evaluate('__state.hl_keywords[0].text'), 'PUBLIC_PROFILE', 'Native Editing plus Blur darf keinen Speicherklick ersetzen');
        },
        async security_ui_private_controls_and_profiles_are_not_page_readable(browser) {
            const { page } = await isolated(browser);
            const data = await page.evaluate(() => ({ gm: typeof GM_getValue, inputs: document.querySelectorAll('#kw-list input').length, text: document.body.textContent, root: document.getElementById('slim-hl-ui')?.shadowRoot }));
            eq(data.gm, 'undefined');
            eq(data.inputs, 0, 'Globale Profile bleiben außerhalb des Seiten-DOM');
            ok(!data.text.includes('PRIVATE_HISTORY') && !data.text.includes('PRIVATE_KEYWORD'));
            eq(data.root, null, 'Geschlossene UI-Wurzel');
            eq(await page.evaluate(() => window.__stolenRoot), null, 'Hooks der Webseite sehen die isolierte Wurzel nicht');
        },
        async security_ui_host_synthetic_actions_cannot_write_preferences(browser) {
            const { page, evaluate } = await isolated(browser);
            const before = await evaluate('JSON.stringify(__state)');
            await page.evaluate(() => {
                for (const id of ['slim-hl-toggle', 'export-saved', 'selection-quote', 'chk-enabled']) document.getElementById(id)?.click();
                const form = document.getElementById('keyword-form');
                if (form) { document.getElementById('new-kw').value = 'INJECTED'; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
                const mark = document.createElement('span'); mark.className = 'slim-hl'; mark.dataset.kw = 'PRIVATE_KEYWORD'; document.body.append(mark);
                mark.dispatchEvent(new MouseEvent('click', { bubbles: true, altKey: true }));
            });
            eq(await evaluate('JSON.stringify(__state)'), before, 'Keine GM-Schreibvorgänge aus Seiten-Events');
            eq(await evaluate('globalThis.__clipboardWrites||0'), 0);
        },
        async security_ui_forged_public_mark_cannot_delete_a_private_keyword(browser) {
            const { page, evaluate } = await isolated(browser);
            await page.evaluate(() => { const mark=document.createElement('span');mark.id='forged';mark.className='slim-hl';mark.dataset.kw='PRIVATE_KEYWORD';mark.textContent='Fake mark';document.body.append(mark); });
            await page.locator('#forged').click({modifiers:['Alt']});
            ok(await evaluate("__state.hl_keywords.some(item=>item.text==='PRIVATE_KEYWORD')"), 'Auch ein echter Alt-Klick auf fremde Markierungen darf kein Profil löschen');
        },
        async security_ui_real_export_never_exposes_a_blob_to_page_dom(browser) {
            const { page, evaluate, click } = await isolated(browser);
            await page.evaluate(() => {
                window.__exposed = [];
                new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.id === 'slim-download') window.__exposed.push(node.href);
                }))).observe(document.body, { childList: true, subtree: true });
            });
            await click('settings-section > summary');
            await click('export-saved');
            await evaluate("new Promise((resolve,reject)=>{const limit=Date.now()+3000;const poll=()=>{if(globalThis.__download)resolve();else if(Date.now()>limit)reject(Error('No manager download'));else setTimeout(poll,10)};poll()})");
            eq(await page.evaluate(() => window.__exposed.length), 0, 'Auch echte Export-Klicks legen keine Blob-URL im Host-DOM offen');
            const result = await evaluate('globalThis.__download');
            ok(result?.text.includes('PRIVATE_NOTE'), 'Manager-Download enthält die ausdrücklich exportierten Daten');
        },
        async security_ui_synthetic_private_clicks_are_rejected_but_native_form_works(browser) {
            const { page, evaluate, click } = await isolated(browser);
            const before = await evaluate('JSON.stringify(__state)');
            await evaluate("__ownerRoot.getElementById('chk-enabled').click();__ownerRoot.getElementById('keyword-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))");
            eq(await evaluate('JSON.stringify(__state)'), before, 'Aktivierungsprüfung bleibt auch innerhalb der privaten Oberfläche aktiv');
            await click('permanent-keywords > summary');
            await click('new-kw'); await page.keyboard.type('Visible'); await page.keyboard.press('Enter');
            ok(await evaluate("__state.hl_keywords.some(item=>item.text==='Visible')"), 'Echte Tastatureingabe kann weiterhin speichern');
            await page.waitForSelector('#text .slim-hl');
            await page.locator('#text .slim-hl').evaluate(el=>{el.dataset.kw='PRIVATE_KEYWORD'});
            await page.locator('#text .slim-hl').click({modifiers:['Alt']});
            ok(await evaluate("__state.hl_keywords.some(item=>item.text==='PRIVATE_KEYWORD')"), 'Veränderte DOM-Daten können kein fremdes Keyword auswählen');
            ok(await evaluate("!__state.hl_keywords.some(item=>item.text==='Visible')"), 'Eigene echte Markierung bleibt korrekt löschbar');
        },
    };
};
