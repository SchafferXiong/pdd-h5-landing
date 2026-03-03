import { chromium } from 'playwright';

const statePath = '/Users/feng/Desktop/codexLandingPageConstructor/assets/login/jimeng-storage-state.json';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1512, height: 982 },
  storageState: statePath
});
const page = await context.newPage();

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/jimeng_logged_home.png', fullPage: false });

const loginVisible = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
console.log('LOGIN_VISIBLE=', loginVisible);

const videoCard = page.getByText('视频生成', { exact: false }).first();
if (await videoCard.count()) {
  await videoCard.click({ timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

await page.screenshot({ path: '/tmp/jimeng_logged_video_page.png', fullPage: false });
console.log('URL=', page.url());

const info = await page.evaluate(() => {
  const text = document.body.innerText.replace(/\s+/g, ' ').slice(0, 3000);
  const buttons = Array.from(document.querySelectorAll('button'))
    .map((b) => b.innerText.trim())
    .filter(Boolean)
    .slice(0, 80);
  const placeholders = Array.from(document.querySelectorAll('textarea, input'))
    .map((n) => ({
      tag: n.tagName.toLowerCase(),
      placeholder: n.getAttribute('placeholder') || '',
      type: n.getAttribute('type') || ''
    }))
    .slice(0, 50);
  const selects = Array.from(document.querySelectorAll('[role="button"], [class*="select"], [class*="dropdown"]'))
    .map((n) => (n.textContent || '').trim())
    .filter(Boolean)
    .slice(0, 80);
  return { text, buttons, placeholders, selects };
});

console.log('TEXT=', info.text);
console.log('BUTTONS=', JSON.stringify(info.buttons));
console.log('PLACEHOLDERS=', JSON.stringify(info.placeholders));
console.log('SELECTS=', JSON.stringify(info.selects));

await browser.close();
