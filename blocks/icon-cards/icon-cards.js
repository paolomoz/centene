/**
 * icon-cards — 3-up icon card band (reconstructive).
 * Variants: `how` (h2 head + link line), `facts` (h5 eyebrow head — state pages).
 *
 * Authoring rows:
 *   leading no-image rows = the head (heading text / link line / eyebrow)
 *   image rows = cards: icon cell | bold title cell | text cell(s)
 * Head is collected whole (#56); cards classified by content (#48).
 */
function externalize(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (/^(jobs|investors)\./.test(url.hostname)
      || (!/centene\.com$/.test(url.hostname) && !/aem\.(page|live)$/.test(url.hostname) && url.hostname !== 'localhost')) {
      const i = document.createElement('i');
      i.className = 'link-external';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = 'External Link';
      a.append(i, sr);
    }
  } catch { /* relative = internal */ }
  return a;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const isFacts = block.classList.contains('facts');
  const head = document.createElement('div');
  const grid = document.createElement('div');
  grid.className = 'row ic-grid';

  rows.forEach((row) => {
    const media = row.querySelector('picture, img');
    if (!media) {
      // head row: heading or link line
      const h = row.querySelector('h1, h2, h3, h4');
      const rt = document.createElement('div');
      rt.className = 'richtext';
      if (h && !isFacts) {
        const h2 = document.createElement('h2');
        const s1 = document.createElement('span');
        s1.className = 'brand-color';
        const s2 = document.createElement('span');
        s2.className = 'centene-h2';
        s2.textContent = h.textContent.trim();
        s1.append(s2);
        h2.append(s1);
        rt.append(h2);
        rt.classList.add('rt-indent');
      } else if (h && isFacts) {
        const p = document.createElement('p');
        const s1 = document.createElement('span');
        s1.className = 'centene-h5';
        const s2 = document.createElement('span');
        s2.className = 'brand-color';
        s2.textContent = h.textContent.trim();
        s1.append(s2);
        p.append(s1);
        rt.append(p);
      } else if (row.textContent.trim()) {
        const p = document.createElement('p');
        p.className = 'link-line';
        const cell = row.querySelector(':scope > div') || row;
        const inner = cell.querySelector('p') || cell;
        [...inner.childNodes].forEach((n) => p.append(n.cloneNode(true)));
        p.querySelectorAll('a').forEach((a) => externalize(a));
        rt.append(p);
      } else return;
      head.append(rt);
      return;
    }
    // card row: icon | title | text lines
    const col = document.createElement('div');
    col.className = 'colctrl-40';
    const card = document.createElement('div');
    card.className = 'richtext icon-card';
    const cells = [...row.children];
    const iconP = document.createElement('p');
    const icon = media.cloneNode(true);
    const rawImg = icon.tagName === 'IMG' ? icon : icon.querySelector('img');
    if (rawImg) { rawImg.setAttribute('loading', 'lazy'); }
    iconP.append(icon);
    card.append(iconP);
    let first = true;
    cells.forEach((cell) => {
      if (cell.querySelector('picture, img')) return;
      const lines = cell.querySelectorAll('p').length ? [...cell.querySelectorAll('p')] : [cell];
      lines.forEach((line) => {
        const text = line.textContent.trim();
        if (!text) return;
        const p = document.createElement('p');
        if (first) {
          const b = document.createElement('b');
          const s = document.createElement('span');
          s.className = 'brand-color';
          s.textContent = text;
          b.append(s);
          p.append(b);
          first = false;
        } else if (isFacts) {
          const s = document.createElement('span');
          s.className = 'rd-t-16';
          if (line.querySelector('em, i') || /^\*/.test(text)) {
            const i = document.createElement('i');
            i.textContent = text;
            s.append(i);
          } else s.textContent = text;
          p.append(s);
        } else {
          p.textContent = text;
        }
        card.append(p);
      });
    });
    col.append(card);
    grid.append(col);
  });

  block.replaceChildren(head, grid);
}
