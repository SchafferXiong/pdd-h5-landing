import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1200);

await page.locator('textarea[placeholder*="Seedance"], textarea').first().fill('测试：红色电商风，4秒短视频，百亿补贴氛围。');
await page.waitForTimeout(400);

const visibleSubmit = page.locator('button.submit-button-KJTUYS:visible').first();
const bb = await visibleSubmit.boundingBox();
console.log('SUBMIT_BOX=', bb);

const popupPromise = page.waitForEvent('popup', { timeout: 8000 }).catch(() => null);
if (bb) {
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
} else {
  await visibleSubmit.click({ timeout: 4000, force: true }).catch(() => {});
}

const popup = await popupPromise;
await page.waitForTimeout(3000);

if (popup) {
  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  console.log('POPUP_URL=', popup.url());
  await popup.screenshot({ path: '/tmp/jimeng_submit2_popup.png', fullPage: true }).catch(() => {});
}

const info = await page.evaluate(() => ({
  url: location.href,
  text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1600)
}));
console.log('PAGE_URL=', info.url);
console.log('BODY=', info.text);
await page.screenshot({ path: '/tmp/jimeng_submit2_after.png', fullPage: false });

await browser.close();
