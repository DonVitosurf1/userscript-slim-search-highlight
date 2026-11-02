'use strict';

module.exports=({open,eq,ok})=>{
    const url='https://example.test/article';
    const html='<main><p>Outlook iPhone Archive</p><p>Outlook iPhone</p><p id="own">Open</p><p>Open</p><p id="phone">iPhone</p></main>';
    const queryStore=()=>({hl_auto_search:true,hl_search_handoffs:{version:1,entries:[{target:url,source:'https://www.google.com',terms:['Outlook','iPhone'],timestamp:Date.now()}]}});
    const fixture=async(browser,extra={})=>{
        const {initialMatches=6,...options}=extra;
        const page=await open(browser,{url,html,keywords:[{text:'Archive',color:'#b388ff'}],panelOpen:true,permanentOpen:false,store:queryStore(),...options});
        await page.waitForFunction(n=>document.querySelectorAll('.slim-hl').length===n,initialMatches);
        return page;
    };
    const row=(page,text)=>page.locator(`.page-item[data-term-key="${text.toLowerCase()}"]`);
    const mark=async(page,id)=>{
        await page.locator('#'+id).evaluate(node=>{
            document.activeElement?.blur();const range=document.createRange();range.selectNodeContents(node);
            getSelection().removeAllRanges();getSelection().addRange(range);
        });
        await page.keyboard.press('Alt+Shift+H');
    };
    const tickCount=(page,n)=>page.waitForFunction(n=>document.querySelectorAll('#slim-pos-bar .mark').length===n,n,{timeout:3000});
    return {
        async overview_combines_search_and_selection_with_source_and_counts(browser){
            const page=await fixture(browser);
            eq(await page.locator('#page-list .page-item').count(),2,'Both Google terms appear in the overview');
            eq(await row(page,'Outlook').locator('.kw-count').textContent(),'2');
            ok((await row(page,'Outlook').locator('.page-state').textContent()).includes('Suche'),'Search source is visible');
            await mark(page,'own');await tickCount(page,8);
            eq(await page.locator('#page-list .page-item').count(),3);
            ok((await row(page,'Open').locator('.page-state').textContent()).includes('Auswahl'),'Selection source is visible');
            eq(await row(page,'Open').locator('.kw-count').textContent(),'2');
            await mark(page,'phone');await tickCount(page,8);
            eq(await row(page,'iPhone').count(),1,'Same query and selection have one row');
            const source=await row(page,'iPhone').locator('.page-state').textContent();
            ok(source.includes('Suche')&&source.includes('Auswahl'),'Both sources are disclosed');
            eq(await row(page,'iPhone').locator('.kw-count').textContent(),'3','Identical ranges do not double the count');
            eq(await row(page,'Archive').count(),0,'Permanent-only keywords remain in their separate editor');
            eq(await page.locator('#kw-list input[type=text]').inputValue(),'Archive');
            eq(await page.evaluate(()=>window.__store.hl_keywords.length),1,'No implicit keyword saving');
        },
        async overview_hide_shared_term_updates_both_engines_without_storage_writes(browser){
            const page=await fixture(browser);await mark(page,'phone');await tickCount(page,6);
            const before=await page.evaluate(()=>JSON.stringify(window.__store));
            const toggle=row(page,'iPhone').locator('.term-visibility');
            await toggle.focus();await page.keyboard.press('Enter');await tickCount(page,3);
            eq(await row(page,'iPhone').locator('.term-visibility').getAttribute('aria-pressed'),'false');
            eq(await page.locator('.slim-hl[data-kw="iPhone"]').count(),0,'Automatic paint is hidden');
            eq(await page.evaluate(()=>CSS.highlights.get('slim-page')?.size||0),0,'Native paint is hidden too');
            ok((await row(page,'iPhone').locator('.page-state').textContent()).includes('Ausgeblendet'));
            eq(await row(page,'iPhone').locator('.kw-count').textContent(),'0');
            eq(await toggle.evaluate(node=>node===document.activeElement),true,'Focus stays on the rebuilt toggle');
            eq(await page.evaluate(()=>JSON.stringify(window.__store)),before,'Visibility is not persisted');
            await page.keyboard.press('Space');await tickCount(page,6);
            eq(await row(page,'iPhone').locator('.term-visibility').getAttribute('aria-pressed'),'true');
            eq(await row(page,'iPhone').locator('.kw-count').textContent(),'3');
        },
        async overview_all_hidden_is_recoverable_and_dynamic_content_stays_hidden(browser){
            const page=await fixture(browser,{keywords:[],initialMatches:5});await mark(page,'own');await tickCount(page,7);
            for(const text of ['Outlook','iPhone','Open'])await row(page,text).locator('.term-visibility').click();
            await page.waitForFunction(()=>document.getElementById('hl-counter').textContent==='0 / 0');
            eq(await page.locator('#slim-pos-bar').count(),0);
            eq(await page.locator('#btn-next').isDisabled(),true);
            eq(await page.locator('#page-list .page-item').count(),3,'Hidden rows remain available');
            await page.evaluate(()=>document.body.insertAdjacentHTML('beforeend','<p>Outlook iPhone Open</p>'));
            await page.waitForTimeout(400);
            eq(await page.locator('.slim-hl').count(),0,'New content respects hidden search words');
            eq(await page.evaluate(()=>CSS.highlights.get('slim-page')?.size||0),0);
            await mark(page,'own');await tickCount(page,3);
            eq(await row(page,'Open').locator('.term-visibility').getAttribute('aria-pressed'),'true','Selecting hidden text explicitly reveals it');
            ok((await page.locator('#panel-status').textContent()).includes('wieder eingeblendet'),'Selection clears the old hidden status');
            await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,6);
            eq(await row(page,'iPhone').locator('.term-visibility').getAttribute('aria-pressed'),'false');
        },
        async overview_hiding_saved_passage_preserves_record_and_resets_on_reload(browser){
            const page=await fixture(browser);await mark(page,'own');await row(page,'Open').locator('.page-save').click();
            const saved=await page.evaluate(()=>JSON.stringify(window.__store.hl_page_annotations));
            await row(page,'Open').locator('.term-visibility').click();await tickCount(page,6);
            eq(await page.evaluate(()=>JSON.stringify(window.__store.hl_page_annotations)),saved);
            const restored=await fixture(browser,{store:await page.evaluate(()=>window.__store)});
            await tickCount(restored,8);
            eq(await row(restored,'Open').locator('.term-visibility').getAttribute('aria-pressed'),'true','Reload restores visibility');
            eq(await row(restored,'Open').locator('.page-save').getAttribute('aria-pressed'),'true');
        },
        async overview_url_change_clears_hidden_search_state_without_waiting_for_reload(browser){
            const page=await fixture(browser);await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,4);
            await page.evaluate(()=>history.pushState({},'','/next#hl=Outlook,iPhone'));
            await tickCount(page,6);
            eq(await row(page,'Outlook').locator('.term-visibility').getAttribute('aria-pressed'),'true','SPA navigation resets hidden state');
        },
        async overview_page_context_updates_even_while_panel_is_closed(browser){
            const page=await fixture(browser,{panelOpen:false});
            await page.evaluate(()=>history.pushState({},'','/next'));
            await page.waitForFunction(()=>document.querySelectorAll('.slim-hl').length===1,null,{timeout:2500});
            await page.locator('#slim-hl-toggle').click();
            eq(await page.locator('#page-list .page-item').count(),0,'Previous-page search terms are not reused on a new route');
            eq(await page.locator('.slim-hl').textContent(),'Archive','Applicable permanent keyword stays active');
        },
        async overview_url_tracking_survives_an_intermediate_termless_route(browser){
            const page=await fixture(browser,{keywords:[],initialMatches:5});
            await page.evaluate(()=>history.pushState({},'','/other'));
            await page.waitForFunction(()=>document.querySelectorAll('#page-list .page-item').length===0&&document.querySelectorAll('.slim-hl').length===0,null,{timeout:2500});
            await page.evaluate(()=>history.pushState({},'','/third#hl=iPhone'));
            await page.waitForFunction(()=>document.querySelectorAll('.slim-hl').length===3,null,{timeout:2500});
            eq(await row(page,'iPhone').count(),1,'A later query route recovers after the empty route');
            eq(await page.locator('#page-list .page-item').count(),1);
        },
        async overview_query_duplicate_of_permanent_keyword_hides_without_editing_profile(browser){
            const keywords=[{text:'Outlook',color:'#b388ff'}];
            const page=await fixture(browser,{keywords,initialMatches:5,html:html.replace('Archive','Other')});
            const profile=await page.evaluate(()=>JSON.stringify(window.__store.hl_keywords));
            await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,3);
            eq(await page.locator('.slim-hl[data-kw="Outlook"]').count(),0);
            eq(await page.evaluate(()=>JSON.stringify(window.__store.hl_keywords)),profile,'Temporary hide never edits permanent data');
            await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,5);
        },
        async overview_page_query_survives_handoff_expiry_after_arrival(browser){
            const page=await fixture(browser);
            await page.evaluate(()=>{
                const nativeNow=Date.now;Date.now=()=>nativeNow()+20*60*1000;
            });
            await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,4);
            await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,6);
            eq(await row(page,'iPhone').count(),1,'Accepted search terms remain available on the current page');
        },
        async overview_visibility_and_url_change_cancel_older_keyword_work(browser){
            const page=await open(browser,{url,panelOpen:true,permanentOpen:false,keywords:[],store:queryStore(),html:'<p>iPhone</p>'+Array.from({length:4000},()=>'<p>Outlook</p>').join('')});
            await row(page,'Outlook').locator('.term-visibility').click();
            await page.evaluate(()=>history.pushState({},'','/next#hl=iPhone'));
            await page.waitForFunction(()=>document.querySelectorAll('#page-list .page-item').length===1&&document.getElementById('hl-counter').textContent==='1 / 1',null,{timeout:7000});
            eq(await row(page,'Outlook').count(),0,'Previous query is not reaccepted on another SPA route');
            eq(await page.locator('.slim-hl[data-kw="Outlook"]').count(),0,'Cancelled work cannot repaint the old query');
            eq(await page.locator('.slim-hl[data-kw="iPhone"]').count(),1);
        },
        async overview_hiding_one_term_keeps_a_different_overlapping_passage(browser){
            const page=await fixture(browser,{keywords:[],initialMatches:2,html:'<p id="own">Outlook Apple</p><p>Outlook Apple</p>'});
            await mark(page,'own');await tickCount(page,4);
            await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,2);
            eq(await page.evaluate(()=>CSS.highlights.get('slim-page')?.size||0),2,'Another selected passage remains independently visible');
            eq(await row(page,'Outlook Apple').locator('.term-visibility').getAttribute('aria-pressed'),'true');
        },
        async overview_narrow_theme_locale_and_visibility_states_remain_usable(browser){
            for(const theme of ['light','dark']){
                const page=await fixture(browser,{viewport:{width:320,height:568},store:{...queryStore(),hl_ui_theme:theme}});
                await mark(page,'own');await tickCount(page,8);
                await row(page,'Outlook').locator('.term-visibility').click();await tickCount(page,6);
                await page.locator('#settings-section > summary').click();await page.selectOption('#ui-lang','en');
                const toggle=row(page,'Outlook').locator('.term-visibility');
                eq(await toggle.getAttribute('aria-pressed'),'false','Language recreation preserves temporary visibility');
                ok((await toggle.getAttribute('title')).includes('Show'),'Translated hover explains recovery');
                await toggle.scrollIntoViewIfNeeded();
                const rect=await toggle.boundingBox();ok(rect.height>=44,'Touch target remains usable');
                eq(await page.locator('.panel-body').evaluate(node=>node.scrollWidth>node.clientWidth),false,'No horizontal overflow');
                await toggle.focus();await page.keyboard.press('Enter');await tickCount(page,8);
            }
        }
    };
};
