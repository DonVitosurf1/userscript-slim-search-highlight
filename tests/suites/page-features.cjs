'use strict';
module.exports=({open,eq,ok,selectionShortcutTime})=>{
  const url='https://example.test/article';
  const pageWith=(b,o={})=>open(b,{url,keywords:[],panelOpen:true,permanentOpen:false,html:'<p id="choose">Solarenergie</p><p>Solarenergie hilft.</p>',...o});
  const select=p=>p.evaluate(()=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});
  const mark=async p=>{await select(p);await p.keyboard.press('Alt+Shift+H');};
  const count=p=>p.evaluate(()=>CSS.highlights.get('slim-page')?.size||0);
  const tools=async p=>{await select(p);await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();};
  return {
    async feature_page_colors_and_undo_clear(b){
      const p=await pageWith(b);await mark(p);ok(await p.locator('.page-item input[type=color]').count(),'Page color control');
      await p.locator('.page-item input[type=color]').fill('#222222');await p.locator('.page-item input[type=color]').dispatchEvent('change');
      ok(await p.evaluate(()=>[...CSS.highlights.keys()].some(k=>k.startsWith('slim-page-term-'))),'Per-term paint');
      await p.click('#clear-page');eq(await count(p),0);await p.click('#undo-page');eq(await count(p),2);eq(await p.locator('.page-item input[type=color]').inputValue(),'#222222');
    },
    async feature_explicit_save_restore_forget_and_undo(b){
      const p=await pageWith(b);await mark(p);eq(await p.evaluate(()=>!!window.__store.hl_page_annotations),false,'Default remains ephemeral');
      ok(await p.locator('.page-save').count(),'Remember action');await p.locator('.page-save').click();
      const store=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__store)));
      eq(store.hl_page_annotations.version,1);eq(store.hl_page_annotations.pages[url].terms[0].text,'Solarenergie');ok(store.hl_page_annotations.pages[url].terms[0].anchor.exact);
      const restored=await pageWith(b,{store});await restored.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===2);
      eq(await restored.locator('.page-save').getAttribute('aria-pressed'),'true');await restored.locator('.page-save').click();
      eq(await restored.evaluate(url=>!!window.__store.hl_page_annotations.pages[url],url),false);eq(await count(restored),2,'Forget keeps temporary marks');
      await restored.locator('.page-remove').click();eq(await count(restored),0);await restored.click('#undo-page');eq(await count(restored),2);
    },
    async feature_saved_missing_text_is_reported(b){
      const store={hl_page_annotations:{version:1,pages:{[url]:{terms:[{id:'1',text:'Verschwunden',color:'#ffe082',anchor:{exact:'Verschwunden',prefix:'',suffix:''}}],options:{wholeWords:false,articleOnly:false}}}}};
      const p=await pageWith(b,{store});ok(await p.locator('.page-item').count(),'Saved item restored');ok((await p.locator('.page-state').textContent()).includes('Nicht gefunden'));eq(await count(p),0);
    },
    async feature_page_storage_preserves_other_urls(b){
      const other='https://example.test/other',store={hl_page_annotations:{version:1,pages:{[other]:{terms:[{id:'9',text:'Andere Seite',color:'#ffe082',anchor:{exact:'Andere Seite'}}]}}}};
      const p=await pageWith(b,{store});await mark(p);ok(await p.locator('.page-save').count(),'Remember action');await p.locator('.page-save').click();eq(await p.evaluate(u=>window.__store.hl_page_annotations.pages[u].terms[0].text,other),'Andere Seite');
    },
    async feature_quote_clipboard_plain_and_markdown(b){
      const p=await pageWith(b);await p.evaluate(()=>{window.__copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copied.push(text)}})});
      await tools(p);ok(await p.locator('#selection-share').count(),'Share disclosure');await p.locator('#selection-share > summary').click();await p.click('#selection-quote');
      const text=await p.evaluate(()=>window.__copied[0]);ok(text.includes('Solarenergie')&&text.includes('https://example.test/article'),'Quote and URL copied');
      await p.locator('#settings-section > summary').click();await p.selectOption('#copy-format','markdown');await tools(p);await p.locator('#selection-share > summary').click();await p.click('#selection-quote');
      ok((await p.evaluate(()=>window.__copied.at(-1))).startsWith('> '),'Markdown quote');
    },
    async feature_successful_copy_exposes_confirmation(b){
      const p=await pageWith(b,{panelOpen:false});await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));
      await tools(p);await p.locator('#selection-share > summary').click();await p.click('#selection-quote');
      await p.locator('#panel-status').waitFor({state:'visible',timeout:3000});eq(await p.textContent('#panel-status'),'In die Zwischenablage kopiert.');
    },
    async feature_copy_failure_offers_manual_copy(b){
      const p=await pageWith(b);await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));
      await tools(p);ok(await p.locator('#selection-share').count(),'Share disclosure');await p.locator('#selection-share > summary').click();await p.click('#selection-quote');
      await p.locator('#manual-copy').waitFor({state:'visible'});ok((await p.inputValue('#manual-copy')).includes('Solarenergie'));eq(await p.evaluate(()=>document.activeElement.id),'manual-copy');
    },
    async feature_text_fragment_link_is_encoded(b){
      const p=await pageWith(b);await p.evaluate(()=>{window.__copied=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async s=>window.__copied.push(s)}})});
      await tools(p);ok(await p.locator('#selection-share').count(),'Share disclosure');await p.locator('#selection-share > summary').click();await p.click('#selection-link');
      const link=await p.evaluate(()=>window.__copied[0]);ok(link.includes('#:~:text=Solarenergie'),'Text fragment link');
    },
    async feature_whole_word_and_article_scope(b){
      const p=await pageWith(b,{html:'<aside>art</aside><main><p id="choose">art</p><p>start art</p></main>'});await mark(p);eq(await count(p),4);
      ok(await p.locator('#page-options').count(),'Page search options');await p.locator('#page-options > summary').click();await p.check('#page-whole');eq(await count(p),3);
      await p.selectOption('#page-scope','article');eq(await count(p),2);
    },
    async feature_missing_article_does_not_broaden_scope(b){
      const p=await pageWith(b);await mark(p);ok(await p.locator('#page-options').count(),'Page search options');await p.locator('#page-options > summary').click();await p.selectOption('#page-scope','article');eq(await count(p),0);ok((await p.textContent('#page-search-status')).includes('Artikelbereich'));
    },
    async feature_storage_write_failure_keeps_mark_temporary(b){
      const p=await pageWith(b);await mark(p);await p.evaluate(()=>{const original=window.GM_setValue;window.GM_setValue=(k,v)=>{if(k==='hl_page_annotations')throw Error('quota');return original(k,v);};});
      await p.locator('.page-save').click();eq(await p.locator('.page-save').getAttribute('aria-pressed'),'false');ok((await p.textContent('#panel-status')).includes('speichern'));eq(await count(p),2);
    },
    async feature_unsupported_storage_is_not_overwritten_and_can_export(b){
      const p=await pageWith(b,{store:{hl_page_annotations:{version:99,pages:{future:'data'}}}});await mark(p);await p.locator('.page-save').click();eq(await p.evaluate(()=>window.__store.hl_page_annotations.version),99);
      await p.locator('#settings-section > summary').click();await p.click('#export-saved');const data=await p.evaluate(async()=>JSON.parse(await(await fetch(window.__download.url)).text()));eq(data.version,99);
    },
    async feature_markdown_export_contains_page_passages(b){
      const p=await pageWith(b);await mark(p);await p.locator('#settings-section > summary').click();await p.click('#export-markdown');const text=await p.evaluate(async()=>await(await fetch(window.__download.url)).text());ok(text.includes('> Solarenergie')&&text.includes(url));
    },
    async feature_large_search_cancels_without_restoring_marks(b){
      const p=await pageWith(b,{html:'<p id="choose">alpha</p><p>'+('alpha '.repeat(10000))+'</p>'});
      await p.locator('#settings-section').evaluate(el=>{el.open=true});await select(p);await p.keyboard.press('Alt+Shift+H');await p.locator('#chk-enabled').click();
      await p.waitForTimeout(350);eq(await count(p),0,'Cancelled generation cannot repaint');eq(await p.locator('#btn-next').isDisabled(),true);
    },
    async feature_fast_url_change_cannot_delete_other_page_data(b){
      const next='https://example.test/next';
      const record=text=>({terms:[{id:'p1',text,color:'#ffe082',anchor:{exact:text}}],options:{}});
      const p=await pageWith(b,{store:{hl_page_annotations:{version:1,pages:{[url]:record('Solarenergie'),[next]:record('Windkraft')}}}});
      await p.waitForSelector('.page-save');await p.evaluate(next=>history.pushState({},'',next),next);await p.locator('.page-save').click();
      eq(await p.evaluate(u=>window.__store.hl_page_annotations.pages[u].terms[0].text,next),'Windkraft','Stale actions cannot touch the new URL record');
    },
    async feature_spa_navigation_restores_saved_page_from_empty_state(b){
      const next='https://example.test/next';const p=await pageWith(b,{store:{hl_page_annotations:{version:1,pages:{[next]:{terms:[{id:'p1',text:'Solarenergie',color:'#ffe082',anchor:{exact:'Solarenergie'}}]}}}}});
      eq(await p.locator('.page-item').count(),0);await p.evaluate(next=>history.pushState({},'',next),next);
      await p.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===2,null,{timeout:3000});eq(await p.locator('.page-save').getAttribute('aria-pressed'),'true');
    },
    async feature_normalization_of_large_whitespace_nodes_yields(b){
      const p=await pageWith(b,{html:'<p id="choose">needle</p><p>'+('alpha\n'.repeat(300000))+'</p>'});
      await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});const time=await selectionShortcutTime(p);
      ok(time<100,'Normalization blocked the handler for '+time+'ms');await p.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===1,null,{timeout:10000});
    },
    async feature_failed_option_save_restores_previous_options(b){
      const p=await pageWith(b);await mark(p);await p.locator('.page-save').click();await p.evaluate(()=>{const original=window.GM_setValue;window.GM_setValue=(k,v)=>{if(k==='hl_page_annotations')throw Error('quota');return original(k,v);};});
      await p.locator('#page-options > summary').click();await p.click('#page-whole');eq(await p.locator('#page-whole').isChecked(),false,'Failed saved option change rolls back');
    },
    async feature_manual_copy_survives_language_change(b){
      const p=await pageWith(b);await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));await tools(p);await p.locator('#selection-share > summary').click();await p.click('#selection-quote');const before=await p.inputValue('#manual-copy');
      await p.locator('#settings-section > summary').click();await p.selectOption('#ui-lang','en');eq(await p.inputValue('#manual-copy'),before);eq(await p.locator('#manual-copy-section').isVisible(),true);
    },
    async feature_selection_tools_stay_above_panel_after_first_use(b){
      const p=await pageWith(b,{panelOpen:false,viewport:{width:390,height:844},html:'<p id="choose" style="margin-top:200px">Solarenergie</p><p>Solarenergie</p>'});
      await tools(p);await p.getByRole('button',{name:'Alle Vorkommen markieren',exact:true}).click();await select(p);await p.locator('#selection-trigger').waitFor({state:'visible'});
      const hit=await p.locator('#selection-trigger').evaluate(el=>{const r=el.getBoundingClientRect(),top=el.getRootNode().elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el.contains(top);});
      eq(hit,true,'Selection controls must not be covered by the owned panel');
    },
    async feature_chunked_offsets_preserve_whitespace_range_boundaries(b){
      const p=await pageWith(b,{html:'<p id="choose">alpha beta</p><p>'+('x'.repeat(8189))+'alpha   \n\t beta '+('z'.repeat(9000))+'alpha \n beta</p>'});await mark(p);await p.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===3,null,{timeout:5000});
      const actual=await p.evaluate(()=>[...CSS.highlights.get('slim-page')].map(r=>r.toString().replace(/\s+/g,' ').trim()));eq(actual.join('|'),'alpha beta|alpha beta|alpha beta');
    },
    async feature_manual_copy_focus_remains_inside_scroller(b){
      const p=await pageWith(b,{viewport:{width:390,height:844}});await mark(p);await p.locator('.page-save').click();await p.locator('#page-options > summary').click();await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));
      await tools(p);await p.locator('#selection-share > summary').click();await p.click('#selection-quote');await p.locator('#manual-copy').waitFor({state:'visible'});
      const field=await p.locator('#manual-copy').boundingBox(),body=await p.locator('.panel-body').boundingBox();ok(field.y>=body.y-1&&field.y+field.height<=body.y+body.height+1,'Manual copy field fully visible while focused');
    },
    async feature_saved_records_export_as_versioned_json(b){
      const p=await pageWith(b);await mark(p);ok(await p.locator('.page-save').count(),'Remember action');await p.locator('.page-save').click();await p.locator('#settings-section > summary').click();
      await p.click('#export-saved');const data=await p.evaluate(async()=>JSON.parse(await(await fetch(window.__download.url)).text()));eq(data.version,1);eq(data.pages[url].terms[0].text,'Solarenergie');
    }
  };
};
