import { chromium } from 'playwright';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QR_PATH = '/tmp/jimeng_live_auth_qr.png';
const POPUP_PATH = '/tmp/jimeng_live_auth_popup.png';
const RESULT_SHOT = '/tmp/jimeng_live_submit_result.png';

const heroPrompt = '拼多多品牌红白金视觉，4秒竖版视频，礼盒快速推进，百亿补贴+9块9秒杀+天天领现金微信秒到账，最后强化立即下载动作。';
const benefitPrompt = '拼多多品牌红白金视觉，8秒竖版视频，分镜展示万人团一件批发价、商家入驻0佣金千亿扶持、多多买菜返券、全域优惠收束。';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

async function openLoginPopup() {
  await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(1500);

  const login = page.getByText('登录', { exact: true }).first();
  const visible = await login.isVisible().catch(() => false);
  if (!visible) {
    console.log('ALREADY_LOGGED_IN=1');
    return null;
  }

  await login.click({ timeout: 6000 }).catch(() => {});
  await sleep(600);

  const popupWait = page.waitForEvent('popup', { timeout: 20000 }).catch(() => null);
  const agree = page.getByText('同意', { exact: true }).first();
  if (await agree.count()) {
    await agree.click({ timeout: 6000 }).catch(() => {});
  }

  const popup = await popupWait;
  if (!popup) {
    console.log('POPUP_FAIL=1');
    return null;
  }

  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sleep(2600);
  await popup.screenshot({ path: POPUP_PATH, fullPage: true }).catch(() => {});

  // Extract the largest image (QR) from popup
  const qr = await popup.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let best = null;
    for (const img of imgs) {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w < 200 || h < 200) continue;
      const score = Math.min(w, h);
      if (!best || score > best.score) {
        best = { src: img.src, w, h, score };
      }
    }
    return best;
  });

  if (qr?.src?.startsWith('data:image/png;base64,')) {
    const b64 = qr.src.replace('data:image/png;base64,', '');
    fs.writeFileSync(QR_PATH, Buffer.from(b64, 'base64'));
  } else {
    await popup.screenshot({ path: QR_PATH, clip: { x: 85, y: 120, width: 340, height: 380 } }).catch(() => {});
  }

  console.log('QR_READY=' + QR_PATH);
  console.log('POPUP_READY=' + POPUP_PATH);
  console.log('ACTION=SCAN_QR_IN_DOUYIN_APP_NOW');

  return popup;
}

async function waitLoginSuccess(popup) {
  for (let i = 0; i < 90; i++) {
    await sleep(3000);
    await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(600);
    const stillLogin = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
    const purl = popup && !popup.isClosed() ? popup.url() : 'CLOSED';
    console.log(`POLL_${i}=login:${stillLogin} popup:${purl}`);
    if (!stillLogin) return true;
  }
  return false;
}

async function submit(prompt, name) {
  await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(1500);

  const textarea = page.locator('textarea[placeholder*="Seedance"], textarea').first();
  await textarea.fill(prompt);
  await sleep(500);

  const submitBtn = page.locator('button.submit-button-KJTUYS:visible').first();
  const box = await submitBtn.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    console.log(`SUBMIT_${name}=1`);
  } else {
    await submitBtn.click({ timeout: 5000 }).catch(() => {});
    console.log(`SUBMIT_${name}=fallback`);
  }

  await sleep(2500);
}

const popup = await openLoginPopup();
if (popup === null) {
  // Could already be logged in, or popup fail. try continue anyway.
  const stillLogin = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
  if (stillLogin) {
    console.log('LOGIN_REQUIRED_BUT_NOT_READY=1');
    await browser.close();
    process.exit(1);
  }
}

let logged = true;
if (popup) {
  logged = await waitLoginSuccess(popup);
}

if (!logged) {
  console.log('LOGIN_TIMEOUT=1');
  await browser.close();
  process.exit(2);
}

console.log('LOGIN_SUCCESS=1');
await submit(heroPrompt, 'hero4s');
await submit(benefitPrompt, 'benefit8s');

await page.screenshot({ path: RESULT_SHOT, fullPage: false }).catch(() => {});
console.log('RESULT_SHOT=' + RESULT_SHOT);
console.log('PIPELINE_FINISHED=1');

await browser.close();
