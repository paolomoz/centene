/**
 * product-cards — colored equal-height cards: circle-crop image, h5-style
 * heading, description + Learn More link.
 *
 * Authoring rows (one per card, 4 cells — D10):
 *   image | title | description + link paragraphs | color token
 * (token: cerise / plum / navy, optionally plus `pin-1line` — the ledger's
 * mobile wrap-fork pin for the card whose live description wraps one line
 * further at identical metrics)
 */
const COLORS = ['cerise', 'plum', 'navy', 'sky', 'leaf'];

export default async function decorate(block) {
  const rows = [...block.children];
  const wrap = document.createElement('div');
  wrap.className = 'equal-height';

  rows.forEach((row) => {
    const cells = [...row.children];
    const media = row.querySelector('picture, img');
    if (!media) return;
    const tokens = (cells[3] ? cells[3].textContent.trim().toLowerCase() : '').split(/\s+/);
    const color = tokens.find((t) => COLORS.includes(t)) || 'navy';
    const card = document.createElement('div');
    card.className = `p-card bg-${color}${tokens.includes('pin-1line') ? ' pin-1line' : ''}`;
    const inner = document.createElement('div');

    const imgBox = document.createElement('div');
    imgBox.className = 'card-img-box';
    const p = document.createElement('p');
    const m = media.cloneNode(true);
    const raw = m.tagName === 'IMG' ? m : m.querySelector('img');
    if (raw) {
      raw.classList.add('circle-crop');
      raw.setAttribute('loading', 'lazy');
    }
    p.append(m);
    imgBox.append(p);
    inner.append(imgBox);

    const titleRt = document.createElement('div');
    titleRt.className = 'richtext';
    const h2 = document.createElement('h2');
    const span = document.createElement('span');
    span.className = 'centene-h5';
    span.textContent = cells[1] ? cells[1].textContent.trim() : '';
    h2.append(span);
    titleRt.append(h2);
    inner.append(titleRt);

    if (cells[2]) {
      const lines = cells[2].querySelectorAll('p').length ? [...cells[2].querySelectorAll('p')] : [cells[2]];
      lines.forEach((line) => {
        const text = line.textContent.trim();
        if (!text) return;
        const rt = document.createElement('div');
        rt.className = 'richtext';
        const lp = document.createElement('p');
        const link = line.querySelector('a');
        if (link) {
          rt.classList.add('card-link');
          const b = document.createElement('b');
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = link.textContent.trim();
          b.append(a);
          lp.append(b);
        } else {
          rt.classList.add('card-desc');
          lp.textContent = text;
        }
        rt.append(lp);
        inner.append(rt);
      });
    }

    card.append(inner);
    wrap.append(card);
  });

  block.replaceChildren(wrap);
}
