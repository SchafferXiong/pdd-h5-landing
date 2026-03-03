import { chromium } from 'playwright';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QR_PATH = '/tmp/jimeng_strict_qr.png';
const POPUP_PATH = '/tmp/jimeng_strict_popup.png';
const FINAL_PATH = '/tmp/jimeng_strict_final.png';

const heroPrompt = '拼多多品牌红白金视觉，4秒竖版视频，礼盒快速推进，百亿补贴+9块9秒杀+天天领现金微信秒到账，最后强化立即下载动作。';
const benefitPrompt = '拼多多品牌红白金视觉，8秒竖版视频，分镜展示万人团一件批发价、商家入驻0佣金千亿扶持、多多买菜返券、全域优惠收束。';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

async function hasNeedLogin() {
  return await page.locator('.login-button-jDhuVc').first().isVisible().catch(() => false);
}

async function modalVisible() {
  return await page.getByText('同意协议后前往登录', { exact: false }).first().isVisible().catch(() => false);
}

async function getPopupAndQr() {
  const loginCtl = page.locator('.login-button-jDhuVc').first();
  if (await loginCtl.count()) {
    await loginCtl.click({ timeout: 7000 }).catch(() => {});
  }

  await sleep(800);
  const popupWait = page.waitForEvent('popup', { timeout: 22000 }).catch(() => null);

  if (await modalVisible()) {
    await page.getByText('同意', { exact: true }).first().click({ timeout: 8000 }).catch(() => {});
  }

  const popup = await popupWait;
  if (!popup) {
    console.log('NO_POPUP_AFTER_AGREE=1');
    return null;
  }

  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sleep(2500);
  await popup.screenshot({ path: POPUP_PATH, fullPage: true }).catch(() => {});

  const qr = await popup.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let best = null;
    for (const img of imgs) {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w < 180 || h < 180) continue;
      const score = Math.min(w, h);
      if (!best || score > best.score) best = { src: img.src, w, h, score };
    }
    return best;
  });

  if (qr?.src?.startsWith('data:image/png;base64,')) {
    fs.writeFileSync(QR_PATH, Buffer.from(qr.src.replace('data:image/png;base64,', ''), 'base64'));
  } else {
    await popup.screenshot({ path: QR_PATH, clip: { x: 90, y: 120, width: 340, height: 380 } }).catch(() => {});
  }

  console.log('QR_READY=' + QR_PATH);
  console.log('POPUP_READY=' + POPUP_PATH);
  console.log('ACTION=SCAN_QR_NOW');

  return popup;
}

async function waitLoggedIn(popup) {
  for (let i = 0; i < 90; i++) {
    await sleep(3000);
    await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(700);
    const needLogin = await hasNeedLogin();
    const modal = await modalVisible();
    const purl = popup && !popup.isClosed() ? popup.url() : 'CLOSED';
    console.log(`POLL_${i}=needLogin:${needLogin} modal:${modal} popup:${purl}`);
    if (!needLogin && !modal) return true;
  }
  return false;
}

async function submitPrompt(prompt, name) {
  await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(1500);

  const textarea = page.locator('textarea[placeholder*="Seedance"], textarea').first();
  await textarea.fill(prompt);
  await sleep(600);

  const submitBtn = page.locator('button.submit-button-KJTUYS:visible').first();
  const box = await submitBtn.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await submitBtn.click({ timeout: 5000 }).catch(() => {});
  }

  await sleep(1800);
  const blocked = await modalVisible();
  console.log(`SUBMIT_${name}_BLOCKED=${blocked}`);
  return !blocked;
}

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
await sleep(1500);

let needLogin = await hasNeedLogin();
let popup = null;
let logged = !needLogin;

if (needLogin) {
  popup = await getPopupAndQr();
  if (popup) logged = await waitLoggedIn(popup);
  else logged = false;
}

if (!logged) {
  console.log('LOGIN_TIMEOUT_OR_FAIL=1');
  await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
  await browser.close();
  process.exit(2);
}

console.log('LOGIN_SUCCESS=1');

const ok1 = await submitPrompt(heroPrompt, 'hero4s');
const ok2 = await submitPrompt(benefitPrompt, 'benefit8s');

await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
console.log('FINAL=' + FINAL_PATH);
console.log('TASK_RESULT=' + JSON.stringify({ hero4s: ok1, benefit8s: ok2 }));

await browser.close();
