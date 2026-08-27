// Render the lift outline as compact per-section text files for authoring.
import fs from 'node:fs';
import path from 'node:path';

const W = process.argv[2] || '1440';
const DIR = process.argv[3] || 'stardust/replica/capture';
const d = JSON.parse(fs.readFileSync(`${DIR}/lift-${W}.json`, 'utf8'));
const outDir = `${DIR}/sections-${W}`;
fs.mkdirSync(outDir, { recursive: true });

const line = (n, pre) => {
  const cls = (n.cls || '').split(/\s+/).filter(c => !c.startsWith('aem-')).slice(0, 4).join('.');
  const s = n.style || {};
  const bits = [];
  if (n.rect) bits.push(`@${n.rect.join(',')}`);
  if (s.hidden) bits.push('HIDDEN');
  if (s.d && s.d !== 'block') bits.push(s.d + (s.fd && s.fd !== 'row' ? ':' + s.fd : ''));
  if (s.pos && s.pos !== 'static') bits.push(s.pos);
  if (s.ff) bits.push(`${s.ff} ${s.fs}/${s.lh} w${s.fw}${s.tt && s.tt !== 'none' ? ' ' + s.tt : ''}${s.ls && s.ls !== 'normal' ? ' ls:' + s.ls : ''}`);
  if (s.col) bits.push('c:' + s.col);
  if (s.bg && s.bg !== 'rgba(0, 0, 0, 0)') bits.push('bg:' + s.bg);
  if (s.bgi) bits.push('bgi:' + s.bgi.slice(0, 120));
  if (s.pad && s.pad !== '0px') bits.push('p:' + s.pad);
  if (s.mar && s.mar !== '0px') bits.push('m:' + s.mar);
  if (s.mw && s.mw !== 'none') bits.push('mw:' + s.mw);
  if (s.br && s.br !== '0px') bits.push('r:' + s.br);
  if (s.bor) bits.push('bor:' + s.bor);
  if (s.bsh) bits.push('sh:' + s.bsh);
  if (s.gap) bits.push('gap:' + s.gap);
  if (s.gtc) bits.push('cols:' + s.gtc);
  if (s.jc && s.jc !== 'normal' && s.jc !== 'flex-start') bits.push('jc:' + s.jc);
  if (s.ai && s.ai !== 'normal' && s.ai !== 'stretch') bits.push('ai:' + s.ai);
  if (s.ta && s.ta !== 'start' && s.ta !== 'left') bits.push('ta:' + s.ta);
  let head = n.tag + (n.id ? '#' + n.id : '') + (cls ? '.' + cls : '');
  if (n.href) head += ` href=${n.href}`;
  if (n.src) head += ` src=${n.src}`;
  if (n.alt !== undefined) head += ` alt="${n.alt}"`;
  let out = pre + head + '  [' + bits.join(' | ') + ']';
  if (n.text) out += `\n${pre}  «${n.text}»`;
  return out;
};

const render = (n, pre = '') => {
  let out = line(n, pre) + '\n';
  for (const c of n.children || []) out += render(c, pre + '  ');
  return out;
};

fs.writeFileSync(path.join(outDir, 'header.txt'), render(d.outline.header || d.outline.main.children.find(c => c.tag === 'header')));
const mainKids = d.outline.main.children;
const header = mainKids.find(c => c.tag === 'header');
if (header) fs.writeFileSync(path.join(outDir, 'header.txt'), render(header));
const footer = mainKids.find(c => c.tag === 'footer');
if (footer) fs.writeFileSync(path.join(outDir, 'footer.txt'), render(footer));
const content = mainKids.find(c => (c.cls || '').includes('rd-ambetter-content')) || mainKids.find(c => c.tag === 'div' && c.children);
// walk for the widest aem-Grid whose children are the section blocks
let grid = null;
const walk = (n) => {
  if (!grid && (n.cls || '').includes('aem-Grid') && (n.children || []).length > 1) { grid = n; return; }
  (n.children || []).forEach(walk);
};
walk(content);
if (!grid) { // fallback: deepest single-chain descent to a multi-child node
  let n = content;
  while (n.children && n.children.length === 1) n = n.children[0];
  grid = n;
}
grid.children.forEach((sec, i) => {
  const name = (sec.cls || '').split(/\s+/)[0] || sec.tag;
  fs.writeFileSync(path.join(outDir, `${String(i).padStart(2, '0')}-${name}.txt`), render(sec));
});
console.log(fs.readdirSync(outDir).map(f => `${f} ${fs.statSync(path.join(outDir, f)).size}b`).join('\n'));
