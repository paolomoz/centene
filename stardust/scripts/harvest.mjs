// Replica Phase-3 CSS lift for centene.com home.
// Captures: stylesheet bodies + font files (response intercept), per-element
// computed styles + geometry at a given viewport width, and a trimmed DOM
// outline of header/main/footer for granularity/role parity.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const WIDTH = parseInt(process.argv[2] || '1440', 10);
const OUT = process.argv[3] || `stardust/replica/capture`;
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 900 },
  deviceScaleFactor: 1,
  userAgent: UA,
  locale: 'en-US',
});
const page = await ctx.newPage();
await page.emulateMedia({ reducedMotion: 'reduce' });

const cssFiles = [];
page.on('response', async (res) => {
  try {
    const url = res.url();
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    if (ct.includes('text/css') || url.match(/\.css(\?|$)/)) {
      const body = await res.text();
      const name = url.replace(/[?#].*$/, '').split('/').pop() || 'inline.css';
      const file = path.join(OUT, 'css', `${cssFiles.length}-${name}`);
      fs.writeFileSync(file, body);
      cssFiles.push({ url, file, bytes: body.length });
    } else if (url.match(/\.(woff2?|ttf|otf)(\?|$)/) || ct.includes('font')) {
      const buf = await res.body();
      const name = url.replace(/[?#].*$/, '').split('/').pop();
      fs.writeFileSync(path.join(OUT, 'fonts', name), buf);
    }
  } catch {}
});

await page.goto('https://www.centene.com/', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(2500);

// consent dismissal: click anything matching Accept/Decline in a cookie bar
try {
  const btn = page.locator('button:has-text("Accept"), a:has-text("Accept")').first();
  if (await btn.isVisible({ timeout: 2000 })) { await btn.click(); await page.waitForTimeout(500); }
} catch {}
// park pointer
await page.mouse.move(0, 0);

// scroll settle for lazy content
await page.evaluate(async () => {
  const h = () => document.body.scrollHeight;
  for (let y = 0; y < h(); y += window.innerHeight) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 250));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 400));
});

const PROPS = [
  'display','position','top','zIndex','maxWidth','width','height','margin','padding',
  'fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textTransform','textAlign',
  'color','backgroundColor','backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat',
  'borderRadius','border','borderTop','borderBottom','boxShadow','opacity',
  'flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','objectFit','overflow',
  'textRendering','webkitFontSmoothing','fontSynthesis','textDecoration','verticalAlign','float',
];

const data = await page.evaluate(({ PROPS, WIDTH }) => {
  const pick = (el) => {
    const cs = getComputedStyle(el);
    const o = {};
    for (const p of PROPS) o[p] = cs[p.replace(/webkit/, 'webkit')] ?? cs.getPropertyValue(p.replace(/([A-Z])/g, '-$1').toLowerCase());
    const r = el.getBoundingClientRect();
    o._rect = { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    return o;
  };
  const brief = (el, depth, maxDepth) => {
    const node = {
      tag: el.tagName.toLowerCase(),
      cls: el.className && typeof el.className === 'string' ? el.className.trim().slice(0, 200) : '',
      id: el.id || undefined,
    };
    const ownText = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
    if (ownText) node.text = ownText.slice(0, 200);
    if (el.tagName === 'A') node.href = el.getAttribute('href');
    if (el.tagName === 'IMG') { node.src = el.currentSrc || el.src; node.alt = el.alt; }
    if (el.tagName === 'IFRAME') { node.src = el.src; node.title = el.title; }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    node.rect = [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)];
    node.style = {
      d: cs.display, pos: cs.position, ff: cs.fontFamily.split(',')[0], fs: cs.fontSize, fw: cs.fontWeight,
      lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, col: cs.color, bg: cs.backgroundColor,
      bgi: cs.backgroundImage === 'none' ? undefined : cs.backgroundImage.slice(0, 300),
      br: cs.borderRadius, pad: cs.padding, mar: cs.margin, mw: cs.maxWidth, bsh: cs.boxShadow === 'none' ? undefined : cs.boxShadow,
      bor: cs.border && cs.border !== '0px none rgb(0, 0, 0)' ? cs.border : undefined,
      ta: cs.textAlign, gap: cs.gap !== 'normal' ? cs.gap : undefined,
      gtc: cs.gridTemplateColumns !== 'none' ? cs.gridTemplateColumns : undefined,
      fd: cs.display.includes('flex') ? cs.flexDirection : undefined,
      jc: cs.display.includes('flex') || cs.display.includes('grid') ? cs.justifyContent : undefined,
      ai: cs.display.includes('flex') || cs.display.includes('grid') ? cs.alignItems : undefined,
      hidden: (cs.display === 'none' || cs.visibility === 'hidden') || undefined,
    };
    for (const k of Object.keys(node.style)) if (node.style[k] === undefined) delete node.style[k];
    if (depth < maxDepth) {
      const kids = Array.from(el.children).filter(k => !['SCRIPT','STYLE','NOSCRIPT','LINK'].includes(k.tagName));
      if (kids.length) node.children = kids.map(k => brief(k, depth + 1, maxDepth));
    }
    return node;
  };

  const result = { width: WIDTH, url: location.href };
  result.html = { lang: document.documentElement.lang };
  result.bodyStyle = pick(document.body);
  const header = document.querySelector('header') || document.querySelector('[class*="header"]');
  const main = document.querySelector('main') || document.body;
  const footer = document.querySelector('footer') || document.querySelector('[class*="footer"]');
  result.mainSelector = main === document.body ? 'body' : (main.id ? `#${main.id}` : 'main' + (main.className ? '.' + String(main.className).trim().split(/\s+/).join('.') : ''));
  result.outline = {
    header: header ? brief(header, 0, 16) : null,
    main: brief(main, 0, 28),
    footer: footer ? brief(footer, 0, 16) : null,
  };
  // font faces actually loaded
  result.fontsLoaded = Array.from(document.fonts).map(f => ({ family: f.family, weight: f.weight, style: f.style, status: f.status }));
  result.docHeight = document.body.scrollHeight;
  return result;
}, { PROPS, WIDTH });

fs.writeFileSync(path.join(OUT, `lift-${WIDTH}.json`), JSON.stringify(data, null, 1));
fs.writeFileSync(path.join(OUT, `css-manifest-${WIDTH}.json`), JSON.stringify(cssFiles, null, 1));
console.log(`lift-${WIDTH}.json written; docHeight=${data.docHeight}; main=${data.mainSelector}; css files=${cssFiles.length}; fonts loaded=${data.fontsLoaded.length}`);
await browser.close();
