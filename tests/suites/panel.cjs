'use strict';

// Regression tests for R1–R10. Exercise shipped behavior, not private helpers.
module.exports = ({ open, settled, eq, ok }) => {
    const panel = (browser, opts = {}) => open(browser, { panelOpen: true, ...opts });
    const rect = page => page.locator('#slim-hl-panel').boundingBox();
    const inside = async page => {
        // Resize events are delivered asynchronously; require recovery within a render cycle budget.
        await page.waitForFunction(({width,height})=>{
            const r=document.getElementById('slim-hl-panel').getBoundingClientRect();
            return r.x>=0 && r.y>=0 && r.right<=width+1 && r.bottom<=height+1;
        }, page.viewportSize(), {timeout:3000});
        const r = await rect(page), v = page.viewportSize();
        ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= v.width + 1 && r.y + r.height <= v.height + 1, `Panel außerhalb: ${JSON.stringify(r)}`);
    };
    const settings = async page => {
        ok(await page.locator('#settings-section').count(), 'Aufklappbare Einstellungen fehlen');
        await page.locator('#settings-section > summary').click();
    };
    return {
        async panel_shortcut_toggles_from_page_and_panel_focus(browser) {
            const page=await open(browser,{keywords:[],panelOpen:false});
            ok((await page.locator('#slim-hl-toggle').getAttribute('title')).includes('Alt + Shift + P'),'Launcher tooltip exposes panel shortcut');
            eq(await page.locator('#slim-hl-toggle').getAttribute('aria-keyshortcuts'),'Alt+Shift+P');
            await page.keyboard.press('Alt+Shift+P');eq(await page.locator('#slim-hl-panel').isVisible(),true);
            eq(await page.evaluate(()=>document.activeElement.id),'page-heading','Opening focuses the panel');
            await page.keyboard.press('Alt+Shift+P');eq(await page.locator('#slim-hl-panel').isVisible(),false,'Shortcut closes from inside the private panel');
            await page.keyboard.down('Alt');await page.keyboard.down('Shift');await page.keyboard.down('p');await page.keyboard.down('p');
            eq(await page.locator('#slim-hl-panel').isVisible(),true,'Key repeat does not toggle repeatedly');
            await page.keyboard.up('p');await page.keyboard.up('Shift');await page.keyboard.up('Alt');
            await page.locator('#permanent-keywords').evaluate(el=>{el.open=true;});await page.focus('#new-kw');
            eq(await page.evaluate(()=>document.activeElement.id),'new-kw');
            await page.keyboard.press('Alt+Shift+P');eq(await page.locator('#slim-hl-panel').isVisible(),true,'Editing fields keep their keyboard input');
        },
        async panel_shortcut_preserves_existing_marking_shortcut_assignment(browser) {
            const page=await open(browser,{keywords:[],panelOpen:false,store:{hl_selection_shortcut:{key:'p',alt:true,shift:true,ctrl:false,meta:false}},html:'<p id="choose">Solarenergie</p><p>Solarenergie</p>'});
            eq(await page.locator('#slim-hl-toggle').getAttribute('aria-keyshortcuts'),null,'Existing marking assignment has priority');
            ok(!(await page.locator('#slim-hl-toggle').getAttribute('title')).includes('Shift + P'),'Conflicting panel shortcut is not advertised');
            await page.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});
            await page.keyboard.press('Alt+Shift+P');eq(await page.locator('.page-item').count(),1,'Original marking assignment still works');
            await page.locator('#settings-section').evaluate(el=>{el.open=true;});await page.click('#reset-shortcut');
            eq(await page.locator('#slim-hl-toggle').getAttribute('aria-keyshortcuts'),'Alt+Shift+P','Reset frees the panel shortcut');
        },
        async panel_shortcut_invalid_saved_marking_key_keeps_ui_available(browser) {
            const page=await open(browser,{keywords:[],panelOpen:false,store:{hl_selection_shortcut:{key:5,alt:true,ctrl:false,shift:false,meta:false}}});
            await page.keyboard.press('Alt+Shift+P');eq(await page.locator('#slim-hl-panel').isVisible(),true,'Malformed shortcut cannot break panel startup');
            eq(await page.locator('#shortcut-label').textContent(),'Alt + Shift + H','Malformed selection shortcut falls back safely');
            eq((page.__errors||[]).length,0,'No startup error');
        },
        async review_panel_defaults_to_right_center_and_tracks_viewport(browser) {
            for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
                const page=await panel(browser,{keywords:[],permanentOpen:false,viewport});
                const centered=async()=>page.waitForFunction(()=>{
                    const r=document.getElementById('slim-hl-panel').getBoundingClientRect();
                    return Math.abs(innerWidth-r.right-20)<1&&Math.abs(r.y+r.height/2-innerHeight/2)<1;
                });
                await centered();
                await page.locator('#settings-section > summary').click();await centered();
                await page.locator('#settings-section > summary').click();await centered();
                await page.setViewportSize({width:800,height:600});await centered();
                eq(await page.evaluate(()=>window.__store.hl_panel_pos??null),null,'Automatic placement does not save fixed coordinates');
                await page.close();
            }
        },
        async review_panel_custom_position_persists_and_reset_restores_right_center(browser) {
            const page=await panel(browser,{keywords:[],permanentOpen:false,store:{hl_panel_pos:{x:100,y:120}},viewport:{width:1280,height:900}});
            eq((await rect(page)).x,100);eq((await rect(page)).y,120,'Custom placement restored');
            await page.click('#btn-reset');
            await page.waitForFunction(()=>{const r=document.getElementById('slim-hl-panel').getBoundingClientRect();return Math.abs(innerWidth-r.right-20)<1&&Math.abs(r.y+r.height/2-innerHeight/2)<1;});
            eq(await page.evaluate(()=>window.__store.hl_panel_pos),null,'Reset restores automatic placement');
            await page.locator('#slim-hl-header').focus();await page.keyboard.press('ArrowLeft');
            const moved=await rect(page),store=await page.evaluate(()=>window.__store);
            const restored=await panel(browser,{keywords:[],permanentOpen:false,store,viewport:{width:1280,height:900}});
            eq((await rect(restored)).x,moved.x);eq((await rect(restored)).y,moved.y,'Keyboard placement survives reload');
            await restored.locator('#slim-hl-header').focus();await restored.keyboard.press('Home');
            await restored.waitForFunction(()=>{const r=document.getElementById('slim-hl-panel').getBoundingClientRect();return Math.abs(innerWidth-r.right-20)<1&&Math.abs(r.y+r.height/2-innerHeight/2)<1;});
        },
        async review_panel_stays_inside_narrow_viewport(browser) {
            const page = await panel(browser, { viewport: { width: 320, height: 568 }, store: { hl_panel_pos: { x: 900, y: 650 } } });
            await inside(page);
            await page.setViewportSize({ width: 240, height: 400 });
            await inside(page);
            await page.setViewportSize({ width: 800, height: 600 });
            await inside(page);
        },
        async review_position_keyboard_reset_and_minimize(browser) {
            const page = await panel(browser);
            const header = page.locator('#slim-hl-header');
            eq(await header.getAttribute('tabindex'), '0', 'Header tastaturbedienbar');
            await header.focus(); const before = await rect(page);
            await page.keyboard.press('ArrowRight');
            ok((await rect(page)).x > before.x, 'Pfeiltaste verschiebt Panel');
            ok(await page.locator('#btn-reset').count(), 'Positionsreset fehlt');
            await page.click('#btn-reset'); await inside(page);
            await page.click('#btn-min');
            eq(await page.locator('#btn-min').getAttribute('aria-expanded'), 'false');
            await page.click('#btn-min'); await inside(page);
        },
        async review_highlight_foreground_has_contrast(browser) {
            const colors = ['#000000', '#ffffff', '#333333', '#808080', '#ff0000'];
            const page = await panel(browser, { html: '<p>alpha bravo charlie delta echo</p>', keywords: colors.map((color,i)=>({text:['alpha','bravo','charlie','delta','echo'][i],color})) });
            await settled(page);
            const ratios = await page.locator('.slim-hl').evaluateAll(els => {
                const luminance = css => {const c=css.match(/\d+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
                return els.map(el=>{const s=getComputedStyle(el),a=luminance(s.color),b=luminance(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
            });
            ok(ratios.every(r=>r>=4.5), `Kontraste: ${ratios}`);
        },
        async review_scoped_controls_resist_host_css(browser) {
            const page = await panel(browser, { html: '<style>button,input{font-family:serif;font-size:24px;padding:20px;box-sizing:border-box}button{border:8px solid red}</style><input id="host"><p>lorem</p>' });
            const s=await page.locator('#new-kw').evaluate(e=>({size:getComputedStyle(e).fontSize,padding:getComputedStyle(e).paddingLeft}));
            ok(parseFloat(s.size)<=16 && parseFloat(s.padding)<=12, JSON.stringify(s));
            const c=await page.locator('#new-color').boundingBox();ok(c.width>=32 && c.height>=32,'Farbwahl gut bedienbar');
            eq(await page.locator('#host').evaluate(e=>getComputedStyle(e).fontSize),'24px','Host unverändert');
        },
        async review_primary_action_visible_on_small_screen(browser) {
            const page=await panel(browser,{viewport:{width:390,height:650}});
            const b=await page.locator('#add-kw-btn').boundingBox();ok(b.y+b.height<650,'Hinzufügen im ersten Viewport');
            const body=await page.locator('.panel-body').boundingBox();ok(b.y+b.height<body.y+body.height,'Hinzufügen ohne Panelscroll');
        },
        async review_controls_have_localized_accessible_names(browser) {
            const page=await panel(browser);
            eq(await page.getByRole('button',{name:'Schließen',exact:true}).count(),1,'Schließen benannt');
            const unlabelled=await page.locator('#slim-hl-panel input, #slim-hl-panel select').evaluateAll(els=>els.filter(e=>!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.labels.length).map(e=>e.id||e.type));
            eq(unlabelled.join(','),'','Alle Felder benannt');
            eq(await page.locator('#hl-counter').getAttribute('aria-live'),'polite');
        },
        async review_open_close_restores_focus(browser) {
            const page=await open(browser);
            await page.locator('#slim-hl-toggle').focus();await page.keyboard.press('Enter');
            eq(await page.evaluate(()=>document.activeElement.id),'page-heading');
            await page.keyboard.press('Escape');
            eq(await page.evaluate(()=>document.activeElement.id),'slim-hl-toggle');
            eq(await page.locator('#slim-hl-toggle').getAttribute('aria-expanded'),'false');
            await page.keyboard.press('Enter');eq(await page.locator('#slim-hl-toggle').getAttribute('aria-expanded'),'true');
        },
        async review_match_list_keyboard_and_context(browser) {
            const page=await panel(browser,{html:'<p>Erster Kontext lorem hier.</p><p>Zweiter Kontext lorem dort.</p>'});
            await settled(page);
            eq(await page.locator('#match-details').count(),1,'Aufklappbare Treffer');
            await page.locator('#match-details > summary').click();
            const items=page.locator('#match-list button.match-item');eq(await items.count(),2,'Treffer als Buttons');
            ok((await items.first().textContent()).includes('Erster Kontext'),'Satzkontext');
            await items.first().focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
            eq(await page.textContent('#hl-counter'),'2 / 2');
            eq(await items.nth(1).getAttribute('aria-current'),'true');
            eq(await page.locator('#match-list button[tabindex="0"]').count(),1,'Ein Tabstop für Liste');
        },
        async review_enter_submits_and_ime_does_not(browser) {
            const page=await panel(browser,{html:'<p>hello</p>',keywords:[]});
            await page.fill('#new-kw','hello');await page.press('#new-kw','Enter');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),1,'Enter fügt hinzu');
            await page.fill('#new-kw','composing');
            await page.locator('#new-kw').dispatchEvent('compositionstart');
            await page.press('#new-kw','Enter');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),1,'IME darf nicht senden');
            await page.locator('#new-kw').dispatchEvent('compositionend');await page.press('#new-kw','Enter');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),2);
        },
        async review_invalid_regex_retains_input_and_storage(browser) {
            const page=await panel(browser,{keywords:[]});
            await page.fill('#new-kw','/[invalid/');await page.click('#add-kw-btn');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),0,'Ungültiger Regex nicht gespeichert');
            eq(await page.inputValue('#new-kw'),'/[invalid/');
            eq(await page.locator('#new-kw').getAttribute('aria-invalid'),'true');
            ok((await page.locator('#new-kw').getAttribute('aria-describedby')).includes('form-error'),'Fehler zugeordnet');
            ok((await page.textContent('#form-error')).includes('Regex'));
        },
        async review_duplicate_error_is_inline(browser) {
            const page=await panel(browser);let dialogs=0;page.on('dialog',async d=>{dialogs++;await d.dismiss();});
            await page.fill('#new-kw','lorem');await page.click('#add-kw-btn');
            eq(dialogs,0,'Kein Browserdialog');eq(await page.evaluate(()=>window.__store.hl_keywords.length),3);
            ok((await page.textContent('#form-error')).includes('bereits'));
        },
        async review_invalid_keyword_edit_is_not_saved(browser) {
            const page=await panel(browser);await settled(page);
            const field=page.locator('.kw-item input[type=text]').first();
            await field.fill('/[invalid/');await field.press('Enter');
            eq(await page.evaluate(()=>window.__store.hl_keywords[0].text),'lorem');
            eq(await field.inputValue(),'/[invalid/');eq(await field.getAttribute('aria-invalid'),'true');
            await field.fill('ipsum');await field.press('Enter');
            eq(await page.evaluate(()=>window.__store.hl_keywords[0].text),'lorem','Duplikat-Edit nicht speichern');
        },
        async review_locale_preserves_draft_focus_and_disclosures(browser) {
            const page=await panel(browser);
            eq(await page.locator('#advanced-section').count(),1,'Erweiterte Optionen vorhanden');
            await page.fill('#new-kw','Entwurf behalten');await page.locator('#advanced-section > summary').click();
            await page.fill('#new-domains','example.org');await page.uncheck('#new-whole');
            await settings(page);await page.selectOption('#ui-lang','en');
            eq(await page.inputValue('#new-kw'),'Entwurf behalten');eq(await page.inputValue('#new-domains'),'example.org');
            eq(await page.locator('#new-whole').isChecked(),false);
            eq(await page.locator('#advanced-section').getAttribute('open'),'');
            eq(await page.evaluate(()=>document.activeElement.id),'ui-lang');
        },
        async review_clear_search_and_undo_deletion(browser) {
            const page=await panel(browser);await settled(page);
            await page.fill('#kw-search','nothing');
            eq(await page.locator('#clear-kw-search').count(),1,'Suchfeld löschen vorhanden');
            await page.click('#clear-kw-search');eq(await page.inputValue('#kw-search'),'');
            eq(await page.evaluate(()=>document.activeElement.id),'kw-search');
            const first=await page.locator('.kw-item input[type=text]').first().inputValue();
            await page.locator('.kw-item .delete-keyword').first().click();
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),2);
            await page.click('#undo-delete');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),3);
            eq(await page.locator('.kw-item input[type=text]').first().inputValue(),first);
        },
        async review_reduced_motion_scroll_is_instant(browser) {
            const page=await panel(browser);await settled(page);await page.emulateMedia({reducedMotion:'reduce'});
            await page.evaluate(()=>{window.__scrollOptions=[];Element.prototype.scrollIntoView=function(o){window.__scrollOptions.push(o);};});
            await page.click('#btn-next');
            eq(await page.evaluate(()=>window.__scrollOptions[0].behavior),'instant');
        },
        async review_panel_growth_stays_inside_viewport(browser) {
            const page=await panel(browser,{keywords:[],viewport:{width:1200,height:900}});
            await page.locator('#settings-section > summary').click();
            await page.locator('#advanced-section > summary').click();
            await page.waitForTimeout(100);await inside(page);
        },
        async review_navigation_does_not_change_host_match_items(browser) {
            const page=await panel(browser,{html:'<div id="host-item" class="match-item">Host</div><p>lorem ipsum</p>'});
            await settled(page);await page.click('#btn-next');
            eq(await page.locator('#host-item').getAttribute('class'),'match-item','Host-Klassen unverändert');
            eq(await page.locator('#host-item').getAttribute('aria-current'),null,'Host-Semantik unverändert');
        },
        async review_scoped_reset_preserves_header_and_button_layout(browser) {
            const page=await panel(browser);
            eq(await page.locator('#slim-hl-header').evaluate(e=>getComputedStyle(e).display),'flex','Header bleibt eine Werkzeugzeile');
            eq(await page.locator('#slim-hl-header img').evaluate(e=>e.getBoundingClientRect().width),20,'Logo bleibt kompakt');
            ok((await page.locator('#btn-next').boundingBox()).height>=36,'Navigation behält Bediengröße');
        },
        async review_svg_controls_remain_visible_after_reset(browser) {
            const page=await panel(browser);
            const style=await page.locator('#btn-close svg').evaluate(e=>({stroke:getComputedStyle(e).stroke,fill:getComputedStyle(e).fill,width:getComputedStyle(e).strokeWidth}));
            ok(style.stroke!=='none' && style.fill==='none',`SVG strokes: ${JSON.stringify(style)}`);
            const geometry=await page.locator('#btn-close path').evaluate(e=>({d:getComputedStyle(e).d,width:e.getBBox().width}));
            ok(geometry.d!=='none' && geometry.width>0,`SVG path geometry: ${JSON.stringify(geometry)}`);
        },
        async review_disable_during_highlight_does_not_restore_marks(browser) {
            const page=await panel(browser,{html:'<script>window.__frames=[];window.requestAnimationFrame=fn=>window.__frames.push(fn)</script><p>lorem ipsum</p>'});
            ok(await page.evaluate(()=>window.__frames.length>0),'Durchlauf wartet auf Animationframe');
            await page.locator('#settings-section').evaluate(el=>{el.open=true});
            await page.waitForFunction(()=>document.getElementById('slim-hl-panel').getBoundingClientRect().bottom<=innerHeight,null,{polling:20,timeout:2000});
            await page.locator('#chk-enabled').evaluate(el=>el.scrollIntoView({block:'center'}));
            const box=await page.locator('#chk-enabled').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
            eq(await page.locator('#chk-enabled').isChecked(),false,'Echter Klick deaktiviert die angehaltene Suche');
            await page.evaluate(()=>{while(window.__frames.length)window.__frames.shift()(performance.now())});
            eq(await page.locator('.slim-hl').count(),0,'Deaktivierter Durchlauf darf keine Marken nachliefern');
        },
        async review_blacklist_cancels_queued_highlighting(browser) {
            const page=await panel(browser,{url:'https://example.test/',html:'<script>window.__frames=[];window.requestAnimationFrame=fn=>window.__frames.push(fn)</script><p>lorem ipsum</p>'});
            await page.evaluate(()=>{
                window.__menus['Aktuelle Domain zur Blacklist']();
                while(window.__frames.length) window.__frames.shift()(performance.now());
            });
            eq(await page.locator('.slim-hl').count(),0,'Ausgeschlossene Seite erhält keine verspäteten Marken');
            eq(await page.textContent('#hl-counter'),'0 / 0');
        },
        async review_blacklist_stops_existing_global_shortcuts(browser) {
            const page=await panel(browser,{url:'https://example.test/',keywords:[],html:'<p id="selected">Forschung</p>'});
            await page.evaluate(()=>{
                window.__menus['Aktuelle Domain zur Blacklist']();
                const r=document.createRange();r.selectNodeContents(document.getElementById('selected'));getSelection().removeAllRanges();getSelection().addRange(r);
            });
            await page.keyboard.press('Alt+h');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),0,'Ausgeschlossene Seite ignoriert vorhandene Shortcuts');
        },
        async review_disabling_clears_counter_and_match_list(browser) {
            const page=await panel(browser);await settled(page);await settings(page);await page.uncheck('#chk-enabled');
            eq(await page.locator('.slim-hl').count(),0);eq(await page.textContent('#hl-counter'),'0 / 0');
            eq(await page.locator('#match-list .match-item').count(),0);eq(await page.locator('#btn-next').isDisabled(),true);
        }
    };
};
