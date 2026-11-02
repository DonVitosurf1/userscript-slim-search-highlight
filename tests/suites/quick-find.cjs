'use strict';
module.exports=({open,eq,ok})=>{
 const fixture=(browser,options={})=>open(browser,{url:'https://example.test/article',keywords:[],html:'<input id="host-input" value="Entwurf"><p>Solarenergie solar Solaris</p><p>Windkraft Windkraft</p><button id="return-focus">Weiter</button>',...options});
 const show=async page=>{await page.keyboard.press('Control+Shift+f');eq(await page.locator('#slim-find-bar').count(),1,'Shortcut opens the private finder');};
 const count=(page,n)=>page.waitForFunction(n=>(CSS.highlights.get('slim-find')?.size||0)===n,n,{timeout:4000});
 return {
  async quick_find_live_preview_clear_escape_and_focus(browser){
   const p=await fixture(browser);await p.locator('#host-input').focus();const writes=await p.evaluate(()=>window.__sets);
   await show(p);eq(await p.evaluate(()=>document.activeElement.id),'find-query');await p.locator('#find-query').fill('Solar');await count(p,3);
   eq(await p.locator('#host-input').inputValue(),'Entwurf','Opening from an input preserves host data');
   eq(await p.evaluate(()=>window.__sets),writes,'Preview never persists query text');
   await p.locator('#find-clear').click();await count(p,0);eq(await p.locator('#find-query').inputValue(),'');
   await p.locator('#find-query').fill('Windkraft');await count(p,2);await p.keyboard.press('Escape');
   eq(await p.locator('#slim-find-bar').isVisible(),false);await count(p,0);eq(await p.evaluate(()=>document.activeElement.id),'host-input','Focus returns to original input');
  },
  async quick_find_literal_options_and_keyboard_navigation(browser){
   const p=await fixture(browser,{html:'<p>art start Art ART a+b a+b</p>'});await show(p);
   await p.locator('#find-query').fill('art');await count(p,4);await p.keyboard.press('Enter');eq(await p.locator('#find-counter').textContent(),'2 / 4');await p.keyboard.press('Shift+Enter');eq(await p.locator('#find-counter').textContent(),'1 / 4');
   await p.locator('#find-whole').check();await count(p,3);await p.locator('#find-case').check();await count(p,1);
   await p.locator('#find-query').fill('a+b');await count(p,2);eq((await p.__errors||[]).length,0);
  },
  async quick_find_adoption_preserves_existing_keywords(browser){
   const keywords=[{text:'Permanent',color:'#123456'}];const p=await fixture(browser,{keywords,html:'<p>Permanent</p><p>Solarenergie Solarenergie</p>'});await p.waitForSelector('.slim-hl');
   await show(p);await p.locator('#find-query').fill('Solarenergie');await count(p,2);eq(await p.locator('.slim-hl').count(),1);
   await p.locator('#find-add').click();await p.waitForFunction(()=>CSS.highlights.get('slim-page')?.size===2);
   await p.locator('#find-close').click();await count(p,0);eq(await p.locator('.page-item input[type=color]').count(),1,'Adopted search remains an own page selection');
   eq(JSON.stringify(await p.evaluate(()=>window.__store.hl_keywords)),JSON.stringify(keywords));eq(await p.evaluate(()=>window.__store.hl_page_annotations??null),null,'Adoption does not save a page record');
  },
  async quick_find_dynamic_content_and_url_cancel(browser){
   const p=await fixture(browser);await show(p);await p.locator('#find-query').fill('Solar');await count(p,3);
   await p.evaluate(()=>{const node=document.createElement('p');node.textContent='Solar';document.body.append(node);});await count(p,4);
   await p.evaluate(()=>history.pushState({},'','/other'));await p.waitForFunction(()=>document.getElementById('slim-find-bar')?.hidden===true);await count(p,0);
  },
  async quick_find_shortcut_recording_and_storage_rollback(browser){
   const p=await fixture(browser,{panelOpen:true});await p.locator('#settings-section').evaluate(el=>{el.open=true;});
   await p.locator('#record-find-shortcut').click();await p.keyboard.press('Alt+Shift+j');eq(await p.evaluate(()=>window.__store.hl_find_shortcut.key),'j');
   await p.keyboard.press('Alt+Shift+j');eq(await p.locator('#slim-find-bar').isVisible(),true);await p.locator('#find-close').click();
   await p.evaluate(()=>{window.__save=GM_setValue;window.GM_setValue=(key,value)=>{if(key==='hl_find_shortcut')throw Error('quota');window.__save(key,value);};});
   await p.locator('#reset-find-shortcut').click();ok((await p.locator('#find-shortcut-error').textContent()).includes('nicht gespeichert'));
   await p.keyboard.press('Alt+Shift+j');eq(await p.locator('#slim-find-bar').isVisible(),true,'Old shortcut survives failed write');
  },
  async quick_find_theme_locale_and_private_input_shortcut(browser){
   const p=await fixture(browser,{panelOpen:true});await p.locator('#new-kw').fill('Unfertig');await p.locator('#new-kw').focus();await show(p);
   await p.locator('#find-query').fill('Solar');await count(p,3);await p.locator('#settings-section').evaluate(el=>{el.open=true;});
   await p.selectOption('#ui-theme','light');eq(await p.locator('#slim-find-bar').evaluate(el=>getComputedStyle(el).colorScheme),'light');
   await p.selectOption('#ui-lang','en');eq(await p.locator('#find-query').inputValue(),'Solar');eq(await p.locator('#slim-find-bar').getAttribute('aria-label'),'Find on page');await count(p,3);
   eq(await p.locator('#new-kw').inputValue(),'Unfertig');await p.locator('#find-close').click();eq(await p.evaluate(()=>document.activeElement.id),'new-kw','Locale rebuild preserves the finder return target');
  },
  async quick_find_unsupported_browser_has_localized_reason(browser){
   const p=await fixture(browser,{html:'<script>globalThis.Highlight=undefined</script><p>Solar</p>'});await show(p);
   ok((await p.locator('#find-status').textContent()).includes('Unterstützung'),'Unsupported highlighting is explained');eq(await p.locator('#find-query').isDisabled(),true);
  },
  async quick_find_scrolls_first_match_into_view(browser){
   const p=await fixture(browser,{html:'<div style="height:2200px"></div><p>Fernsicht</p>'});await show(p);await p.locator('#find-query').fill('Fernsicht');await count(p,1);
   await p.waitForFunction(()=>scrollY>1000,null,{timeout:1500});
  },
  async quick_find_custom_panel_position_reserves_bar_after_resize(browser){
   const p=await fixture(browser,{panelOpen:true,store:{hl_panel_pos:{x:850,y:16}},html:'<script>window.ResizeObserver=undefined;Object.defineProperty(window,"visualViewport",{value:null})</script><p>Solar</p>'});await show(p);await p.setViewportSize({width:390,height:650});
   await p.waitForTimeout(100);const panel=await p.locator('#slim-hl-panel').boundingBox(),bar=await p.locator('#slim-find-bar').boundingBox();
   ok(panel.y>=bar.y+bar.height+7,'Clamped custom panel stays below finder after resizing');
  },
  async quick_find_rapid_input_close_does_not_repaint(browser){
   const p=await fixture(browser,{html:'<p>alpha</p>'.repeat(3000)});await show(p);await p.locator('#find-query').fill('alpha');
   await p.locator('#find-query').fill('zzzz');await p.keyboard.press('Escape');await p.waitForTimeout(300);await count(p,0);
   eq(await p.evaluate(()=>CSS.highlights.has('slim-find-current')),false,'Cancelled work cannot restore the active mark');
  },
  async quick_find_narrow_theme_and_shortcut_settings(browser){
   const p=await fixture(browser,{panelOpen:true,viewport:{width:320,height:650},store:{hl_ui_theme:'light'}});await show(p);
   const box=await p.locator('#slim-find-bar').boundingBox();ok(box.x>=8&&box.x+box.width<=312,'Finder fits narrow viewport');
   eq(await p.locator('#slim-find-bar').evaluate(el=>getComputedStyle(el).colorScheme),'light');
   await p.locator('#find-close').click();await p.locator('#settings-section').evaluate(el=>{el.open=true;});
   await p.locator('#disable-find-shortcut').click();await p.keyboard.press('Control+Shift+f');eq(await p.locator('#slim-find-bar').isVisible(),false);
   await p.locator('#open-find').click();eq(await p.locator('#slim-find-bar').isVisible(),true,'Visible button works when shortcut is disabled');
  }
 };
};
