const fs=require('fs');const path=require('path');const {chromium}=require('../../node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});
 const source=fs.readFileSync(path.resolve(__dirname,'../../userscript/slim-search-highlight.user.js'),'utf8');
 const output=[];
 for(const [name,width,height]of [['desktop',1280,900],['narrow',390,844]]){
  const page=await browser.newPage({viewport:{width,height},locale:'de-DE'});
  await page.goto('about:blank');await page.setContent(`<style>body{font:18px/1.8 system-ui;margin:0;background:#faf9f6;color:#24313a}main{max-width:680px;margin:50px auto;padding:24px}h1{font-size:32px;line-height:1.25}</style><main><h1>Die Energie von morgen</h1><p>Forschung macht neue Wege möglich. <b id="choose">Solarenergie</b> ist ein wichtiger Teil davon.</p><p>Auch in Städten kann <em>Solarenergie</em> einen Beitrag leisten. Gute Planung macht den Unterschied.</p><p>Lesen, auswählen und alle Vorkommen auf dieser Seite markieren.</p></main>`);
  await page.evaluate(()=>{const store={hl_keywords:[],hl_panel_state:{open:false,minimized:false},hl_auto_search:false};window.GM_getValue=(k,d)=>store[k]??d;window.GM_setValue=(k,v)=>store[k]=v;window.GM_addStyle=css=>{const s=document.createElement('style');s.textContent=css;document.head.append(s)};window.GM_registerMenuCommand=()=>{};});
  await page.addScriptTag({content:source});
  await page.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.getElementById('choose'));getSelection().removeAllRanges();getSelection().addRange(r)});
  await page.locator('#selection-trigger').waitFor({state:'visible'});await page.screenshot({path:path.join(__dirname,name+'-symbol.png')});
  await page.locator('#selection-trigger').hover();await page.getByRole('button',{name:'Alle Vorkommen markieren',exact:true}).waitFor({state:'visible'});await page.screenshot({path:path.join(__dirname,name+'-actions.png')});
  const t=await page.locator('#slim-selection-tools').boundingBox();if(t.x<0||t.y<0||t.x+t.width>width+1||t.y+t.height>height+1)throw Error('Toolbar outside viewport');
  await page.getByRole('button',{name:'Alle Vorkommen markieren',exact:true}).click();
  const count=await page.evaluate(()=>CSS.highlights.get('slim-page')?.size||0);if(count!==2)throw Error('Expected two CSS ranges');
  await page.screenshot({path:path.join(__dirname,name+'-page-highlights.png')});
  await page.locator('#settings-section > summary').click();await page.locator('#ui-lang').selectOption('en');
  await page.screenshot({path:path.join(__dirname,name+'-settings-en.png')});
  output.push({viewport:{width,height},rangeCount:count,toolbar:t,permanentCollapsed:!(await page.locator('#permanent-keywords').evaluate(e=>e.open))});
  await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'browser.json'),JSON.stringify(output,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
