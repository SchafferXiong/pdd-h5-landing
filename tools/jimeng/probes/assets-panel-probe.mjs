import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto('https://jimeng.jianying.com/ai-tool/assets', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/jimeng_assets_probe.png', fullPage: false });
const info = await page.evaluate(() => ({
  url: location.href,
  text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 2200),
  buttons: Array.from(document.querySelectorAll('button')).map(b=>b.innerText.trim()).filter(Boolean).slice(0,100)
}));
console.log('URL=', info.url);
console.log('TEXT=', info.text);
console.log('BUTTONS=', JSON.stringify(info.buttons));
await browser.close();
