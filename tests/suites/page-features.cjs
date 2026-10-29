'use strict';
module.exports=({open,eq,ok,selectionShortcutTime})=>{
  const url='https://example.test/article';
  const pageWith=(b,o={})=>open(b,{url,keywords:[],panelOpen:true,permanentOpen:false,html:'<p id="choose">Solarenergie</p><p>Solarenergie hilft.</p>',...o});
  const select=p=>p.evaluate(()=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});
  const mark=async p=>{await select(p);await p.keyboard.press('Alt+Shift+H');};
  const count=p=>p.evaluate(()=>CSS.highlights.get('slim-page')?.size||0);
  const tools=async p=>{await select(p);await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();};
  return {
    async feature_new_page_highlights_get_distinct_vivid_colors(b){
      const words=Array.from({length:14},(_,i)=>'Begriff-'+String.fromCharCode(65+i));
      const p=await pageWith(b,{keywords:[{text:'Permanent',color:'#ffdf00'}],html:'<p>Permanent</p>'+words.map((word,i)=>`<p id="word-${i}">${word}</p><p>${word}</p>`).join('')});
      for(let i=0;i<words.length;i++){
        await p.evaluate(i=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('word-'+i));getSelection().removeAllRanges();getSelection().addRange(r);},i);
        if(i===1){await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();await p.click('#selection-highlight');}
        else await p.keyboard.press('Alt+Shift+H');
      }
      const colors=await p.locator('.page-item input[type=color]').evaluateAll(inputs=>inputs.map(input=>input.value));
      eq(colors.length,words.length);eq(new Set(colors).size,words.length,'Each new passage gets an unused color, including after the initial palette');
      ok(!colors.includes('#ffdf00'),'Avoid colors of applicable permanent keywords too');
      for(const color of colors){
        const rgb=color.match(/\w\w/g).map(channel=>parseInt(channel,16));
        ok(Math.max(...rgb)-Math.min(...rgb)>=100&&Math.max(...rgb)>=220,'Highlight color is bright and saturated: '+color);
      }
      const paints=await p.evaluate(()=>[...CSS.highlights.entries()].filter(([name])=>name.startsWith('slim-page-term-')).map(([name,ranges])=>{
        const rule=[...document.getElementById('slim-page-colors').sheet.cssRules].find(rule=>rule.selectorText===`::highlight(${name})`);
        return {count:ranges.size,background:rule.style.backgroundColor,foreground:rule.style.color};
      }));
      eq(paints.length,words.length);eq(new Set(paints.map(paint=>paint.background)).size,words.length,'Distinct colors reach the actual highlight styles');
      for(const paint of paints){
        eq(paint.count,2,'All occurrences share their passage color');
        ok(['rgb(0, 0, 0)','rgb(255, 255, 255)'].includes(paint.foreground),'Black/white foreground');
        const channels=paint.background.match(/\d+/g).map(Number).map(n=>n/255).map(n=>n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4);
        const luminance=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
        const contrast=paint.foreground==='rgb(0, 0, 0)'?(luminance+0.05)/0.05:1.05/(luminance+0.05);
        ok(contrast>=4.5,'Actual highlight text meets 4.5:1 contrast');
      }
    },
    async feature_new_page_colors_preserve_custom_saved_and_duplicate_terms(b){
      const store={hl_page_annotations:{version:1,pages:{[url]:{terms:[{id:'saved',text:'Solarenergie',color:'#FFDF00',anchor:{exact:'Solarenergie'}}],options:{}}}}};
      const html='<p id="choose">Solarenergie</p><p id="next">Windkraft</p><p>Solarenergie Windkraft</p>';
      const p=await pageWith(b,{store,html});await mark(p);
      eq(await p.locator('.page-item').count(),1,'Selecting an existing passage does not duplicate it');
      eq(await p.locator('.page-item input[type=color]').inputValue(),'#ffdf00','Saved color survives repeated selection');
      await p.evaluate(()=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('next'));getSelection().removeAllRanges();getSelection().addRange(r);});await p.keyboard.press('Alt+Shift+H');
      const next=await p.locator('.page-item input[type=color]').nth(1).inputValue();ok(next!=='#ffdf00','New color avoids existing saved colors case-insensitively');
      await p.locator('.page-save').nth(1).click();
      const saved=await p.evaluate(()=>JSON.parse(JSON.stringify(window.__store)));
      const restored=await pageWith(b,{store:saved,html});eq(await restored.locator('.page-item input[type=color]').nth(1).inputValue(),next,'Automatically assigned color is retained on reload');
      await restored.locator('.page-item input[type=color]').nth(1).fill('#234567');
      await restored.click('#undo-page');eq(await restored.locator('.page-item input[type=color]').nth(1).inputValue(),next,'Undo restores the assigned color');
    },
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
      eq(await p.locator('#slim-hl-panel').isVisible(),false,'Copy success does not open the main panel');
      const feedback=p.locator('#slim-hl-feedback');await feedback.waitFor({state:'visible',timeout:3000});
      eq(await feedback.textContent(),'In die Zwischenablage kopiert.');eq(await feedback.getAttribute('role'),'status');
      eq(await p.evaluate(()=>window.__store.hl_panel_state.open),false,'Closed panel preference preserved');
      eq(await p.locator('#slim-selection-tools').isVisible(),false,'Actions dismissed after copying');
    },
    async feature_copy_preserves_page_focus_and_pending_selection(b){
      const p=await pageWith(b,{panelOpen:false,html:'<a id="source" href="#">Quelle</a><p id="choose">Solarenergie</p><p id="next">Windkraft</p>'});
      p.setDefaultTimeout(3000);
      await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(resolve=>window.__finishCopy=resolve)}}));
      await p.focus('#source');
      await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});
      await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();await p.locator('#selection-share > summary').click();await p.click('#selection-quote');
      eq(await p.evaluate(()=>document.activeElement.id),'source','Pointer copy keeps page focus');
      await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('next'));getSelection().removeAllRanges();getSelection().addRange(r);});
      await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();
      await p.evaluate(()=>window.__finishCopy());await p.locator('#slim-hl-feedback').waitFor({state:'visible'});
      eq(await p.locator('#selection-actions').isVisible(),true,'Late clipboard completion preserves new actions');
      await p.click('#selection-highlight');eq(await count(p),1);ok((await p.locator('.page-term').textContent()).includes('Windkraft'),'New selection remains actionable');
    },
    async feature_copy_failure_offers_manual_copy(b){
      const p=await pageWith(b,{panelOpen:false});await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}}));
      await tools(p);ok(await p.locator('#selection-share').count(),'Share disclosure');await p.locator('#selection-share > summary').click();await p.click('#selection-quote');
      await p.locator('#manual-copy').waitFor({state:'visible'});ok((await p.inputValue('#manual-copy')).includes('Solarenergie'));eq(await p.evaluate(()=>document.activeElement.id),'manual-copy');
    },
    async feature_copy_keyboard_returns_to_page_without_opening_panel(b){
      const p=await pageWith(b,{panelOpen:false,html:'<a id="source" href="#">Quelle</a><p id="choose">Solarenergie</p>'});
      await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));
      await p.focus('#source');await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});
      await p.locator('#selection-trigger').waitFor({state:'visible'});await p.focus('#selection-trigger');await p.keyboard.press('Enter');
      await p.focus('#selection-share > summary');await p.keyboard.press('Enter');await p.focus('#selection-quote');await p.keyboard.press('Enter');
      await p.locator('#slim-hl-feedback').waitFor({state:'visible'});eq(await p.evaluate(()=>document.activeElement.id),'source','Keyboard copy restores the page focus');
      eq(await p.locator('#slim-hl-panel').isVisible(),false);
    },
    async feature_copy_plain_link_notice_fits_narrow_and_follows_appearance(b){
      const p=await pageWith(b,{url:null,panelOpen:false,viewport:{width:320,height:500},store:{hl_lang:'en',hl_ui_theme:'light',hl_ui_transparency:35}});
      await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));
      await tools(p);await p.locator('#selection-share > summary').click();await p.click('#selection-link');
      const notice=p.locator('#slim-hl-feedback');await notice.waitFor({state:'visible'});
      ok((await notice.textContent()).includes('Page link copied;'),'Unsupported text link has an honest localized explanation');
      const box=await notice.boundingBox();ok(box.x>=8&&box.y>=8&&box.x+box.width<=313&&box.y+box.height<=493,'Long status stays visible');
      eq(await notice.evaluate(el=>getComputedStyle(el).opacity),'0.65');eq(await notice.getAttribute('data-theme'),'light');
      eq(await p.locator('#slim-hl-panel').isVisible(),false);await p.click('#slim-hl-toggle');await p.locator('#settings-section > summary').click();await p.selectOption('#ui-theme','dark');
      eq(await notice.getAttribute('data-theme'),'dark');await p.selectOption('#ui-lang','de');ok((await notice.textContent()).includes('Seitenlink kopiert;'),'Existing confirmation follows language changes');
      await notice.waitFor({state:'hidden',timeout:8000});
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
