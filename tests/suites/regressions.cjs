'use strict';
module.exports=({open,eq,ok,selectionShortcutTime})=>{
  const pageWith=(b,o={})=>open(b,{keywords:[],panelOpen:true,permanentOpen:false,html:'<p id="choose">Solarenergie</p><p id="other">Solarenergie</p>',...o});
  const select=page=>page.evaluate(()=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});
  const mark=async page=>{await select(page);await page.keyboard.press('Alt+Shift+H');};
  const count=page=>page.evaluate(()=>CSS.highlights.get('slim-page')?.size||0);
  return {
    async correction_hidden_inline_keeps_original_match(b){const p=await pageWith(b,{html:'<p id="choose">hello<span hidden>invisible</span>world</p><p>helloworld</p>'});await mark(p);eq(await count(p),2);},
    async correction_inline_block_has_no_invented_space(b){const p=await pageWith(b,{html:'<p id="choose">hello<span style="display:inline-block">world</span></p><p>helloworld</p>'});await mark(p);eq(await count(p),2);},
    async correction_host_edit_inside_saved_mark_refreshes_ranges(b){
      const p=await pageWith(b,{keywords:[{text:'Solarenergie',color:'#ff0'}]});await p.waitForSelector('.slim-hl');await mark(p);eq(await count(p),2);
      await p.locator('#other .slim-hl').evaluate(e=>e.firstChild.data='Windkraft');
      await p.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===1,null,{timeout:3000});eq(await p.locator('#hl-counter').textContent(),'1 / 1');
    },
    async correction_focused_toolbar_dismisses_deleted_selection(b){
      const p=await pageWith(b);await select(p);await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').focus();await p.keyboard.press('Enter');
      await p.locator('#choose').evaluate(e=>e.remove());await p.waitForFunction(()=>document.getElementById('slim-selection-tools').hidden,null,{timeout:3000});
    },
    async correction_locale_translates_semantic_status(b){
      const p=await pageWith(b,{keywords:[{text:'Solarenergie',color:'#ff0'}],permanentOpen:true});await p.locator('.kw-item .delete-keyword').click();await p.click('#undo-delete');
      await p.locator('#settings-section > summary').click();await p.selectOption('#ui-lang','en');eq(await p.textContent('#panel-status'),'Keyword restored.');
    },
    async correction_narrow_toolbar_targets_are_44px(b){
      const p=await pageWith(b,{viewport:{width:320,height:568}});await select(p);await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();
      for(const id of ['selection-trigger','selection-web'])ok((await p.locator('#'+id).boundingBox()).height>=44,id+' target');
    },
    async correction_perf_long_text_endpoint_lookup_is_bounded(b){
      const p=await pageWith(b,{html:'<p id="choose">alpha</p><p>'+('alpha '.repeat(3000))+'</p>'});
      await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r);});const elapsed=await selectionShortcutTime(p);
      ok(elapsed<500,'Synchronous handler took '+elapsed+'ms');await p.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===3001,null,{timeout:5000});
      ok(await p.locator('#slim-pos-bar .mark').count()<=500,'Position ticks bounded without dropping results');
    }
  };
};
