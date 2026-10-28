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
const p=await open('dark-highlight',1280,900,[{text:'Energiewende',color:'#000000'}]);
const r={};r.highlight=await p.locator('.slim-hl').first().evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}));
await p.fill('#new-kw','Energiewende');p.once('dialog',async d=>{r.duplicateDialog={type:d.type(),message:d.message()};await d.accept()});await p.click('#add-kw-btn');
await p.fill('#new-kw','/[invalid/');await p.click('#add-kw-btn');await p.waitForTimeout(400);r.regex={message:await p.locator('#regex-error').textContent(),saved:await p.evaluate(()=>window.__store.hl_keywords.some(k=>k.text==='/[invalid/')),input:await p.inputValue('#new-kw')};
await p.fill('#kw-search','keinKeyword');r.noResults=await p.locator('#kw-list').textContent();r.clearButtons=await p.locator('#slim-hl-panel button').allTextContents();
await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{const orig=Element.prototype.scrollIntoView;window.__scroll=[];Element.prototype.scrollIntoView=function(opts){window.__scroll.push(opts);return orig.call(this,opts)}});await p.click('#btn-next');r.reducedMotionScroll=await p.evaluate(()=>window.__scroll);
const q=await open('keyboard-focus',1280,900,[{text:'Energiewende',color:'#ffe082'}]);await q.locator('#btn-close').focus();await q.keyboard.press('Enter');r.closeFocus=await q.evaluate(()=>({active:document.activeElement.id||document.activeElement.tagName,panel:getComputedStyle(document.getElementById('slim-hl-panel')).display}));
await q.locator('#slim-hl-toggle').focus();await q.keyboard.press('Enter');r.openFocus=await q.evaluate(()=>document.activeElement.id||document.activeElement.tagName);
fs.writeFileSync(out+'confirmations.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r,null,2));await b.close();})();
