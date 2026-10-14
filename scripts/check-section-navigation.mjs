// Dev server must be running. Optional first argument: Playwright module URL.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.argv[2] || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.QA_URL || 'http://localhost:5177/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const results = [];
  for (const [file, entry] of [['aboutPages', 'about'], ['inquiryPages', 'inquiry'], ['communityPages', 'community']]) {
    const { pages } = JSON.parse(await readFile(new URL(`../src/data/${file}.json`, import.meta.url), 'utf8'));
    if (file === 'aboutPages') await page.locator('.home__link--about').click();
    else await page.locator(`.subpage-layout__navigation a[href="/${entry}"]`).click();
    await page.waitForSelector(`.${entry}__frame`);
    const dots = page.locator('.subpage-layout__pagination a');
    assert.equal(await dots.count(), pages.length);
    assert.equal(await page.locator('.subpage-layout__pagination a[href="/"]').count(), 0);
    for (let i = 0; i < pages.length * 2; i++) {
      assert.equal(new URL(page.url()).pathname, pages[i % pages.length].route);
      await page.keyboard.press('Space');
      await page.waitForURL('**' + pages[(i + 1) % pages.length].route);
    }
    await dots.last().focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForURL('**' + pages[0].route);
    await page.keyboard.press('Space');
    await page.waitForURL('**' + pages[1].route);
    await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', {
      key: ' ', code: 'Space', repeat: true, bubbles: true, cancelable: true,
    })));
    assert.equal(new URL(page.url()).pathname, pages[1].route);
    results.push({ section: entry, pages: pages.length, loops: 2, noHomeDot: true, repeatGuard: true });
  }
  const spiritual = JSON.parse(await readFile(new URL('../src/data/spiritualityPages.json', import.meta.url), 'utf8'));
  for (const branch of ['wuxing', 'planets']) {
    const screens = spiritual.pages.filter(item => item.group === branch);
    await page.locator('.subpage-layout__navigation a[href="/spirituality"]').click();
    await page.waitForSelector('.spirit__frame--overview');
    await page.locator(`.spirit__choice[href="/spirituality/${branch}"]`).click();
    await page.waitForSelector(`.spirit__frame--${branch}-intro`);
    assert.equal(await page.locator('.subpage-layout__pagination a').count(), screens.length);
    for (let i = 0; i < screens.length * 2; i++) {
      assert.equal(new URL(page.url()).pathname, screens[i % screens.length].route);
      await page.keyboard.press('Space');
      await page.waitForURL('**' + screens[(i + 1) % screens.length].route);
    }
    results.push({ section: branch, pages: screens.length, loops: 2, containedInBranch: true });
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL('../design/inquiry-qa/navigation-regression.json', import.meta.url), JSON.stringify({ results, errors }, null, 2));
  console.log('Section Space loops and pagination passed');
} finally {
  await browser.close();
}
