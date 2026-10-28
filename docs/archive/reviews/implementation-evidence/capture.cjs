const { chromium }=require('/workspace/userscript-slim-search-highlight/node_modules/playwright');
const fs=require('fs');
const src=fs.readFileSync('/workspace/userscript-slim-search-highlight/userscript/slim-search-highlight.user.js','utf8');
const out='/workspace/userscript-slim-search-highlight/.design/implementation-evidence/';
(async()=>{
const b=await chromium.launch({executablePath:'/usr/bin/chromium'});
async function open(name,w,h,kw=[],extra={},css=''){
const p=await b.newPage({viewport:{width:w,height:h},locale:'de-DE'});
await p.goto('about:blank');
await p.setContent(`<style>body{margin:0;font:18px/1.7 system-ui;background:#faf9f6;color:#24313a}main{max-width:700px;margin:50px auto;padding:24px} ${css}</style><main><h1>Lesen und recherchieren</h1>${Array.from({length:25},(_,i)=>'<p>Die Energiewende braucht Forschung und neue Ideen. Solarenergie und Windkraft helfen bei der Umsetzung.</p>').join('')}</main>`);
await p.evaluate(({kw,extra})=>{const s={hl_keywords:kw,hl_panel_state:{open:true,minimized:false},...extra};window.__store=s;window.GM_getValue=(k,d)=>s[k]??d;window.GM_setValue=(k,v)=>s[k]=v;window.GM_addStyle=css=>{let x=document.createElement('style');x.textContent=css;document.head.append(x)};window.GM_registerMenuCommand=()=>{};},{kw,extra});
await p.addScriptTag({content:src});await p.waitForTimeout(800);
await p.screenshot({path:out+name+'.png'});
return p;
}
const kw=[{text:'Energiewende',color:'#ffe082'},{text:'Solarenergie',color:'#90caf9'},{text:'Windkraft',color:'#a5d6a7'}];
const p=await open('desktop',1280,900,kw);
await p.locator('#match-details > summary').click();await p.locator('#match-list button').first().focus();await p.screenshot({path:out+'match-keyboard.png'});
await p.locator('#settings-section > summary').click();await p.locator('#ui-lang').selectOption('en');await p.screenshot({path:out+'settings-en.png'});
await p.locator('#search-engine').selectOption('ddg');if(await p.locator('#search-engine').inputValue()!=='ddg')throw Error('Native select failed');
await p.locator('#search-engine').focus();await p.keyboard.press('Space');await p.keyboard.press('Escape');
await open('mobile-390',390,844,kw);await open('mobile-320',320,568,kw);await open('empty',1280,900);
await open('host-css',1280,900,kw,{},'button,input{font-family:serif;font-size:24px;padding:20px;box-sizing:border-box}');
const error=await open('error-initial',390,844,[]);await error.fill('#new-kw','/[invalid/');await error.click('#add-kw-btn');await error.screenshot({path:out+'inline-error.png'});
const d=await open('offscreen-recovered',390,844,kw,{hl_panel_pos:{x:900,y:650}});
await d.locator('#settings-section > summary').click();await d.locator('#advanced-section > summary').click();await d.waitForTimeout(100);await d.screenshot({path:out+'expanded-narrow.png'});
for(const page of [p,d,error]){const r=await page.locator('#slim-hl-panel').boundingBox(),v=page.viewportSize();if(r.x<0||r.y<0||r.x+r.width>v.width+1||r.y+r.height>v.height+1)throw Error('Panel outside viewport');}
console.log('Desktop, narrow, empty, inline error, keyboard match list, English/native select, host CSS and expanded/offscreen geometry checked.');
await b.close();})();
