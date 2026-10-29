const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const output=path.resolve(__dirname,'../artifacts/screenshots');
fs.mkdirSync(output,{recursive:true});

// README captures use the shipped UI and native interactions on a local article.
// Only the webpage fixture is styled here; userscript styles remain untouched.
async function captureReadme(browser, source) {
 const html=fs.readFileSync(path.join(__dirname,'fixtures/readme.html'),'utf8');
 const viewport={width:1200,height:800};
 const results=[];
 for(const language of ['de','en']) for(const theme of ['light','dark']) {
  const name=`readme-${language}-${theme}`;
  const page=await browser.newPage({viewport,deviceScaleFactor:2,locale:language==='de'?'de-DE':'en-US'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
   await page.route('**/*',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:html}));
   await page.goto('https://example.test/reading/energy');
   await page.evaluate(({language,theme})=>{
    document.documentElement.lang=language;
    document.documentElement.dataset.theme=theme;
    document.querySelector(`article:not([lang="${language}"])`).remove();
    for(const node of document.querySelectorAll('[data-de]')) node.textContent=node.dataset[language];
    const store={hl_keywords:[],hl_auto_search:false,hl_ui_theme:theme,hl_lang:language};
    window.GM_getValue=(key,fallback)=>structuredClone(store[key]??fallback);
    window.GM_setValue=(key,value)=>{store[key]=structuredClone(value)};
    window.GM_addStyle=css=>{const style=document.createElement('style');style.textContent=css;document.head.append(style)};
    window.GM_registerMenuCommand=()=>{};
   },{language,theme});
   await page.evaluate(require('../tests/helpers/ui-driver.cjs'));
   await page.addScriptTag({content:source});
   const select=term=>page.locator(`[data-term="${term}"]`).evaluate(node=>{
    document.activeElement?.blur();
    const range=document.createRange();range.selectNodeContents(node);
    getSelection().removeAllRanges();getSelection().addRange(range);
   });
   for(const [term,expectedCount] of [['solar',3],['storage',5],['climate',7]]) {
    await select(term);
    await page.locator('#selection-trigger').waitFor({state:'visible'});
    await page.keyboard.press('Alt+Shift+H');
    await page.waitForFunction(expected=>CSS.highlights.get('slim-page')?.size===expected,expectedCount);
   }
   await page.locator('.page-save').first().click();
   // Exercise the occurrence navigator before opening another selection.
   await page.keyboard.press('Alt+ArrowRight');
   await page.keyboard.press('Alt+ArrowRight');
   await select('selection');
   await page.locator('#selection-trigger').waitFor({state:'visible'});
   // Navigation can leave an earlier trigger visible while selectionchange is
   // still debounced. Wait until the trigger belongs to the final selection.
   await page.waitForFunction(()=>{
    const selection=getSelection(),trigger=document.getElementById('selection-trigger');
    if(!selection?.rangeCount||!trigger||trigger.closest('#slim-selection-tools').hidden) return false;
    return Math.abs(trigger.getBoundingClientRect().top-selection.getRangeAt(0).getBoundingClientRect().bottom-8)<1;
   });
   await page.locator('#selection-trigger').hover();
   await page.getByRole('button',{name:language==='de'?'Im Web suchen':'Search the web',exact:true}).waitFor({state:'visible'});
   await page.mouse.move(800,740);
   await page.evaluate(()=>document.fonts.ready);
   const panel=await page.locator('#slim-hl-panel').boundingBox();
   const menu=await page.locator('#slim-selection-tools').boundingBox();
   const article=await page.locator('article').boundingBox();
   for(const box of [panel,menu]) if(!box||box.x<0||box.y<0||box.x+box.width>viewport.width||box.y+box.height>viewport.height) throw Error(`${name}: UI outside viewport`);
   if(article.x+article.width>panel.x) throw Error(`${name}: panel overlaps article`);
   if(menu.y<article.y+article.height) throw Error(`${name}: menu obscures article`);
   const counts=await page.locator('.page-item .kw-count').allTextContents();
   if(counts.join(',')!=='3,2,2') throw Error(`${name}: incorrect occurrence counts ${counts}`);
   if(errors.length) throw Error(`${name}: ${errors.join('; ')}`);
   if(!await page.locator('#selection-actions').isVisible()) throw Error(`${name}: selection menu collapsed before capture`);
   await page.screenshot({path:path.join(output,`${name}.png`)});
   results.push({name,language,theme,counts,panel,menu});
  } finally {await page.close()}
 }
 fs.writeFileSync(path.join(output,'readme.json'),JSON.stringify(results,null,2));
 console.log('Captured README examples in German/English and light/dark in artifacts/screenshots/');
}

