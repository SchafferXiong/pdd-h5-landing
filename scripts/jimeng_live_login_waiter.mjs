import { chromium } from 'playwright';
import fs from 'node:fs';

const QR_PATH = '/tmp/jimeng_live_qr.png';
const POPUP_PATH = '/tmp/jimeng_live_popup.png';
const STATE_PATH = '/Users/feng/Desktop/codexLandingPageConstructor/assets/login/jimeng-storage-state.json';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await sleep(1500);

const loginBtn = page.getByText('登录', { exact: true }).first();
if (!(await loginBtn.isVisible().catch(() => false))) {
  console.log('ALREADY_LOGGED_IN=1');
  await context.storageState({ path: STATE_PATH });
  await browser.close();
  process.exit(0);
}

const popupPromise = page.waitForEvent('popup', { timeout: 20000 }).catch(() => null);
await loginBtn.click({ timeout: 8000 }).catch(() => {});
await sleep(600);
const agreeBtn = page.getByText('同意', { exact: true }).first();
if (await agreeBtn.isVisible().catch(() => false)) {
  await agreeBtn.click({ timeout: 5000 }).catch(() => {});
}

const popup = await popupPromise;
if (!popup) {
  console.log('POPUP_NOT_OPENED=1');
  await page.screenshot({ path: '/tmp/jimeng_live_no_popup.png' });
  await browser.close();
  process.exit(2);
}

await popup.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {});
await sleep(2000);

// Save full popup
await popup.screenshot({ path: POPUP_PATH, fullPage: true }).catch(() => {});

let qrSaved = false;
const selectors = [
  'img[src*="qrcode"]',
  'img[src*="qr"]',
  '[class*="qrcode"] img',
  '[class*="qrcode"]',
  '[class*="qr"] img',
  '[class*="qr"]',
  'canvas'
];
for (const sel of selectors) {
  const loc = popup.locator(sel);
  const count = await loc.count();
  for (let i = 0; i < Math.min(count, 20); i++) {
    const el = loc.nth(i);
    const b = await el.boundingBox();
    if (!b) continue;
    if (b.width < 140 || b.height < 140) continue;
    if (b.width > 600 || b.height > 600) continue;
    try {
      await el.screenshot({ path: QR_PATH });
      qrSaved = true;
      break;
    } catch {}
  }
  if (qrSaved) break;
}

if (!qrSaved) {
  await popup.screenshot({ path: QR_PATH, clip: { x: 90, y: 130, width: 320, height: 360 } }).catch(() => {});
}

console.log('QR_READY=' + QR_PATH);
console.log('POPUP_READY=' + POPUP_PATH);
console.log('ACTION=SCAN_NOW');

let ok = false;
for (let i = 0; i < 80; i++) {
  await sleep(3000);

  const popupClosed = popup.isClosed();
  const popupUrl = popupClosed ? 'CLOSED' : popup.url();

  // Check main page login status
  try {
    await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch {}
  await sleep(500);
  const stillLogin = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);

  console.log(`POLL_${i}=popup:${popupUrl} login:${stillLogin}`);

  if (!stillLogin) {
    ok = true;
    break;
  }
}

if (ok) {
  fs.mkdirSync('/Users/feng/Desktop/codexLandingPageConstructor/assets/login', { recursive: true });
  await context.storageState({ path: STATE_PATH });
  console.log('LOGIN_SUCCESS=1');
  console.log('STATE=' + STATE_PATH);
} else {
  console.log('LOGIN_TIMEOUT=1');
}

await browser.close();
