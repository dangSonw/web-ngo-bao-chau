// Run against the dev server. Pass a Playwright module path if not installed:
// node scripts/check-planet-motion.mjs <playwright-module-url>
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 744 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.QA_URL || 'http://localhost:5177/');
  await page.locator('.home__link--about').click();
  await page.locator('.about__choice[href="/about-me/seeker"]').click();
  await page.waitForSelector('.planet-orbit');
  await page.locator('.planet-orbit img').evaluateAll(imgs => Promise.all(imgs.map(i => i.decode())));
  await page.waitForTimeout(800);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const metrics = async () => Object.fromEntries(
    (await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const before = await metrics();
  const phases = await page.evaluate(() => new Promise(resolve => {
    const start = performance.now(), samples = [];
    function tick(now) {
      const scene = document.querySelector('.planet-orbit');
      samples.push(Number(scene.dataset.phase));
      // Read layout to detect changes even when the browser would defer them.
      scene.querySelector('img').getBoundingClientRect();
      if (now - start < 2000) requestAnimationFrame(tick);
      else resolve(samples);
    }
    requestAnimationFrame(tick);
  }));
  const after = await metrics();
  const layouts = after.LayoutCount - before.LayoutCount;
  assert(phases.length > 30 && phases.at(-1) > phases[0], 'Orbit must keep moving');
  assert(layouts < 5, `Orbit forced ${layouts} layouts; animate transform rather than left/top`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const still = await page.locator('.planet-orbit').getAttribute('data-phase');
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.planet-orbit').getAttribute('data-phase'), still);
  assert.deepEqual(errors, []);
  const result = { frames: phases.length, layouts, reducedMotion: true, errors };
  await writeFile(new URL('../design/orbit-qa/planet-regression.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(result);
} finally {
  await browser.close();
}
