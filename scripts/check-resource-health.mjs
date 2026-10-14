// Production smoke/soak on a local preview; this is not a remote hosting load test.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const pw = await import(process.argv[2] || 'playwright');
const site = process.argv[3] || 'ngo', url = process.argv[4] || 'http://127.0.0.1:5180/';
const routes = site === 'linh' ? ['/about-me','/scouting','/impact-leadership','/inside-the-cells','/world','/']
  : ['/about-me/logician','/about-me/seeker','/inquiry','/community','/spirituality/wuxing','/spirituality/planets','/'];
const browser = await pw.chromium.launch({ channel:'chrome',headless:true });
const context = await browser.newContext({viewport:{width:1512,height:982},deviceScaleFactor:2});
const page = await context.newPage(), errors = [], navigation = [], memory = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (['warning','error'].includes(m.type())) errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await page.addInitScript(() => {
  window.__longTasks = [];
  new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(e => ({start:e.startTime,duration:e.duration}))))
    .observe({type:'longtask',buffered:true});
});
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
async function settle(route) {
  await page.waitForFunction(({route,site}) => {
    if (site === 'linh') return document.querySelector(`.app-shell:not([inert])[data-route="${route}"]`) &&
      document.querySelector('.page-transitions')?.getAttribute('aria-busy') === 'false';
    return location.pathname === route && (route === '/' ? !!document.querySelector('.home') :
      document.querySelector('main')?.className?.includes(route.split('/')[1] === 'spirituality' ? 'spirit__frame' : route.split('/')[1] === 'about-me' ? 'about__frame' : route.split('/')[1]+'__frame'));
  }, {route,site});
  await page.evaluate(async () => { await document.fonts.ready; await Promise.allSettled([...document.images].map(i => i.decode())); });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('img').evaluateAll(imgs => imgs.filter(i => i.getClientRects().length && (!i.complete || !i.naturalWidth)).length),0,'Broken visible image');
}
async function heap(round) {
  await cdp.send('HeapProfiler.collectGarbage');
  const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  memory.push({round,jsHeapMiB:metrics.JSHeapUsedSize/1048576,domNodes:metrics.Nodes,listeners:metrics.JSEventListeners});
}
try {
  const initialStart=performance.now(); await page.goto(url); await settle('/');
  const initialReadyMs=performance.now()-initialStart;
  for(let round=1;round<=3;round++) {
    for(const route of routes) {
      const start=performance.now();
      await page.evaluate(route => { history.pushState({key:crypto.randomUUID()},'',route); dispatchEvent(new PopStateEvent('popstate')); },route);
      await settle(route);
      navigation.push({round,route,readyIncluding700msSettleMs:performance.now()-start});
    }
    await heap(round);
  }
  // Measure steady animation separately from cold decode and route transitions.
  const animated=site==='linh'?'/scouting':'/about-me/seeker';
  await page.evaluate(route => {history.pushState({key:crypto.randomUUID()},'',route);dispatchEvent(new PopStateEvent('popstate'));},animated);
  await settle(animated);
  const frames=await page.evaluate(()=>new Promise(resolve=>{
    let last,first; const intervals=[];
    const tick=time=>{first??=time;if(last!==undefined)intervals.push(time-last);last=time;
      if(time-first<2000)requestAnimationFrame(tick);else resolve(intervals);};requestAnimationFrame(tick);
  }));
  const resources=await page.evaluate(()=>({longTasks:window.__longTasks,
    entries:performance.getEntriesByType('resource').map(e=>({url:e.name,encodedBytes:e.encodedBodySize,transferBytes:e.transferSize,durationMs:e.duration}))}));
  const server=await Promise.all(Array.from({length:20},async()=>{
    const start=performance.now(),response=await fetch(url);await response.arrayBuffer();
    return {status:response.status,durationMs:performance.now()-start};
  }));
  assert(server.every(r=>r.status===200),'Local preview request failed');
  assert.deepEqual(errors,[]);
  const sorted=[...frames].sort((a,b)=>a-b);
  const report={site,url,scope:'Local production preview only; JS heap excludes image/GPU/native memory. No remote server logs or physical Mac available.',
    initialReadyMs,navigation,memory,steadyFrames:{count:frames.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over50ms:frames.filter(n=>n>50).length},
    errors,server,resourceTotals:{encodedMiB:resources.entries.reduce((n,r)=>n+r.encodedBytes,0)/1048576,transferMiB:resources.entries.reduce((n,r)=>n+r.transferBytes,0)/1048576,
      uniqueEncodedMiB:[...new Map(resources.entries.map(r=>[r.url,r.encodedBytes])).values()].reduce((a,b)=>a+b,0)/1048576},
    largestResources:resources.entries.sort((a,b)=>b.encodedBytes-a.encodedBytes).slice(0,10),longTasks:resources.longTasks};
  const out=new URL('../design/resource-health/',import.meta.url);await mkdir(out,{recursive:true});
  await writeFile(new URL(`${site}-production.json`,out),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({site,initialReadyMs,memory,steadyFrames:report.steadyFrames,errors,resources:report.resourceTotals,maxLocalHTTPMs:Math.max(...server.map(s=>s.durationMs))},null,2));
} finally {await browser.close();}
