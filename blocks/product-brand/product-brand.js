/**
 * product-brand — state-page product-brand band (template-slotted replica).
 * Variants: `struts` (two source struts after the learn-more line — wellcare),
 * `ambetter` (mobile wrap-fork pin, see CSS).
 *
 * Authoring rows:
 *   1. brand name (text) — the h2
 *   2. three cells: logo image | description + learn-more link paragraphs | bullet list
 */
function externalize(a) {
  if (a.querySelector('i.link-external')) return a;
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
  const out = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const media = row.querySelector('picture, img');
    if (!media && cells.length === 1 && !row.querySelector('ul')) {
      const rt = document.createElement('div');
      rt.className = 'richtext bb-head';
      const h2 = document.createElement('h2');
      const s1 = document.createElement('span');
      s1.className = 'centene-h2';
      const s2 = document.createElement('span');
      s2.className = 'brand-color';
      s2.textContent = row.textContent.trim();
      s1.append(s2);
      h2.append(s1);
      rt.append(h2);
      out.push(rt);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'row bb-row';
    cells.forEach((cell) => {
      const col = document.createElement('div');
      col.className = 'colctrl-40';
      const img = cell.querySelector('picture, img');
      const list = cell.querySelector('ul, ol');
      if (img) {
        cell.querySelectorAll('picture, img').forEach((media0) => {
          if (media0.tagName === 'IMG' && media0.closest('picture')) return;
          const wrap = document.createElement('div');
          wrap.className = 'image';
          const cmp = document.createElement('div');
          cmp.className = 'cmp-image';
          const media2 = media0.cloneNode(true);
          const raw = media2.tagName === 'IMG' ? media2 : media2.querySelector('img');
          if (raw) {
            raw.classList.add('box-shadow');
            raw.setAttribute('loading', 'lazy');
          }
          cmp.append(media2);
          wrap.append(cmp);
          col.append(wrap);
        });
      } else if (list) {
        const rt = document.createElement('div');
        rt.className = 'richtext bb-list';
        rt.append(list.cloneNode(true));
        col.append(rt);
      } else {
        const lines = cell.querySelectorAll('p').length ? [...cell.querySelectorAll('p')] : [cell];
        lines.forEach((line) => {
          const text = line.textContent.trim();
          if (!text) return;
          const rt = document.createElement('div');
          const p = document.createElement('p');
          const span = document.createElement('span');
          span.className = 'rd-t-16';
          const link = line.querySelector('a');
          if (link) {
            rt.className = 'richtext learn-more';
            const a = document.createElement('a');
            a.href = link.href;
            const b = document.createElement('b');
            const i = document.createElement('i');
            const s = document.createElement('span');
            s.className = 'brand-color';
            s.textContent = link.textContent.trim();
            i.append(s);
            b.append(i);
            a.append(b);
            externalize(a);
            span.append(a);
          } else {
            rt.className = 'richtext bb-desc';
            span.textContent = text;
          }
          p.append(span);
          rt.append(p);
          col.append(rt);
        });
      }
      grid.append(col);
    });
    out.push(grid);
  });

  block.replaceChildren(...out);
}
