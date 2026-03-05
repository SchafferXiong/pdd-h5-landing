import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1500);
const data = await page.evaluate(() => {
  const ta = document.querySelector('textarea[placeholder*="Seedance"]') || document.querySelector('textarea');
  if (!ta) return { found: false };
  const parent = ta.parentElement;
  const grand = parent?.parentElement;
  const buttons = Array.from((grand || document).querySelectorAll('button')).map((b) => ({
    text: b.innerText.trim(),
    cls: b.className,
    aria: b.getAttribute('aria-label') || '',
    title: b.getAttribute('title') || '',
    disabled: b.hasAttribute('disabled')
  }));
  return {
    found: true,
    taClass: ta.className,
    taPlaceholder: ta.getAttribute('placeholder'),
    parentClass: parent?.className || '',
    grandClass: grand?.className || '',
    buttons: buttons.slice(0, 20),
    grandHtml: (grand?.outerHTML || '').slice(0, 6000)
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
