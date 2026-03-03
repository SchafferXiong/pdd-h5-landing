import { chromium } from 'playwright';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QR_PATH = '/tmp/jimeng_pipeline_qr.png';
const POPUP_PATH = '/tmp/jimeng_pipeline_popup.png';
const LOGGED_HOME = '/tmp/jimeng_pipeline_logged_home.png';
const ASSETS_SHOT = '/tmp/jimeng_pipeline_assets.png';
const STATE_PATH = '/Users/feng/Desktop/codexLandingPageConstructor/assets/login/jimeng-storage-state.json';

const heroPrompt = `拼多多品牌红白金视觉，4秒竖版视频，电商促销冲击节奏。镜头快速推进礼盒，连续闪现“百亿补贴、9块9秒杀、天天领现金微信秒到账”，最后0.8秒收束到强烈下载行动区域。画面明亮、可读、动感强。`;
const benefitPrompt = `拼多多品牌红白金视觉，8秒竖版视频，分四段：万人团一件批发价；商家入驻0佣金千亿扶持；多多买菜限时抽全额返券；全域优惠收束并强化立即下载。镜头平滑，信息可读。`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1512, height: 982 },
  acceptDownloads: true
});
const page = await context.newPage();

async function clickLoginFlow() {
  await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(1500);

  const loginVisible = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
  if (!loginVisible) {
    console.log('ALREADY_LOGGED_IN=1');
    return true;
  }

  await page.getByText('登录', { exact: true }).first().click({ timeout: 8000 }).catch(() => {});
  await sleep(700);

  const popupWait = page.waitForEvent('popup', { timeout: 20000 }).catch(() => null);
  const agree = page.getByText('同意', { exact: true }).first();
  if (await agree.count()) {
    await agree.click({ timeout: 8000 }).catch(() => {});
  }

  const popup = await popupWait;
  if (!popup) {
    console.log('POPUP_NOT_FOUND=1');
    return false;
  }

  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  await sleep(2500);
  await popup.screenshot({ path: POPUP_PATH, fullPage: true }).catch(() => {});

  // Capture real QR from the largest square image in popup
  const qrMeta = await popup.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    let best = null;
    for (const img of imgs) {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (w < 250 || h < 250) continue;
      const score = Math.min(w, h);
      if (!best || score > best.score) {
        best = { score, src: img.src, w, h };
      }
    }
    return best;
  });

  if (qrMeta && qrMeta.src) {
    const pngBase64 = qrMeta.src.startsWith('data:image/png;base64,')
      ? qrMeta.src.replace('data:image/png;base64,', '')
      : null;

    if (pngBase64) {
      fs.writeFileSync(QR_PATH, Buffer.from(pngBase64, 'base64'));
    } else {
      // fallback screenshot from centered QR area
      await popup.screenshot({ path: QR_PATH, clip: { x: 95, y: 120, width: 320, height: 360 } }).catch(() => {});
    }
  }

  console.log('QR_READY=' + QR_PATH);
  console.log('POPUP_READY=' + POPUP_PATH);
  console.log('ACTION=SCAN_QR_NOW');

  let logged = false;
  for (let i = 0; i < 90; i++) {
    await sleep(3000);
    try {
      await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {}
    await sleep(600);

    const stillLogin = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
    const purl = popup.isClosed() ? 'CLOSED' : popup.url();
    console.log(`POLL_${i}=login:${stillLogin} popup:${purl}`);

    if (!stillLogin) {
      logged = true;
      break;
    }
  }

  if (!logged) {
    console.log('LOGIN_TIMEOUT=1');
    return false;
  }

  await context.storageState({ path: STATE_PATH });
  console.log('LOGIN_SUCCESS=1');
  console.log('STATE=' + STATE_PATH);
  return true;
}

async function submitPrompt(prompt, name) {
  await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(1800);

  const textarea = page.locator('textarea[placeholder*="Seedance"], textarea').first();
  await textarea.click({ timeout: 6000 });
  await textarea.fill(prompt);
  await sleep(700);

  const submit = page.locator('button.submit-button-KJTUYS:visible').first();
  const box = await submit.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    console.log(`SUBMIT_${name}=clicked`);
  } else {
    await submit.click({ timeout: 5000 }).catch(() => {});
    console.log(`SUBMIT_${name}=fallback-click`);
  }

  await sleep(3000);
  await page.screenshot({ path: `/tmp/jimeng_submit_${name}.png`, fullPage: false }).catch(() => {});
}

async function checkAssetsAndTryDownload() {
  await page.goto('https://jimeng.jianying.com/ai-tool/assets', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(3500);
  await page.screenshot({ path: ASSETS_SHOT, fullPage: false }).catch(() => {});

  // Try generic "下载" buttons if they appear
  const downloadButtons = page.getByRole('button', { name: /下载/ });
  const count = await downloadButtons.count().catch(() => 0);
  console.log('ASSETS_DOWNLOAD_BUTTONS=', count);

  let saved = 0;
  for (let i = 0; i < Math.min(count, 2); i++) {
    const btn = downloadButtons.nth(i);
    try {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 12000 }),
        btn.click({ timeout: 5000 })
      ]);
      const target = `/Users/feng/Desktop/codexLandingPageConstructor/assets/video/jimeng-downloaded-${i + 1}.mp4`;
      await download.saveAs(target);
      saved += 1;
      console.log('DOWNLOADED=', target);
    } catch (e) {
      console.log('DOWNLOAD_FAIL_INDEX=' + i);
    }
  }

  console.log('ASSETS_DOWNLOADED_COUNT=' + saved);
}

const ok = await clickLoginFlow();
if (!ok) {
  await browser.close();
  process.exit(1);
}

await page.screenshot({ path: LOGGED_HOME, fullPage: false }).catch(() => {});

await submitPrompt(heroPrompt, 'hero4s');
await submitPrompt(benefitPrompt, 'benefit8s');
await checkAssetsAndTryDownload();

await browser.close();
console.log('PIPELINE_DONE=1');
