import { chromium } from 'playwright';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QR_PATH = '/tmp/jimeng_block_qr.png';
const POPUP_PATH = '/tmp/jimeng_block_popup.png';
const FINAL_PATH = '/tmp/jimeng_block_final.png';

const heroPrompt = '拼多多品牌红白金视觉，4秒竖版视频，礼盒快速推进，百亿补贴+9块9秒杀+天天领现金微信秒到账，最后强化立即下载动作。';
const benefitPrompt = '拼多多品牌红白金视觉，8秒竖版视频，分镜展示万人团一件批发价、商家入驻0佣金千亿扶持、多多买菜返券、全域优惠收束。';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

async function modalVisible() {
  return await page.getByText('同意协议后前往登录', { exact: false }).first().isVisible().catch(() => false);
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

async function openPopupFromModal() {
  if (!(await modalVisible())) return null;

  const popupWait = page.waitForEvent('popup', { timeout: 25000 }).catch(() => null);
  await page.getByText('同意', { exact: true }).first().click({ timeout: 8000 }).catch(() => {});
  const popup = await popupWait;
  if (!popup) return null;

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

// First try hero submit. If blocked, trigger login popup.
let heroOk = await submitPrompt(heroPrompt, 'hero4s_first');
let popup = null;

if (!heroOk) {
  popup = await openPopupFromModal();
  if (!popup) {
    console.log('POPUP_OPEN_FAIL=1');
    await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
    await browser.close();
    process.exit(2);
  }

  let loginDone = false;
  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const purl = popup.isClosed() ? 'CLOSED' : popup.url();
    console.log(`POLL_${i}=popup:${purl}`);
    const callbackReached = purl.startsWith('https://jimeng.jianying.com/passport/web/web_login_success');
    if (popup.isClosed() || callbackReached) {
      loginDone = true;
      break;
    }
  }

  if (!loginDone) {
    console.log('LOGIN_NOT_CONFIRMED=1');
    await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
    await browser.close();
    process.exit(3);
  }

  // OAuth popup callback can close before cookies are fully available in main page.
  // Confirm the home page is really logged in before retrying submission.
  let loginConfirmed = false;
  for (let i = 0; i < 25; i++) {
    await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await sleep(900);
    const stillLogin = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
    console.log(`LOGIN_CHECK_${i}=stillLogin:${stillLogin}`);
    if (!stillLogin) {
      loginConfirmed = true;
      break;
    }
    await sleep(1200);
  }

  if (!loginConfirmed) {
    console.log('LOGIN_NOT_EFFECTIVE_ON_HOME=1');
    await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
    await browser.close();
    process.exit(4);
  }

  // Retry hero submission after login callback
  heroOk = await submitPrompt(heroPrompt, 'hero4s_retry');
}

let benefitOk = false;
if (heroOk) {
  benefitOk = await submitPrompt(benefitPrompt, 'benefit8s');
}

await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
console.log('FINAL=' + FINAL_PATH);
console.log('TASK_RESULT=' + JSON.stringify({ hero4s: heroOk, benefit8s: benefitOk }));

await browser.close();
