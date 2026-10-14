// Dev server must be running. Optional first argument: Playwright module URL.
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.argv[2] || 'playwright');
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../', import.meta.url)).replaceAll('\\','/').replace(/\/$/,''),out=root+'/design/site-refresh-qa';
await mkdir(out,{recursive:true});
const groups={};
for(const key of ['about','inquiry','community','spirituality'])groups[key]=JSON.parse(await readFile(root+'/src/data/'+key+'Pages.json','utf8')).pages;
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],results=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:744}});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://localhost:5177/');await page.emulateMedia({reducedMotion:'reduce'});
 const routes=[{route:'/',key:'home'},...groups.about.map(p=>({...p,section:'about'})),...groups.inquiry.map(p=>({...p,section:'inquiry'})),...groups.community.map(p=>({...p,section:'community'})),...groups.spirituality.map(p=>({...p,section:'spirituality'}))];
 for(const screen of routes){
   if(screen.route==='/'){await page.goto('http://localhost:5177/');}
   else {
     await page.evaluate(route=>{history.pushState(null,'',route);dispatchEvent(new PopStateEvent('popstate'));},screen.route);
     await page.waitForSelector(screen.section==='spirituality'?'.spirit__frame--'+screen.key:'.'+screen.section+'__frame--'+screen.key);
     assert(await page.evaluate(() => {
       const menu = document.querySelector('.subpage-layout__navigation');
       if (!window.__sharedMenu) window.__sharedMenu = menu;
       return menu === window.__sharedMenu;
     }), 'Shared menu remounted at ' + screen.route);
   }
   for(const [width,height]of [[375,812],[420,896],[560,800],[561,800],[600,800],[601,800],[768,1024],[880,900],[1100,900],[1101,900],[1200,900],[1201,900],[1440,744],[1920,1080],[2560,1440],[3840,2160],[1440,600],[1440,660],[1440,661]]){
     await page.setViewportSize({width,height});await page.waitForTimeout(45);
     await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
     const layout=await page.evaluate(()=>{
       const d=document.documentElement;
       const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
       const visible=n=>n.getClientRects().length>0&&getComputedStyle(n).visibility!=='hidden';
       const media=[...document.querySelectorAll('main img,.subpage-layout__navigation img')].filter(visible).map(i=>({src:i.getAttribute('src'),...rect(i),decoded:i.complete&&i.naturalWidth>0}));
       const texts=[...document.querySelectorAll('.home__description,.about__body,.about__subtitle,.about__choice-caption,.inquiry__body,.inquiry__planet-caption,.inquiry__research-link,.community__copy,.community__chapter-text,.spirit__body,.spirit__subtitle,.spirit__tag')].filter(visible).map(n=>({class:n.className,...rect(n),font:parseFloat(getComputedStyle(n).fontSize)}));
       const choices=[...document.querySelectorAll('.about__choice')].map(n=>({title:rect(n.querySelector('.figma-label img')),caption:rect(n.querySelector('.about__choice-caption')),line:rect(n.querySelector('.about__choice-line'))}));
       return {width:innerWidth,client:d.clientWidth,scroll:d.scrollWidth,height:d.scrollHeight,media,texts,choices,bodyColor:getComputedStyle(document.body).backgroundColor};
     });
     assert(layout.scroll<=layout.client,'Overflow '+screen.route+' '+width);
     assert(layout.media.every(i=>i.decoded&&i.x>=-1&&i.right<=layout.client+1&&i.bottom<=layout.height+1),'Media clipping '+screen.route+' '+width+' '+JSON.stringify(layout.media.filter(i=>i.x< -1||i.right>layout.client+1||i.bottom>layout.height+1)));
     assert(layout.texts.every(t=>t.x>=-1&&t.right<=layout.client+1&&t.bottom<=layout.height+1),'Text clipping '+screen.route+' '+width+' '+JSON.stringify(layout.texts));
     assert(layout.choices.every(c=>c.caption.y-c.title.bottom>=5&&c.line.y-c.caption.bottom>=5),'About captions overlap '+width+' '+JSON.stringify(layout.choices));
     assert(layout.texts.every(t=>t.font>=15),'Unexpected small native text '+screen.route+' '+width);
     assert.equal(layout.bodyColor,'rgb(0, 0, 0)');
     results.push({route:screen.route,...layout});
     if([375,1440,3840].includes(width)&&[812,744,2160].includes(height))await page.screenshot({path:out+'/'+screen.route.replaceAll('/','_')+'-'+width+'.png',fullPage:true});
   }
 }
 const spiritual=groups.spirituality.filter(p=>p.group);
 await page.evaluate(()=>{history.pushState(null,'','/spirituality/wuxing');dispatchEvent(new PopStateEvent('popstate'));});
 await page.waitForSelector('.spirit__frame--wuxing-intro');
 for(let i=0;i<spiritual.length*2;i++){
   assert.equal(new URL(page.url()).pathname,spiritual[i%spiritual.length].route);
   await page.keyboard.press('Space');await page.waitForURL('**'+spiritual[(i+1)%spiritual.length].route);
 }
 await page.waitForSelector('.spirit__frame--wuxing-intro');
 await page.locator('.spirit__arrow--previous').click();await page.waitForURL('**/spirituality/wuxing/conclusion');
 await page.waitForSelector('.spirit__frame--wuxing-conclusion');
 await page.keyboard.press('Space');await page.waitForURL('**/spirituality/planets');
 await page.waitForSelector('.spirit__frame--planets-intro');
 assert.equal(await page.locator('.subpage-layout__pagination a').count(),5);
 assert(await page.locator('.subpage-layout__pagination a').evaluateAll(as=>as.every(a=>a.href.includes('/spirituality/planets'))));
 await page.locator('.subpage-layout__pagination a').last().click();await page.waitForSelector('.spirit__frame--planets-moon');
 await page.keyboard.press('Space');await page.waitForURL('**/spirituality/wuxing');
 await page.waitForSelector('.spirit__frame--wuxing-intro');
 assert.equal(await page.locator('.subpage-layout__pagination a').count(),7);
 await page.setViewportSize({width:1440,height:744});
 await page.emulateMedia({reducedMotion:'no-preference'});
 const samples=await page.evaluate(()=>new Promise(resolve=>{
   const samples=[],start=performance.now();
   const menu = document.querySelector('.subpage-layout__navigation');
   document.querySelector('.subpage-layout__navigation a[href="/about-me"]').click();
   function tick(now){
     const cover=document.querySelector('.page-shade');
     samples.push({t:now-start,opacity:Number(getComputedStyle(cover).opacity),color:getComputedStyle(cover).backgroundColor,route:document.querySelector('main').className,
       menuPreserved:menu===document.querySelector('.subpage-layout__navigation'), menuOpacity:Number(getComputedStyle(menu).opacity),
       coverTop:cover.getBoundingClientRect().top, menuBottom:menu.getBoundingClientRect().bottom});
     if(now-start<1100)requestAnimationFrame(tick);else resolve(samples);
   }requestAnimationFrame(tick);
 }));
 assert(samples.some(s=>s.opacity>=.995),'Transition never reaches black');
 assert(samples.every(s=>s.color==='rgb(0, 0, 0)'));
 assert(samples.every(s=>s.menuPreserved && s.menuOpacity===1 && s.coverTop>=s.menuBottom-.5), 'Black cover touched the shared menu');
 const changed=samples.findIndex((s,i)=>i>0&&s.route!==samples[0].route);
 assert(changed>0&&samples[changed].opacity>=.995,'Page swapped before fully black');
 assert(samples.at(-1).opacity<.01,'Transition did not reveal page');
 await page.waitForSelector('.about__frame--overview');
 // Reduced motion toggling during the blackout must reveal the destination.
 await page.locator('.subpage-layout__navigation a[href="/inquiry"]').click();
 await page.waitForTimeout(230);await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForSelector('.inquiry__frame--overview');await page.waitForTimeout(100);
 assert.equal(await page.locator('.page-shade').evaluate(n=>Number(getComputedStyle(n).opacity)),0);
 assert.deepEqual(errors,[]);
 await writeFile(out+'/results.json',JSON.stringify({checks:{allTypeLarger:true,aboutCaptionGaps:true,blackTransition:true,swapCovered:true,sharedMenuPreserved:true,menuOutsideBlackout:true,reducedMotion:true,spiritualCombinedCycle:true,arrowsRemainLocal:true},transition:samples,viewports:results,errors},null,2));
 console.log('Site refresh '+results.length+' viewport cases, type spacing, black fade and combined spiritual Space passed');
}finally{await browser.close();}
