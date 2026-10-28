const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const output=path.resolve(__dirname,'../artifacts/screenshots');
fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),results=[],errors=[];
const source=fs.readFileSync(path.resolve(__dirname,'../userscript/slim-search-highlight.user.js'),'utf8');
for(const theme of ['dark','light']) for(const [viewport,width,height] of [['desktop',1280,900],['narrow',390,844]]){
 const name=theme+'-'+viewport;
 const p=await browser.newPage({viewport:{width,height},locale:'de-DE'});
 p.on('pageerror',error=>errors.push(name+': '+error.message));
 const html='<style>body{margin:0;background:#faf9f6;color:#24313a;font:18px/1.8 system-ui}main{max-width:680px;margin:48px auto;padding:24px}h1{font-size:32px;line-height:1.3}</style><main><article><h1>Die Energie von morgen</h1><p>Neue Wege beginnen mit Forschung. <b id="choose">Solarenergie</b> ist ein wichtiger Teil davon.</p><p>Auch in Städten kann <em>Solarenergie</em> einen Beitrag leisten.</p><p>Auswählen, alle Vorkommen markieren und wichtige Passagen bei Bedarf für diese Seite merken.</p></article></main>';
 await p.route('**/*',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
 await p.goto('https://example.test/article');
 await p.evaluate(theme=>{const store={hl_keywords:[],hl_auto_search:false,hl_ui_theme:theme};window.GM_getValue=(k,d)=>structuredClone(store[k]??d);window.GM_setValue=(k,v)=>store[k]=structuredClone(v);window.GM_addStyle=css=>{let s=document.createElement('style');s.textContent=css;document.head.append(s)};window.GM_registerMenuCommand=()=>{};Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}});},theme);
 await p.addScriptTag({content:source});
 const select=()=>p.evaluate(()=>{document.activeElement?.blur();const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r)});
 await select();await p.locator('#selection-trigger').waitFor({state:'visible'});await p.screenshot({path:path.join(output,name+'-symbol.png')});
 await p.locator('#selection-trigger').hover();await p.locator('#selection-share > summary').click();await p.screenshot({path:path.join(output,name+'-actions.png')});
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
