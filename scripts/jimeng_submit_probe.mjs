import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1500);

const textarea = page.locator('textarea[placeholder*="Seedance"], textarea').first();
await textarea.click({ timeout: 5000 });
await textarea.fill('测试：红色电商风格，4秒短视频。');
await page.waitForTimeout(1000);

const submit = page.locator('button.submit-button-KJTUYS, button.collapsed-submit-button-o26OIS, button:has(svg)').first();
const disabledBefore = await submit.isDisabled().catch(() => null);
console.log('SUBMIT_DISABLED_BEFORE=', disabledBefore);

const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
await submit.click({ timeout: 5000 }).catch((e) => console.log('CLICK_ERR=', e.message.slice(0,120)));
const popup = await popupPromise;
await page.waitForTimeout(3000);

if (popup) {
  await popup.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
  console.log('POPUP_URL=', popup.url());
  await popup.screenshot({ path: '/tmp/jimeng_submit_popup.png', fullPage: true }).catch(() => {});
}

const bodyText = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1500);
console.log('BODY=', bodyText);
await page.screenshot({ path: '/tmp/jimeng_submit_after.png', fullPage: false });

await browser.close();
