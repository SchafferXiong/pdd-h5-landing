import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1500);

let popup = null;

const tryGetPopup = async (action) => {
  try {
    const [p] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }),
      action()
    ]);
    return p;
  } catch {
    try {
      await action();
    } catch {}
    return null;
  }
};

popup = await tryGetPopup(() => page.getByText('登录', { exact: true }).first().click({ timeout: 5000 }));
await page.waitForTimeout(1200);

if (!popup) {
  popup = await tryGetPopup(() => page.getByText('同意', { exact: true }).first().click({ timeout: 5000 }));
}

await page.waitForTimeout(1500);

if (!popup) {
  const pages = context.pages();
  if (pages.length > 1) popup = pages[pages.length - 1];
}

if (popup) {
  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await popup.waitForTimeout(2500);
  console.log('POPUP_URL=', popup.url());
  console.log('POPUP_TITLE=', await popup.title());
  const txt = (await popup.locator('body').innerText().catch(()=>'')) || '';
  console.log('POPUP_TEXT=', txt.replace(/\s+/g,' ').slice(0,1200));
  await popup.screenshot({ path: '/tmp/jimeng_login_popup_full.png', fullPage: true });

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
    const loc = popup.locator(sel);
    const count = await loc.count();
    for (let i = 0; i < Math.min(count, 40); i++) {
      const el = loc.nth(i);
      const box = await el.boundingBox();
      if (!box) continue;
      if (box.width < 130 || box.height < 130) continue;
      if (box.width > 900 || box.height > 900) continue;
      try {
        await el.screenshot({ path: '/tmp/jimeng_login_qr.png' });
        console.log('QR_FOUND via', sel, i, box.width, box.height);
        saved = true;
        break;
      } catch {}
    }
    if (saved) break;
  }

  if (!saved) {
    await popup.screenshot({ path: '/tmp/jimeng_login_qr_fallback.png', clip: { x: 300, y: 80, width: 700, height: 780 } });
    console.log('QR_FALLBACK saved');
  }
} else {
  console.log('NO_POPUP');
  await page.screenshot({ path: '/tmp/jimeng_no_popup.png', fullPage: true });
}

await browser.close();
