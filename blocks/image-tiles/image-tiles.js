/**
 * image-tiles — colored link tiles with title + chevron pill (reconstructive).
 *
 * Authoring rows (one per tile): link cell | color token cell
 * (token: leaf / sky / plum / carrot / cerise — the source site's tile
 * background palette; the title is the link text)
 */
const CHEVRON = '<svg viewBox="0 0 13 23" xmlns="http://www.w3.org/2000/svg"><path d="M1 1 L11 11.5 L1 22" fill="none" stroke="#fff" stroke-width="3"/></svg>';
const COLORS = ['leaf', 'sky', 'plum', 'carrot', 'cerise'];

export default async function decorate(block) {
  const rows = [...block.children];
  const rowEl = document.createElement('div');
  rowEl.className = 'tiles-row';

  rows.forEach((row) => {
    const link = row.querySelector('a');
    if (!link) return;
    const img = row.querySelector('picture img, img');
    const token = [...row.children].map((c) => c.textContent.trim().toLowerCase()).find((t) => COLORS.includes(t)) || 'sky';
    const tile = document.createElement('div');
    tile.className = 'image-link-tile';
    const a = document.createElement('a');
    a.href = link.href;
    a.setAttribute('aria-label', link.textContent.trim());
    const box = document.createElement('div');
    box.className = img ? 'img-container tile-photo' : `img-container tile-${token}`;
    if (img) box.style.backgroundImage = `url("${(img.currentSrc || img.src).replace(/width=\d+/, 'width=2000')}")`;
    const content = document.createElement('div');
    content.className = 'tile-content';
    const title = document.createElement('p');
    title.className = 'title';
    title.textContent = link.textContent.trim();
    const btn = document.createElement('div');
    btn.className = 'short-button';
    const arrow = document.createElement('div');
    arrow.className = 'arrow';
    arrow.innerHTML = CHEVRON;
    btn.append(arrow);
    content.append(title, btn);
    box.append(content);
    a.append(box);
    tile.append(a);
    rowEl.append(tile);
  });

  block.replaceChildren(rowEl);
}
