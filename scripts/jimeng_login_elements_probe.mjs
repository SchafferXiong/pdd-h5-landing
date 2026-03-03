import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
await page.goto('https://jimeng.jianying.com/ai-tool/home', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForTimeout(2000);
const list = await page.evaluate(() => {
  const out = [];
  const nodes = Array.from(document.querySelectorAll('*'));
  for (const el of nodes) {
    const txt = (el.textContent || '').replace(/\s+/g,' ').trim();
    if (!txt || !txt.includes('登录')) continue;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0 || r.width < 4 || r.height < 4) continue;
    out.push({tag: el.tagName, text: txt.slice(0,80), left:r.left, top:r.top, w:r.width, h:r.height, cls: (el.className||'').toString().slice(0,80)});
  }
  out.sort((a,b)=>a.top-b.top);
  return out.slice(0,120);
});
console.log(JSON.stringify(list, null, 2));
await page.screenshot({path:'/tmp/jimeng_login_elements_probe.png', fullPage:false});
await browser.close();
