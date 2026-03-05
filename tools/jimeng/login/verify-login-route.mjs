import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
const page = await context.newPage();

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);

const hasLoginBefore = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
console.log('HAS_LOGIN_BEFORE=', hasLoginBefore);

if (hasLoginBefore) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 12000 }).catch(() => null),
    page.getByText('登录', { exact: true }).first().click({ timeout: 8000 })
  ]);

  await page.waitForTimeout(1000);
  const agreeBtn = page.getByText('同意', { exact: true }).first();
  if (await agreeBtn.count()) {
    await agreeBtn.click({ timeout: 5000 }).catch(() => {});
  }

  if (popup) {
    await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    await popup.waitForTimeout(2000);
    console.log('POPUP_URL=', popup.url());
    await popup.screenshot({ path: '/tmp/jimeng_popup_after_user_auth.png' }).catch(() => {});
    // Give callback enough time if user already scanned/authorized
    await popup.waitForTimeout(8000);
  }
}

await page.waitForTimeout(5000);
await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);

const hasLoginAfter = await page.getByText('登录', { exact: true }).first().isVisible().catch(() => false);
console.log('HAS_LOGIN_AFTER=', hasLoginAfter);

const bodyText = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 2000);
console.log('BODY=', bodyText);

await page.screenshot({ path: '/tmp/jimeng_home_after_auth_check.png', fullPage: false });

const videoCard = page.getByText('视频生成', { exact: false }).first();
if (await videoCard.count()) {
  await videoCard.click({ timeout: 7000 }).catch(async () => {
    await page.locator('div,button,a').filter({ hasText: '视频生成' }).first().click({ timeout: 7000 }).catch(() => {});
  });
  await page.waitForTimeout(2500);
  console.log('URL_AFTER_VIDEO_CLICK=', page.url());
  await page.screenshot({ path: '/tmp/jimeng_video_entry.png', fullPage: false });
}

await browser.close();
