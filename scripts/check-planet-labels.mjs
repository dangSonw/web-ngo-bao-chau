// Check visible labels against other labels and planet images, not just root overflow.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const pw = await import(process.argv[2] || 'playwright'), engine = process.argv[3] || 'chromium';
const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' ? { channel: 'chrome' } : {}) });
const out = new URL('../design/planet-label-qa/', import.meta.url);
await mkdir(out, { recursive: true });
const sizes = [[375,812],[420,896],[600,800],[601,800],[768,1024],[880,900],[1172,814],
  [1200,900],[1201,900],[1201,661],[1280,800],[1440,744],[1440,900],[1512,982],
  [1728,1117],[1920,1080],[1920,1200],[2560,1440],[3840,2160],[1440,600],[1440,660],
  [1440,661],[1080,1920],[3440,1440],[3840,1080]];
const results = [], errors = [];
try {
  const page = await browser.newPage({ deviceScaleFactor: 2, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (['error','warning'].includes(m.type())) errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:5177/');
  for (const route of ['/community','/inquiry']) {
    await page.evaluate(route => { history.pushState(null,'',route); dispatchEvent(new PopStateEvent('popstate')); }, route);
    await page.waitForSelector(route === '/community' ? '.community__chapters' : '.inquiry__planet-caption', { state: 'attached' });
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await page.waitForTimeout(70);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
      const layout = await page.evaluate(() => {
        const visible = n => n && n.getClientRects().length && n.getBoundingClientRect().width > 1;
        const rect = n => { const r = n.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}; };
        const entries = [...document.querySelectorAll('.community__chapter,.inquiry__image')].map(n => {
          const label = [...n.querySelectorAll('.community__chapter-label,.community__chapter-text,.inquiry__planet-caption')].find(visible);
          const image = n.querySelector('.community__chapter-image') || n.querySelector('img');
          return label && { text: n.getAttribute('aria-label') || label.textContent, label:rect(label), image:rect(image) };
        }).filter(Boolean);
        return { entries, client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth,
          height:document.documentElement.scrollHeight };
      });
      const overlaps = (a,b) => Math.min(a.right,b.right) - Math.max(a.x,b.x) > 1 && Math.min(a.bottom,b.bottom) - Math.max(a.y,b.y) > 1;
      const tag = `${engine} ${route} ${width}x${height}`;
      assert.equal(layout.entries.length, route === '/community' ? 5 : 4, tag);
      assert(layout.scroll <= layout.client, `Overflow ${tag}`);
      for (const [i,a] of layout.entries.entries()) {
        assert(a.label.x >= -1 && a.label.right <= layout.client + 1 && a.label.bottom <= layout.height + 1, `Label clipped ${tag} ${a.text}`);
        for (const [j,b] of layout.entries.entries()) {
          assert(!overlaps(a.label,b.image), `Label over planet ${tag} ${a.text} / ${b.text}`);
          if (j > i) assert(!overlaps(a.label,b.label), `Label collision ${tag} ${a.text} / ${b.text}`);
        }
      }
      results.push({route,width,height,labels:layout.entries.length,noCollisions:true,noClipping:true});
      if (route === '/community' && [375,1201,1440,1512,3840].includes(width))
        await page.screenshot({path:new URL(`${engine}-${width}x${height}.png`,out).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:true});
    }
  }
  await page.locator('.site-navigation a[href="/community"]').click();
  await page.waitForSelector('.community__frame--overview');
  const chapters = await page.locator('.community__chapter').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  for (const destination of chapters) {
    const link = page.locator(`.community__chapter[href="${destination}"]`);
    await link.focus(); await page.keyboard.press('Enter');
    await page.waitForURL(`**${destination}`);
    await page.waitForSelector(`.community__frame--${destination.split('/').pop()}`);
    await page.locator('.site-navigation a[href="/community"]').click();
    await page.waitForSelector('.community__frame--overview');
  }
  await page.keyboard.press('Space'); await page.waitForURL('**/community/tay-roots');
  await page.goBack(); await page.waitForURL('**/community');
  await page.goForward(); await page.waitForURL('**/community/tay-roots');
  await page.reload(); await page.waitForURL(/\/$/); await page.waitForSelector('.home');
  assert.deepEqual(errors, []);
  await writeFile(new URL(`${engine}.json`,out), JSON.stringify({engine,errors,results},null,2)+'\n');
  console.log(`${engine}: ${results.length} layouts passed; no planet/label collisions or application errors.`);
} finally { await browser.close(); }
