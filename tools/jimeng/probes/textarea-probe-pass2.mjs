import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1200);
const data = await page.evaluate(() => {
  const ta = document.querySelector('textarea[placeholder*="Seedance"]') || document.querySelector('textarea');
  if (!ta) return { found: false };
  let node = ta;
  let lvl = 0;
  const chain = [];
  let target = null;
  while (node && lvl < 12) {
    const btns = node.querySelectorAll ? node.querySelectorAll('button') : [];
    chain.push({
      lvl,
      tag: node.tagName,
      cls: node.className || '',
      btnCount: btns.length
    });
    if (btns.length > 0 && !target) target = node;
    node = node.parentElement;
    lvl += 1;
  }
  const btns = target ? Array.from(target.querySelectorAll('button')).map((b) => ({
    text: b.innerText.trim(),
    aria: b.getAttribute('aria-label') || '',
    title: b.getAttribute('title') || '',
    cls: b.className,
    disabled: b.hasAttribute('disabled')
  })).slice(0, 40) : [];
  return {
    found: true,
    chain,
    targetClass: target?.className || '',
    targetTag: target?.tagName || '',
    buttons: btns,
    targetHtml: (target?.outerHTML || '').slice(0, 12000)
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
