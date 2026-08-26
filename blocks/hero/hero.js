/**
 * hero — centene.com homepage banner (template-slotted replica).
 * Schema: stardust/eds-schema/index.json § hero.
 *
 * Authoring rows (simple shape, one property per row):
 *   1. banner image (editorial — authored <img>/<picture>)
 *   2. tagline paragraph (bold run authored as <strong>)
 *
 * The banner renders as a background layer (mirrors the source site's
 * .hero-img background-image treatment); the authored img supplies the URL.
 */
export default async function decorate(block) {
  const img = block.querySelector('picture img, img');
  const src = img ? img.currentSrc || img.src : '';
  // tagline: the last link-free paragraph-ish cell text (query, not index)
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const textCell = cells.find((c) => c.textContent.trim() && !c.querySelector('img, picture'));

  const body = document.createElement('div');
  body.className = 'homepagebanner-body';

  const mobileImg = document.createElement('div');
  mobileImg.className = 'hero-img-mobile';

  const heroImg = document.createElement('div');
  heroImg.className = 'hero-img';
  if (src) {
    heroImg.style.backgroundImage = `url("${src}")`;
    mobileImg.style.backgroundImage = `url("${src}")`;
  }
  if (img) {
    // LCP: the banner is the largest first-viewport paint — keep it eager
    img.setAttribute('loading', 'eager');
    img.setAttribute('fetchpriority', 'high');
  }

  const p = document.createElement('p');
  if (textCell) {
    const innerP = textCell.querySelector('p');
    [...(innerP || textCell).childNodes].forEach((n) => p.append(n.cloneNode(true)));
  }

  const text = document.createElement('div');
  text.className = 'hero-text';
  const container = document.createElement('div');
  container.className = 'hero-container';
  const row = document.createElement('div');
  row.className = 'hero-row';
  const col = document.createElement('div');
  col.className = 'hero-col';
  const content = document.createElement('div');
  content.className = 'hero-content';
  const inner = document.createElement('div');
  inner.append(p);
  content.append(inner);
  col.append(content);
  row.append(col);
  container.append(row);
  text.append(container);
  body.append(heroImg, text);

  block.replaceChildren(mobileImg, body);
}