(async()=>{
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'}),results=[],errors=[];
const source=fs.readFileSync(path.resolve(__dirname,'../userscript/slim-search-highlight.user.js'),'utf8');
if(process.argv.includes('--readme')) {try {await captureReadme(browser,source)} finally {await browser.close()} return}
for(const theme of ['dark','light']) for(const [viewport,width,height] of [['desktop',1280,900],['narrow',390,844]]){
 const name=theme+'-'+viewport;
 const p=await browser.newPage({viewport:{width,height},locale:'de-DE'});
 p.on('pageerror',error=>errors.push(name+': '+error.message));
 const html='<style>body{margin:0;background:#faf9f6;color:#24313a;font:18px/1.8 system-ui}main{max-width:680px;margin:48px auto;padding:24px}h1{font-size:32px;line-height:1.3}</style><main><article><h1>Die Energie von morgen</h1><p>Neue Wege beginnen mit Forschung. <b id="choose">Solarenergie</b> ist ein wichtiger Teil davon.</p><p>Auch in Städten kann <em>Solarenergie</em> einen Beitrag leisten.</p><p>Auswählen, alle Vorkommen markieren und wichtige Passagen bei Bedarf für diese Seite merken.</p></article></main>';
 await p.route('**/*',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 await p.goto('https://example.test/article');
 await p.evaluate(theme=>{const store={hl_keywords:[],hl_auto_search:false,hl_ui_theme:theme};window.GM_getValue=(k,d)=>structuredClone(store[k]??d);window.GM_setValue=(k,v)=>store[k]=structuredClone(v);window.GM_addStyle=css=>{let s=document.createElement('style');s.textContent=css;document.head.append(s)};window.GM_registerMenuCommand=()=>{};Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}});},theme);
 await p.evaluate(require('../tests/helpers/ui-driver.cjs'));
 await p.addScriptTag({content:source});
 const select=()=>p.evaluate(()=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r)});
 await select();await p.locator('#selection-trigger').waitFor({state:'visible'});await p.screenshot({path:path.join(output,name+'-symbol.png')});
 await p.locator('#selection-trigger').hover();await p.locator('#slim-selection-tools').screenshot({path:path.join(output,name+'-toolbar.png')});await p.locator('#selection-share > summary').click();await p.screenshot({path:path.join(output,name+'-actions.png')});
 await p.getByRole('button',{name:'Alle Vorkommen markieren',exact:true}).click();
 await p.locator('.page-item input[type=color]').fill('#90caf9');await p.locator('.page-item input[type=color]').dispatchEvent('change');await p.locator('.page-save').click();
 await p.screenshot({path:path.join(output,name+'-panel.png')});
 const panel=await p.locator('#slim-hl-panel').boundingBox();if(panel.x<0||panel.y<0||panel.x+panel.width>width+1||panel.y+panel.height>height+1)throw Error('Panel out of viewport');
 await p.locator('#page-options > summary').click();await p.check('#page-whole');await p.selectOption('#page-scope','article');await p.screenshot({path:path.join(output,name+'-options.png')});
 await select();await p.locator('#selection-trigger').waitFor({state:'visible'});await p.locator('#selection-trigger').hover();await p.locator('#selection-share > summary').click();await p.click('#selection-quote');await p.locator('#manual-copy').waitFor({state:'visible'});await p.screenshot({path:path.join(output,name+'-manual-copy.png')});
 await p.click('#close-manual-copy');await p.locator('#settings-section > summary').click();await p.locator('#ui-theme').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(output,name+'-appearance.png')});await p.selectOption('#ui-lang','en');await p.screenshot({path:path.join(output,name+'-settings-en.png')});
 const count=await p.evaluate(()=>CSS.highlights.get('slim-page')?.size||0);if(count!==2)throw Error('Expected two ranges');
 results.push({name,theme,width,height,matches:count,panel});await p.close();
}
await browser.close();if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(results,null,2));
console.log('Captured light/dark desktop and narrow views in artifacts/screenshots/');
})().catch(e=>{console.error(e);process.exit(1)});
