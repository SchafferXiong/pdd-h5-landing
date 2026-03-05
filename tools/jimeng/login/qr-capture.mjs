import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });

await page.goto('https://jimeng.jianying.com', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/jimeng_before_login.png', fullPage: false });

const clickTextCandidates = ['开启即梦', '立即创作', '登录', '注册/登录', '登录/注册', '开始创作'];
let clicked = false;
for (const t of clickTextCandidates) {
  const loc = page.getByText(t, { exact: false }).first();
  if (await loc.count()) {
    try {
      await loc.click({ timeout: 5000 });
      clicked = true;
      console.log('clicked', t);
      break;
    } catch (e) {
      console.log('click failed', t, e.message.slice(0, 120));
    }
  }
}

if (!clicked) {
  const loc = page.locator('a,button').filter({ hasText: '即梦' }).first();
  if (await loc.count()) {
    try {
      await loc.click({ timeout: 5000 });
      clicked = true;
      console.log('clicked fallback 即梦 button');
    } catch {}
  }
}

await page.waitForTimeout(5000);
console.log('current url:', page.url());
await page.screenshot({ path: '/tmp/jimeng_after_click.png', fullPage: false });

const bodyText = (await page.locator('body').innerText()).slice(0, 4000);
console.log('BODY=', bodyText.replace(/\s+/g, ' ').slice(0, 1000));

const selectors = [
  'img[alt*="二维码"]',
  '[class*="qrcode"] img',
  '[class*="qrcode"]',
  '[class*="qr"] img',
  'canvas',
  'img[src*="qr"]',
  'img[src*="qrcode"]',
  'div:has-text("扫码")',
  'div:has-text("请使用")'
];
let saved = false;
for (const sel of selectors) {
  const nodes = page.locator(sel);
  const count = await nodes.count();
  if (!count) continue;
  for (let i = 0; i < Math.min(count, 20); i++) {
    const n = nodes.nth(i);
    const b = await n.boundingBox();
    if (!b) continue;
    if (b.width < 120 || b.height < 120) continue;
    try {
      await n.screenshot({ path: '/tmp/jimeng_qr_element.png' });
      console.log('saved selector', sel, 'i', i, 'size', b.width, b.height);
      saved = true;
      break;
    } catch {}
  }
  if (saved) break;
}

if (!saved) {
  await page.screenshot({ path: '/tmp/jimeng_qr_fallback.png', clip: { x: 430, y: 120, width: 680, height: 760 } });
  console.log('saved fallback');
}

await browser.close();
