'use strict';
module.exports = ({ open, eq, ok }) => {
    const pageWith = async (browser, options={}) => {
        const page=await open(browser,{keywords:[],panelOpen:true,permanentOpen:false,html:'<p id="choose">Solarenergie</p><p>Solarenergie hilft.</p>',...options});
        page.setDefaultTimeout(2500);return page;
    };
    const select = page => page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.getElementById('choose'));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);});
    const count = page => page.evaluate(()=>CSS.highlights?.get('slim-page')?.size||0);
    const highlight = async page => {await select(page);await page.keyboard.press('Alt+Shift+H');};
    const settleCount = async (page,n) => page.waitForFunction(n=>(CSS.highlights?.get('slim-page')?.size||0)===n,n,{timeout:3000});
    return {
        async selection_shortcut_highlights_all_without_saving(browser){
            const page=await pageWith(browser);await highlight(page);
            eq(await count(page),2,'Alle Vorkommen markiert');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),0,'Keine dauerhaften Keywords');
            eq(await page.evaluate(()=>Object.keys(window.__store).some(k=>/cross_terms|page_terms|page_selections/.test(k))),false,'Kein persistierter Auswahltext');
            eq(await page.locator('#hl-counter').textContent(),'1 / 2');
        },
        async selection_old_shortcut_and_right_click_are_native(browser){
            const page=await pageWith(browser);await select(page);await page.keyboard.press('Alt+h');
            eq(await count(page),0);eq(await page.evaluate(()=>window.__store.hl_keywords.length),0,'Alt+H speichert nichts');
            const result=await page.evaluate(()=>{window.__opened=[];window.open=(...args)=>window.__opened.push(args);const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.getElementById('choose').dispatchEvent(e);return {prevented:e.defaultPrevented,opened:window.__opened.length};});
            eq(result.prevented,false);eq(result.opened,0);
        },
        async selection_symbol_offers_one_combined_action(browser){
            const page=await pageWith(browser);await select(page);
            await page.locator('#selection-trigger').waitFor({state:'visible'});
            await page.locator('#selection-trigger').hover();
            await page.getByRole('button',{name:'Alle Vorkommen markieren',exact:true}).click();
            await settleCount(page,2);eq(await page.locator('#page-list .page-item').count(),1);
            eq(await page.locator('#permanent-keywords').getAttribute('open'),null,'Dauerhafte Keywords standardmäßig zu');
        },
        async selection_web_search_is_explicit_and_uses_snapshot(browser){
            const page=await pageWith(browser,{store:{hl_search_engine:'ddg'}});
            await page.evaluate(()=>{window.__opened=[];window.open=(...args)=>window.__opened.push(args);});
            await select(page);await page.locator('#selection-trigger').waitFor({state:'visible'});
            eq(await page.evaluate(()=>window.__opened.length),0);
            await page.locator('#selection-trigger').focus();await page.keyboard.press('Enter');
            await page.getByRole('button',{name:'Im Web suchen',exact:true}).click();
            eq(await count(page),0);eq(await page.evaluate(()=>window.__opened[0][0]),'https://duckduckgo.com/?q=Solarenergie');
            eq(await page.evaluate(()=>window.__opened[0][2]),'noopener,noreferrer');
        },
        async selection_cross_node_phrase_and_whitespace(browser){
            const page=await pageWith(browser,{html:'<p id="choose">Die <b>Solarenergie</b> hilft.</p><p>Die\n <em>Solarenergie</em>\t hilft.</p><p>Die andere Energie hilft.</p>'});
            await highlight(page);eq(await count(page),2,'Satz über Inline-Elemente mit normalisiertem Whitespace');
            eq(await page.evaluate(()=>[...CSS.highlights.get('slim-page')][0].toString()),'Die Solarenergie hilft.');
            eq(await page.locator('#choose b').textContent(),'Solarenergie','Markup bleibt erhalten');
            await page.click('#btn-next');eq(await page.locator('#hl-counter').textContent(),'2 / 2');
        },
        async selection_literal_symbols_and_single_characters(browser){
            const page=await pageWith(browser,{html:'<p id="choose">/a+/i</p><p>/a+/i und aa</p>'});await highlight(page);eq(await count(page),2,'Auswahl ist kein Regex');
            const single=await pageWith(browser,{html:'<p id="choose">a</p><p>a b</p>'});await highlight(single);eq(await count(single),2,'Einzelzeichen werden nicht verworfen');
        },
        async selection_ignores_hidden_editable_and_owned_text(browser){
            const page=await pageWith(browser,{html:'<p id="choose">Solarenergie</p><p hidden>Solarenergie</p><div style="display:none">Solarenergie</div><textarea>Solarenergie</textarea><div contenteditable="true">Solarenergie</div><code>Solarenergie</code>'});
            await highlight(page);eq(await count(page),1,'Nur sichtbarer Seitentext');
        },
        async selection_repeated_passage_is_not_duplicated(browser){
            const page=await pageWith(browser);await highlight(page);await highlight(page);
            eq(await count(page),2);eq(await page.locator('#page-list .page-item').count(),1);
        },
        async selection_dynamic_content_updates_without_saved_keywords(browser){
            const page=await pageWith(browser);await highlight(page);eq(await count(page),2);
            await page.evaluate(()=>document.body.insertAdjacentHTML('beforeend','<p id="added">Solarenergie</p>'));
            await settleCount(page,3);
            await page.locator('#added').evaluate(e=>e.remove());await settleCount(page,2);
        },
        async selection_clear_and_disable_remove_css_ranges(browser){
            const page=await pageWith(browser);await highlight(page);eq(await count(page),2);
            ok(await page.locator('#clear-page').count(),'Alle Seitenmarkierungen löschen');
            await page.click('#clear-page');eq(await count(page),0);
            await highlight(page);await page.locator('#settings-section > summary').click();await page.uncheck('#chk-enabled');eq(await count(page),0);
            await page.check('#chk-enabled');await settleCount(page,2);
        },
        async selection_shortcut_can_be_changed_disabled_and_reset(browser){
            const page=await pageWith(browser);ok(await page.locator('#record-shortcut').count(),'Shortcut einstellbar');
            await page.locator('#settings-section > summary').click();await page.click('#record-shortcut');await page.keyboard.press('Control+Shift+Y');
            await select(page);await page.locator('#choose').click();await select(page);await page.keyboard.press('Alt+Shift+H');eq(await count(page),0,'Alter Shortcut deaktiviert');
            await page.keyboard.press('Control+Shift+Y');eq(await count(page),2,'Neuer Shortcut funktioniert');
            await page.click('#clear-page');await page.click('#disable-shortcut');await select(page);await page.keyboard.press('Control+Shift+Y');eq(await count(page),0);
            await page.click('#reset-shortcut');await select(page);await page.keyboard.press('Alt+Shift+H');eq(await count(page),2);
        },
        async selection_shortcut_does_not_handle_editing_ime_or_repeat(browser){
            const page=await pageWith(browser,{html:'<p id="choose">Solarenergie</p><input id="edit" value="Solarenergie">'});await select(page);await page.focus('#edit');
            await page.keyboard.press('Alt+Shift+H');eq(await count(page),0);
            await page.locator('#choose').click();await select(page);
            const handled=await page.evaluate(()=>[true,false].map(ime=>{const e=new KeyboardEvent('keydown',{key:'H',altKey:true,shiftKey:true,isComposing:ime,repeat:!ime,bubbles:true,cancelable:true});document.body.dispatchEvent(e);return e.defaultPrevented;}));
            eq(handled.join(','),'false,false');eq(await count(page),0);
        },
        async selection_page_state_is_not_restored_on_another_page(browser){
            const page=await pageWith(browser);await highlight(page);eq(await count(page),2);
            const next=await pageWith(browser);eq(await count(next),0);eq(await next.locator('#page-list .page-item').count(),0);
        },
        async selection_double_click_on_saved_highlight_keeps_native_selection(browser){
            const page=await pageWith(browser,{keywords:[{text:'Solarenergie',color:'#ff0'}]});await page.waitForSelector('.slim-hl');
            const scrolls=await page.evaluate(()=>{let calls=0;Element.prototype.scrollIntoView=()=>calls++;document.querySelector('.slim-hl').dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));return calls;});
            eq(scrolls,0,'Doppelklick soll Text auswählen statt navigieren');
        },
        async selection_character_data_and_overlaps_remain_consistent(browser){
            const page=await pageWith(browser,{html:'<p id="choose">Solarenergie</p><p id="other">Solarenergie hilft</p>'});await highlight(page);eq(await count(page),2);
            await page.evaluate(()=>document.getElementById('other').firstChild.data='Windkraft hilft');await settleCount(page,1);
            await page.evaluate(()=>document.getElementById('other').firstChild.data='Solarenergie hilft');await settleCount(page,2);
            await page.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('other'));getSelection().removeAllRanges();getSelection().addRange(r);});await page.keyboard.press('Alt+Shift+H');
            eq(await count(page),2,'Überlappende Fundstellen nicht doppelt zählen');
        },
        async selection_toolbar_dismissal_and_web_focus(browser){
            const page=await pageWith(browser);await select(page);await page.locator('#selection-trigger').waitFor({state:'visible'});
            await page.locator('#selection-trigger').focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');
            eq(await page.locator('#slim-selection-tools').isVisible(),false);eq(await page.evaluate(()=>document.activeElement.id),'slim-hl-toggle');
            await page.evaluate(()=>{window.open=()=>{};});await select(page);await page.locator('#selection-trigger').waitFor({state:'visible'});await page.locator('#selection-trigger').focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Im Web suchen',exact:true}).focus();await page.keyboard.press('Enter');
            eq(await page.evaluate(()=>document.activeElement.id),'slim-hl-toggle','Webaktion stellt Fokus wieder her');
        },
        async selection_explicit_line_breaks_match_the_original_passage(browser){
            const page=await pageWith(browser,{html:'<p id="choose">hello<br>world</p><p>hello<br>world</p>'});await highlight(page);eq(await count(page),2,'Zeilenumbruch ist normalisiertes Leerzeichen');
        },
        async selection_hidden_attribute_changes_remove_results(browser){
            const page=await pageWith(browser,{html:'<p id="choose">Solarenergie</p><p id="other">Solarenergie</p>'});await highlight(page);eq(await count(page),2);await page.waitForTimeout(800);
            await page.locator('#other').evaluate(e=>e.hidden=true);await settleCount(page,1);
            await page.locator('#other').evaluate(e=>{e.hidden=false;e.style.display='none';});await settleCount(page,1);
            await page.locator('#other').evaluate(e=>e.style.display='');await settleCount(page,2);
        },
        async selection_pushstate_and_replacestate_clear_page_state(browser){
            const page=await pageWith(browser,{url:'https://example.test/start'});await highlight(page);eq(await count(page),2);await page.waitForTimeout(800);
            await page.evaluate(()=>history.pushState({},'', '/next'));await settleCount(page,0);eq(await page.locator('#page-list .page-item').count(),0);
            await highlight(page);eq(await count(page),2);await page.waitForTimeout(500);
            await page.evaluate(()=>history.replaceState({},'', '/last'));await settleCount(page,0);
        },
        async selection_plaintext_editors_are_excluded(browser){
            const page=await pageWith(browser,{html:'<p id="choose">Solarenergie</p><div contenteditable="plaintext-only">Solarenergie</div>'});await highlight(page);eq(await count(page),1);
        },
        async selection_observer_ignores_owned_text_splits(browser){
            // Isolate the text mutation path from legitimate geometry-observer updates.
            const page=await pageWith(browser,{panelOpen:false,keywords:[{text:'lorem',color:'#ff0'}],html:'<script>window.ResizeObserver=class {observe(){} disconnect(){}}</script><p>lorem lorem</p>'});
            await page.waitForSelector('#slim-pos-bar .mark');
            await page.locator('#slim-pos-bar .mark').first().evaluate(e=>e.id='stable-owned-mark');
            await page.waitForTimeout(650);
            eq(await page.locator('#stable-owned-mark').count(),1,'Eigene Textsplits dürfen keinen zweiten Durchlauf anstoßen');
        },
        async selection_context_menu_on_existing_highlight_stays_native(browser){
            const page=await pageWith(browser,{keywords:[{text:'Solarenergie',color:'#ff0'}]});
            await page.waitForSelector('.slim-hl');
            eq(await page.locator('.slim-hl').first().evaluate(el=>{const e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented;}),false);
        }
    };
};
