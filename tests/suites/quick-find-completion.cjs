'use strict';
module.exports=({open,eq,ok})=>{
 const html='<h1>Agentic Engineering</h1><p>Engineering trifft Entscheidungen.</p><p>Engineers nutzen die Engine. Eine Engine hilft.</p>';
 const fixture=(browser,options={})=>open(browser,{url:'https://example.test/article',keywords:[],html,...options});
 const show=async p=>{await p.keyboard.press('Control+Shift+f');await p.locator('#find-query').waitFor();};
 const ready=async p=>p.waitForFunction(()=>document.getElementById('slim-find-bar')?.getAttribute('aria-busy')==='false',{},{timeout:5000});
 const type=async(p,query)=>{await p.locator('#find-query').fill(query);await ready(p);};
 const words=p=>p.locator('#find-completion-list [role=option] .completion-word').allTextContents();
 return {
  async quick_find_completion_single_and_multiple_suggestions(browser){
   const p=await fixture(browser);await show(p);await type(p,'entsch');
   eq(await p.locator('#find-ghost').isVisible(),true,'One candidate has an inline preview');
   eq(await p.locator('#find-ghost-suffix').textContent(),'eidungen');
   eq(await p.locator('#find-completion-popup').isVisible(),false,'One candidate has no popup');
   await type(p,'engin');eq(await p.locator('#find-completion-popup').isVisible(),true);
   eq(JSON.stringify(await words(p)),JSON.stringify(['Engineering','Engine','Engineers']));
   eq(await p.locator('#find-ghost-suffix').textContent(),'eering');
   eq((await p.locator('.completion-count').allTextContents()).join(','),'2 Treffer,5 Treffer,1 Treffer','Counts follow partial matching');
   eq(await p.locator('#find-query').inputValue(),'engin','Preview does not edit input');
  },
  async quick_find_completion_keyboard_preview_and_acceptance(browser){
   const p=await fixture(browser);await show(p);await type(p,'engin');const input=p.locator('#find-query');
   await input.press('ArrowDown');eq(await p.locator('#find-ghost-suffix').textContent(),'e','Selection previews Engine');
   ok((await p.locator('#find-completion-announcement').textContent()).includes('Engine'),'Preview word is available to screen readers');
   eq(await input.inputValue(),'engin');await input.press('ArrowRight');eq(await input.inputValue(),'Engine');await ready(p);
   eq(await p.locator('#find-completion-popup').isVisible(),false);eq(await p.locator('#find-counter').textContent(),'1 / 5');
   await type(p,'engin');await input.press('Enter');eq(await input.inputValue(),'Engineering');await ready(p);
   await input.press('Enter');eq(await p.locator('#find-counter').textContent(),'2 / 2','Enter resumes occurrence navigation');
   await type(p,'entsch');await input.press('ArrowRight');eq(await input.inputValue(),'Entscheidungen');
  },
  async quick_find_completion_pointer_and_no_persistence(browser){
   const p=await fixture(browser);await show(p);const writes=await p.evaluate(()=>window.__sets);
   await type(p,'engin');await p.locator('#find-completion-list [role=option]').last().click();
   eq(await p.locator('#find-query').inputValue(),'Engineers');await ready(p);
   eq(await p.locator('#find-counter').textContent(),'1 / 1');
   await type(p,'entsch');await p.locator('#find-accept').click();eq(await p.locator('#find-query').inputValue(),'Entscheidungen');
   eq(await p.evaluate(()=>window.__sets),writes,'Typing and accepting suggestions never write storage');
  },
  async quick_find_completion_escape_caret_and_empty_states(browser){
   const p=await fixture(browser);await show(p);await type(p,'engin');const input=p.locator('#find-query');
   await input.press('Home');await input.press('ArrowRight');eq(await input.inputValue(),'engin','Editing keeps caret semantics');
   eq(await p.locator('#find-ghost').isVisible(),false,'No misleading completion inside input');
   await input.press('End');await input.press('Escape');eq(await p.locator('#find-completion-popup').isVisible(),false);
   eq(await p.locator('#find-ghost').isVisible(),false);eq(await input.inputValue(),'engin');
   await input.press('Escape');eq(await p.locator('#slim-find-bar').isVisible(),false);
   await show(p);await type(p,'xy');eq(await p.locator('#find-ghost').isVisible(),false,'Three-character minimum');
   await type(p,'xyz');eq(await p.locator('#find-ghost').isVisible(),false);eq(await p.locator('#find-counter').textContent(),'0 / 0');
   await type(p,'engin');await p.locator('#find-clear').click();eq(await input.inputValue(),'');
   eq(await p.locator('#find-completion-popup').isVisible(),false);eq(await p.locator('#find-ghost').isVisible(),false);
  },
  async quick_find_completion_visible_unicode_words_and_options(browser){
   const p=await fixture(browser,{html:'<p>Entscheidungen <span>Engin</span><b>eering</b> Engineering engine ENGINE</p><p>Äpfel Äpfel Äpfelbaum</p><p hidden>Engineers</p><code>Enginery</code><input value="Engines"><div contenteditable>Engined</div>'});
   await show(p);await type(p,'engin');eq(JSON.stringify(await words(p)),JSON.stringify(['Engineering','engine']),'Inline text joins; excluded text never suggests');
   await p.locator('#find-whole').check();await ready(p);eq((await p.locator('.completion-count').allTextContents()).join(','),'2 Treffer,2 Treffer');
   await p.locator('#find-case').check();await ready(p);eq(await p.locator('#find-completion-popup').isVisible(),false,'Only lowercase engine remains');
   await p.locator('#find-accept').click();eq(await p.locator('#find-query').inputValue(),'engine');
   await p.locator('#find-case').uncheck();await type(p,'äpf');eq(JSON.stringify(await words(p)),JSON.stringify(['Äpfel','Äpfelbaum']));
  },
  async quick_find_completion_dynamic_content_and_position(browser){
   const p=await fixture(browser);await show(p);await type(p,'Engineering');const input=p.locator('#find-query');
   await input.press('Enter');eq(await p.locator('#find-counter').textContent(),'2 / 2');
   await p.evaluate(()=>{const n=document.createElement('p');n.textContent='Unrelated update';document.body.append(n);});
   await p.waitForTimeout(500);eq(await p.locator('#find-counter').textContent(),'2 / 2','Same-query refresh keeps current occurrence');
   await type(p,'entsch');eq(await p.locator('#find-completion-popup').isVisible(),false);
   await p.evaluate(()=>{const n=document.createElement('p');n.id='new-word';n.textContent='Entscheidungsbaum';document.body.append(n);});
   await p.waitForFunction(()=>document.getElementById('find-completion-popup')?.hidden===false);
   eq(JSON.stringify(await words(p)),JSON.stringify(['Entscheidungen','Entscheidungsbaum']));
   await p.locator('#new-word').evaluate(n=>n.remove());await p.waitForFunction(()=>document.getElementById('find-ghost-suffix')?.textContent==='eidungen'&&document.getElementById('slim-find-bar')?.getAttribute('aria-busy')==='false');
   eq(await p.locator('#find-completion-popup').isVisible(),false);
   eq(await p.locator('#find-ghost-suffix').textContent(),'eidungen');
  },
  async quick_find_completion_composition_and_stale_cancellation(browser){
   const p=await fixture(browser);await show(p);await type(p,'engin');const input=p.locator('#find-query');
   await input.dispatchEvent('compositionstart');eq(await p.locator('#find-ghost').isVisible(),false);
   await input.press('ArrowRight');eq(await input.inputValue(),'engin','Composition cannot accept a suggestion');
   await input.dispatchEvent('compositionend');await ready(p);eq(await p.locator('#find-ghost').isVisible(),true);
   await input.fill('engin');await input.fill('entsch');await ready(p);eq(await p.locator('#find-ghost-suffix').textContent(),'eidungen');
   await p.evaluate(()=>history.pushState({},'','/other'));await p.waitForFunction(()=>document.getElementById('slim-find-bar')?.hidden===true);
   eq(await p.locator('#find-completion-popup').isVisible(),false,'Navigation cancels completion');
   await show(p);eq(await input.inputValue(),'','New page has no prior query');
  },
  async quick_find_completion_locale_theme_and_narrow_geometry(browser){
   const p=await fixture(browser,{panelOpen:true,permanentOpen:false,viewport:{width:320,height:650},store:{hl_ui_theme:'light'}});
   await show(p);await type(p,'engin');await p.locator('#settings-section').evaluate(n=>n.open=true);
   await p.selectOption('#ui-lang','en');await ready(p);
   eq(await p.locator('#find-query').inputValue(),'engin');eq((await p.locator('.completion-count').allTextContents()).join(','),'2 matches,5 matches,1 match');
   await p.selectOption('#ui-theme','dark');
   eq(await p.locator('#find-completion-popup').evaluate(n=>getComputedStyle(n).colorScheme),'dark');
   const bar=await p.locator('#slim-find-bar').boundingBox(),popup=await p.locator('#find-completion-popup').boundingBox();
   ok(popup&&popup.x>=0&&popup.x+popup.width<=320,'Popup fits narrow viewport');
   ok(popup.y>=bar.y&&popup.y+popup.height<=650,'Popup fits vertical viewport');
   eq(await p.locator('#find-query').getAttribute('aria-autocomplete'),'both');
   const active=await p.locator('#find-query').getAttribute('aria-activedescendant');ok(active,'Active suggestion announced');
   eq(await p.locator('#'+active).getAttribute('aria-selected'),'true');
  },
  async quick_find_completion_reset_starts_a_fresh_search(browser){
   const p=await fixture(browser);await show(p);await type(p,'Engineering');const input=p.locator('#find-query');
   await input.press('Enter');eq(await p.locator('#find-counter').textContent(),'2 / 2');
   await p.locator('#find-clear').click();await type(p,'Engineering');
   eq(await p.locator('#find-counter').textContent(),'1 / 2','Clear starts a new search at its first occurrence');
   await input.press('Enter');await type(p,'xyz');await type(p,'Engineering');
   eq(await p.locator('#find-counter').textContent(),'1 / 2','Changing away and back is a new search');
   await input.press('Enter');await p.locator('#find-whole').check();await ready(p);
   eq(await p.locator('#find-counter').textContent(),'1 / 2','New options start at the first occurrence');
  },
  async quick_find_completion_reset_escape_with_hidden_preview(browser){
   const p=await fixture(browser);await show(p);await type(p,'engin');
   await p.locator('#find-query').press('Home');eq(await p.locator('#find-ghost').isVisible(),false);
   await p.locator('#find-query').press('Escape');eq(await p.locator('#slim-find-bar').isVisible(),false,'Invisible cached suggestions do not consume Escape');
  },
  async quick_find_completion_short_viewport_keeps_selected_option_visible(browser){
   const p=await fixture(browser,{viewport:{width:320,height:240}});await show(p);await type(p,'engin');
   const before=await p.evaluate(()=>scrollY);await p.locator('#find-query').press('ArrowDown');
   const active=await p.locator('#find-query').getAttribute('aria-activedescendant');
   const option=await p.locator('#'+active).boundingBox(),bar=await p.locator('#slim-find-bar').boundingBox();
   ok(option.y>=bar.y&&option.y+option.height<=bar.y+bar.height,'Selected suggestion is visible inside the short finder');
   eq(await p.evaluate(()=>scrollY),before,'Suggestion navigation does not scroll the reading page');
  },
  async quick_find_completion_short_viewport_with_open_panel(browser){
   const p=await fixture(browser,{panelOpen:true,permanentOpen:false,viewport:{width:320,height:240}});await show(p);await type(p,'engin');
   for(const selector of ['#slim-find-bar','#slim-hl-panel']) {
    const box=await p.locator(selector).boundingBox();ok(box.y>=0&&box.y+box.height<=240,selector+' stays inside short viewport');
   }
   await p.locator('#btn-close').click();
   eq(await p.evaluate(()=>document.activeElement.id),'slim-hl-toggle','Closing returns focus to the opener');
   await p.keyboard.press('Enter');
   const panel=await p.locator('#slim-hl-panel').boundingBox();ok(panel.y>=0&&panel.y+panel.height<=240,'Opening panel after finder also reserves room');
  },
  async quick_find_completion_large_page_and_literal_input(browser){
   const p=await fixture(browser,{html:'<p>Engineering Engineers Engine a+b a+b</p>'.repeat(1800)});
   await show(p);await type(p,'engin');eq((await words(p)).length,3,'Large dictionary remains bounded');
   await type(p,'a+b');eq(await p.locator('#find-counter').textContent(),'1 / 3600','Regex characters remain literal');
   eq(await p.locator('#find-completion-popup').isVisible(),false);
   await p.locator('#find-query').fill('engin');await p.locator('#find-clear').click();await p.waitForTimeout(250);
   eq(await p.locator('#find-ghost').isVisible(),false,'Old generation cannot repaint completion after clearing');
   eq(await p.evaluate(()=>CSS.highlights.get('slim-find')?.size||0),0);
  }
 };
};
