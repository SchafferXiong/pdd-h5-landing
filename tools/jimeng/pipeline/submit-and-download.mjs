import { chromium } from 'playwright';
import fs from 'node:fs';
import { paths } from '../../shared/paths.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QR_PATH = '/tmp/jimeng_submit_download_qr.png';
const POPUP_PATH = '/tmp/jimeng_submit_download_popup.png';
const FINAL_PATH = '/tmp/jimeng_submit_download_final.png';
const STATE_PATH = paths.jimengStorageStateFile;
const VIDEO_DIR = paths.jimengVideoDir;

const heroPrompt = '拼多多品牌红白金视觉，4秒竖版视频，礼盒快速推进，百亿补贴+9块9秒杀+天天领现金微信秒到账，最后强化立即下载动作。';
const benefitPrompt = '拼多多品牌红白金视觉，8秒竖版视频，分镜展示万人团一件批发价、商家入驻0佣金千亿扶持、多多买菜返券、全域优惠收束。';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1512, height: 982 },
  acceptDownloads: true
});
const page = await context.newPage();

async function modalVisible() {
  return await page.getByText('同意协议后前往登录', { exact: false }).first().isVisible().catch(() => false);
}

async function submitPrompt(prompt, name) {
  await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(1600);

  const textarea = page.locator('textarea[placeholder*="Seedance"], textarea').first();
  await textarea.fill(prompt);
  await sleep(700);

  const submitBtn = page.locator('button.submit-button-KJTUYS:visible').first();
  const box = await submitBtn.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await submitBtn.click({ timeout: 5000 }).catch(() => {});
  }

  await sleep(2200);
  const blocked = await modalVisible();
  console.log(`SUBMIT_${name}_BLOCKED=${blocked}`);
  await page.screenshot({ path: `/tmp/jimeng_submit_${name}.png`, fullPage: false }).catch(() => {});
  return !blocked;
}

async function openPopupFromModal() {
  if (!(await modalVisible())) return null;

  const popupWait = page.waitForEvent('popup', { timeout: 25000 }).catch(() => null);
  await page.getByText('同意', { exact: true }).first().click({ timeout: 9000 }).catch(() => {});
  const popup = await popupWait;
  if (!popup) return null;

  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sleep(2200);
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

async function ensureLoginThenSaveState() {
  let heroOk = await submitPrompt(heroPrompt, 'hero4s_first');
  if (heroOk) {
    await context.storageState({ path: STATE_PATH });
    return true;
  }

  const popup = await openPopupFromModal();
  if (!popup) {
    console.log('POPUP_OPEN_FAIL=1');
    return false;
  }

  let loginDone = false;
  for (let i = 0; i < 150; i++) {
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
    return false;
  }

  let loginConfirmed = false;
  for (let i = 0; i < 30; i++) {
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
    return false;
  }

  await context.storageState({ path: STATE_PATH });
  console.log('STATE_SAVED=' + STATE_PATH);

  heroOk = await submitPrompt(heroPrompt, 'hero4s_retry');
  return heroOk;
}

async function submitBenefit() {
  return await submitPrompt(benefitPrompt, 'benefit8s');
}

async function tryDownloadFromAssets() {
  const savedFiles = [];
  const seen = new Set();

  for (let round = 0; round < 30; round++) {
    await page.goto('https://jimeng.jianying.com/ai-tool/assets', { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(() => {});
    await sleep(3500);
    await page.screenshot({ path: `/tmp/jimeng_assets_round_${round}.png`, fullPage: false }).catch(() => {});

    const hasLogin = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
    if (hasLogin) {
      console.log(`ASSETS_ROUND_${round}=LOGIN_REQUIRED`);
      continue;
    }

    const downloadButtons = page.getByRole('button', { name: /下载/ });
    const count = await downloadButtons.count().catch(() => 0);
    console.log(`ASSETS_ROUND_${round}_DOWNLOAD_BTNS=${count}`);

    for (let i = 0; i < count; i++) {
      const key = `${round}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);

      try {
        const btn = downloadButtons.nth(i);
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 15000 }),
          btn.click({ timeout: 5000 })
        ]);

        const out = `${VIDEO_DIR}/jimeng-${Date.now()}-${savedFiles.length + 1}.mp4`;
        await download.saveAs(out);
        savedFiles.push(out);
        console.log('DOWNLOADED=' + out);
        if (savedFiles.length >= 2) return savedFiles;
      } catch {
        console.log(`DOWNLOAD_ATTEMPT_FAIL=${round}-${i}`);
      }
    }

    await sleep(15000);
  }

  return savedFiles;
}

let heroOk = false;
let benefitOk = false;
let files = [];

try {
  heroOk = await ensureLoginThenSaveState();
  if (heroOk) {
    benefitOk = await submitBenefit();
    files = await tryDownloadFromAssets();
  }
} catch (err) {
  console.log('FATAL=' + (err && err.message ? err.message : String(err)));
}

await page.screenshot({ path: FINAL_PATH, fullPage: false }).catch(() => {});
console.log('FINAL=' + FINAL_PATH);
console.log('TASK_RESULT=' + JSON.stringify({ hero4s: heroOk, benefit8s: benefitOk, downloaded: files }));

await browser.close();
