import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(1500);

await page.getByText('登录', { exact: true }).first().click({ timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1000);

const popupWait = page.waitForEvent('popup', { timeout: 15000 }).catch(() => null);
const agreeBtn = page.getByText('同意', { exact: true }).first();
if (await agreeBtn.count()) {
  await agreeBtn.click({ timeout: 8000 }).catch(() => {});
}

const popup = await popupWait;
if (!popup) {
  console.log('NO_POPUP_AFTER_AGREE');
  await page.screenshot({ path: '/tmp/jimeng_no_popup_after_agree.png', fullPage: true }).catch(() => {});
  await browser.close();
  process.exit(0);
}

await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
await popup.waitForTimeout(3500);
console.log('POPUP_URL=', popup.url());

const data = await popup.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img')).map((img) => ({
    src: img.src,
    w: img.naturalWidth,
    h: img.naturalHeight,
    cls: img.className,
    alt: img.alt
  }));
  const canvasCount = document.querySelectorAll('canvas').length;
  const text = document.body.innerText.replace(/\s+/g, ' ').slice(0, 1200);
  return { imgs, canvasCount, text };
});

console.log('CANVAS_COUNT=', data.canvasCount);
console.log('TEXT=', data.text);
console.log('IMGS=', JSON.stringify(data.imgs, null, 2));

await popup.screenshot({ path: '/tmp/jimeng_popup_imgsrc_probe.png', fullPage: true }).catch(() => {});
await browser.close();
