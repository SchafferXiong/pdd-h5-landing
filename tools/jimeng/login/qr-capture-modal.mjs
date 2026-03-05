import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);

await page.getByText('登录', { exact: true }).first().click({ timeout: 5000 });
console.log('clicked 登录');
await page.waitForTimeout(1500);

const agreeBtn = page.getByText('同意', { exact: true }).first();
if (await agreeBtn.count()) {
  try {
    await agreeBtn.click({ timeout: 5000 });
    console.log('clicked 同意');
  } catch (e) {
    console.log('agree click failed', e.message.slice(0, 140));
  }
}

await page.waitForTimeout(3500);
await page.screenshot({ path: '/tmp/jimeng_after_agree.png' });

const bodyText = await page.locator('body').innerText();
console.log('BODY_HAS_SCAN=', /扫码|二维码|抖音|手机登录|扫一扫/.test(bodyText));
console.log('BODY_SNIP=', bodyText.replace(/\s+/g,' ').slice(0,1400));

let saved = false;
const qrSelectors = [
  '[class*="qrcode"] img',
  '[class*="qrcode"]',
  '[class*="qr"] img',
  '[class*="qr"]',
  'img[src*="qrcode"]',
  'img[src*="qr"]',
  'canvas'
];
for (const sel of qrSelectors) {
  const loc = page.locator(sel);
  const count = await loc.count();
  for (let i = 0; i < Math.min(count, 30); i++) {
    const el = loc.nth(i);
    const box = await el.boundingBox();
    if (!box) continue;
    if (box.width < 140 || box.height < 140) continue;
    if (box.width > 700 || box.height > 700) continue;
    // Prefer centered modal area
    if (box.x < 350 || box.x > 1150) continue;
    try {
      await el.screenshot({ path: '/tmp/jimeng_login_qr.png' });
      console.log('saved qr via', sel, 'idx', i, 'size', box.width, box.height, 'x', box.x, 'y', box.y);
      saved = true;
      break;
    } catch {}
  }
  if (saved) break;
}

if (!saved) {
  await page.screenshot({ path: '/tmp/jimeng_login_qr_fallback.png', clip: { x: 430, y: 100, width: 650, height: 760 } });
  console.log('saved fallback clip');
}

await browser.close();
