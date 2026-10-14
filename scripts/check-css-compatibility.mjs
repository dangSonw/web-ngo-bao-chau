// Dev server running. Arguments: Playwright module URL, engine (chromium/webkit).
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const pw=await import(process.argv[2] || 'playwright'),engine=process.argv[3] || 'chromium';
const out=new URL('../design/css-compatibility-qa/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await pw[engine].launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
const screens=[{route:'/',key:'home'}];
for(const group of ['about','inquiry','community','spirituality']){
 const data=JSON.parse(await readFile(new URL(`../src/data/${group}Pages.json`,import.meta.url),'utf8'));
 screens.push(...data.pages.map(p=>({...p,group})));
}
const sizes=[[375,812],[420,896],[600,800],[601,800],[768,1024],[880,900],[1200,900],[1201,900],
 [1280,800],[1440,744],[1440,900],[1512,982],[1728,1117],[1920,1080],[1920,1200],[2560,1440],
 [3840,2160],[1440,600],[1440,660],[1440,661],[1080,1920],[3440,1440]];
const results=[],errors=[];
try{
 const page=await browser.newPage({deviceScaleFactor:2,reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warning','error'].includes(m.type()))errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('http://localhost:5177/');
 const capabilities=await page.evaluate(()=>({ua:navigator.userAgent,cqw:CSS.supports('width','1cqw'),propertyApi:'registerProperty' in CSS,typedDivision:CSS.supports('transform','scale(calc(100cqw / 1440px))')}));
 for(const screen of screens){
  await page.evaluate(route=>{history.pushState(null,'',route);dispatchEvent(new PopStateEvent('popstate'));},screen.route);
  const selector=screen.key==='home'?'.home':screen.group==='spirituality'?'.spirit__frame--'+screen.key:'.'+screen.group+'__frame--'+screen.key;
  await page.waitForSelector(selector);
  for(const [width,height]of sizes){
   await page.setViewportSize({width,height});await page.waitForTimeout(40);
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
   const layout=await page.evaluate(()=>{
    const d=document.documentElement,r=n=>{const a=n.getBoundingClientRect();return {x:a.x,y:a.y,right:a.right,bottom:a.bottom,width:a.width,height:a.height};};
    const visible=n=>n.getClientRects().length&&n.getBoundingClientRect().width>1;
    const labels=[...document.querySelectorAll('.figma-label')].filter(visible).map(n=>{const i=n.querySelector('img');return {box:r(n),art:r(i),ratio:Number(i.getAttribute('width'))/Number(i.getAttribute('height')),sourceWidth:Number(n.style.getPropertyValue('--label-width'))};});
    const gaps=[...document.querySelectorAll('.about__choice')].map(n=>r(n.querySelector('.about__choice-caption')).y-r(n.querySelector('.figma-label')).bottom);
    const media=[...document.querySelectorAll('main img,.site-navigation img')].filter(visible).map(i=>({...r(i),decoded:i.complete&&i.naturalWidth>0}));
    return {client:d.clientWidth,scroll:d.scrollWidth,documentHeight:d.scrollHeight,labels,gaps,media};
   });
   const tag=`${engine} ${screen.route} ${width}x${height}`;
   assert(layout.scroll<=layout.client,'Overflow '+tag);
   assert(layout.labels.every(l=>l.box.width>0&&l.box.height>0&&l.art.x>=-1&&l.art.right<=layout.client+1),'SVG clipping '+tag);
   assert(layout.labels.every(l=>Math.abs(l.art.width/l.art.height-l.ratio)<.07),'SVG distortion '+tag);
   assert(layout.gaps.every(g=>g>=5),'Caption overlap '+tag);
   assert(layout.media.every(i=>i.decoded&&i.x>=-1&&i.right<=layout.client+1&&i.bottom<=layout.documentHeight+1),'Media bounds '+tag);
   const desktop=screen.route==='/about-me'&&await page.evaluate(()=>getComputedStyle(document.querySelector('.about__choices')).position==='absolute');
   if(screen.route==='/about-me'&&desktop){
    const canvas=await page.locator('.subpage-layout__canvas').evaluate(n=>n.getBoundingClientRect().width);
    assert(layout.labels.slice(-3).every(l=>Math.abs(l.box.width-(canvas/1440+2/24)*l.sourceWidth)<1),'Inherited unit changed '+tag+' '+JSON.stringify({canvas,labels:layout.labels.slice(-3)}));
   }
   results.push({route:screen.route,width,height,dpr:2,captionGaps:layout.gaps,labels:layout.labels.length,overflow:false,sourceRatios:true});
  }
 }
 assert.deepEqual(errors,[]);
 const css=await readFile(new URL('../src/index.css',import.meta.url),'utf8');assert(!css.includes('@property --u'));
 await writeFile(new URL(engine+'-results.json',out),JSON.stringify({capabilities,cases:results.length,noPropertyDependency:true,results,errors},null,2));
 console.log(`${engine}: ${results.length} Retina viewport cases passed without @property`);
}finally{await browser.close();}
