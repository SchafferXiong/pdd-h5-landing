import { chromium } from 'playwright';
import { paths } from '../../shared/paths.mjs';

const statePath = paths.jimengStorageStateFile;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1512, height: 982 }, storageState: statePath, acceptDownloads: true });
const page = await context.newPage();

await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(2000);

const assetsNav = page.getByText('资产', { exact: true }).first();
if (await assetsNav.count()) {
  await assetsNav.click({ timeout: 6000 }).catch(() => {});
}
await page.waitForTimeout(4000);

console.log('URL=', page.url());
const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 3000);
console.log('TEXT=', text);

const buttons = await page.evaluate(() =>
  Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean).slice(0, 150)
);
console.log('BUTTONS=', JSON.stringify(buttons));

await page.screenshot({ path: '/tmp/jimeng_assets_tab.png', fullPage: false });

const downloadButtons = page.getByRole('button', { name: /下载/ });
console.log('DOWNLOAD_BTN_COUNT=', await downloadButtons.count().catch(() => 0));

await browser.close();
