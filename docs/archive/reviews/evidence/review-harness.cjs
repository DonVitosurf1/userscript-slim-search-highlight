const { chromium }=require('/workspace/userscript-slim-search-highlight/node_modules/playwright');
const fs=require('fs');
const src=fs.readFileSync('/workspace/userscript-slim-search-highlight/userscript/slim-search-highlight.user.js','utf8');
const out='/workspace/userscript-slim-search-highlight/.design/evidence/';
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
const measurements=async p=>p.evaluate(()=>{let q=s=>document.querySelector(s),box=e=>{let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};return {viewport:{w:innerWidth,h:innerHeight},panel:box(q('#slim-hl-panel')),body:box(q('.panel-body')),inputs:[...q('#slim-hl-panel').querySelectorAll('input,select')].map(e=>({id:e.id,type:e.type,labels:e.labels?.length,aria:e.getAttribute('aria-label'),placeholder:e.placeholder,box:box(e)})),match:{tag:q('.match-item')?.tagName,tabIndex:q('.match-item')?.tabIndex},counter:{text:q('#hl-counter').textContent,live:q('#hl-counter').getAttribute('aria-live')},errors:{live:q('#regex-error').getAttribute('aria-live'),role:q('#regex-error').getAttribute('role')}}});
let r={desktop:await measurements(p)};
r.desktop.aria=await p.locator('#slim-hl-panel').ariaSnapshot();
await p.fill('#new-kw','Forschung');await p.press('#new-kw','Enter');await p.waitForTimeout(300);r.enterAdded=await p.evaluate(()=>window.__store.hl_keywords.some(k=>k.text==='Forschung'));
await p.click('#add-kw-btn');await p.waitForTimeout(500);r.clickAdded=await p.evaluate(()=>window.__store.hl_keywords.some(k=>k.text==='Forschung'));
await p.fill('#new-kw','Entwurf behalten');await p.selectOption('#ui-lang','en');await p.waitForTimeout(300);r.draftAfterLocale=await p.inputValue('#new-kw');r.focusAfterLocale=await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName);
const empty=await open('empty',1280,900);r.empty=await measurements(empty);await empty.locator('#ui-lang').scrollIntoViewIfNeeded();await empty.screenshot({path:out+'settings.png'});
const mobile=await open('mobile-390',390,844,kw);r.mobile=await measurements(mobile);
const small=await open('mobile-320',320,568,kw);r.small=await measurements(small);
const hostile=await open('host-css',1280,900,kw,{},'button,input{font-family:serif;font-size:24px;padding:20px;box-sizing:border-box}');r.host=await measurements(hostile);
const drag=await open('saved-offscreen',390,844,kw,{hl_panel_pos:{x:900,y:650}});r.savedOffscreen=await measurements(drag);
console.log(JSON.stringify(r,null,2));fs.writeFileSync(out+'measurements.json',JSON.stringify(r,null,2));await b.close();
})();
