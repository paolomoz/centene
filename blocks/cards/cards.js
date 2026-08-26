/**
 * cards — Featured Stories news grid (reconstructive).
 * Schema: stardust/eds-schema/index.json § cards.
 *
 * Section head ("Featured Stories") is DEFAULT CONTENT in the section,
 * styled in place via .cards-container .default-content-wrapper (D1).
 *
 * Authoring rows (container shape — one row per card):
 *   card row:  image cell | title cell (<h3><a>…</a></h3>) | date cell
 *   CTA row:   a single link-only cell (<strong><a>View All News</a></strong>)
 *
 * Decode is defensive (#48/#52/#62/#104): rows are classified by content —
 * a row whose only content is a button/link is the CTA band; anything else
 * with a heading or image is a card. wrapTextNodes-folded media cells are
 * expanded back.
 */

function expandCell(cell) {
  // #104: wrapTextNodes folds media-led mixed cells into one <p>
  let kids = [...cell.children];
  if (kids.length === 1 && kids[0].tagName === 'P' && kids[0].children.length
      && kids[0].querySelector('picture, img')) {
    kids = [...kids[0].childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
  }
  return kids.length ? kids : [cell];
}

export default async function decorate(block) {
  const rows = [...block.children];
  const grid = document.createElement('div');
  grid.className = 'news-grid';
  let ctaRow = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    const hasMedia = row.querySelector('picture, img');
    const heading = row.querySelector('h1, h2, h3, h4');
    const links = [...row.querySelectorAll('a')];
    const textLen = row.textContent.trim().length;

    if (!hasMedia && !heading && links.length && textLen === links.map((a) => a.textContent.trim()).join('').replace(/\s+/g, ' ').length) {
      // link-only row = the CTA band
      ctaRow = row;
      return;
    }
    if (!hasMedia && !heading && !textLen) return;

    const col = document.createElement('div');
    col.className = 'news-col';
    const box = document.createElement('div');
    box.className = 'column-box';

    // classify parts across all cells (order-agnostic, #53/#72)
    let media = null;
    let title = null;
    let dateText = '';
    cells.forEach((cell) => {
      expandCell(cell).forEach((el) => {
        if (!media && (el.matches?.('picture, img') || el.querySelector?.('picture, img'))) {
          media = el.matches('picture, img') ? el : el.querySelector('picture, img');
        } else if (!title && (el.matches?.('h1,h2,h3,h4') || el.querySelector?.('h1,h2,h3,h4'))) {
          title = el.matches('h1,h2,h3,h4') ? el : el.querySelector('h1,h2,h3,h4');
        } else if (el.textContent && el.textContent.trim()) {
          dateText = dateText || el.textContent.trim();
        }
      });
    });

    const link = title ? title.querySelector('a') : row.querySelector('a');
    const a = document.createElement('a');
    if (link) a.href = link.href;

    const mediaBox = document.createElement('div');
    mediaBox.className = 'news-card-image';
    if (media) {
      const img = media.matches('img') ? media : media.querySelector('img');
      if (img) img.setAttribute('loading', 'lazy');
      mediaBox.append(media.cloneNode(true));
    }

    const h3 = document.createElement('h3');
    h3.className = 'news-card-title';
    if (title) {
      const inner = title.querySelector('a') || title;
      [...inner.childNodes].forEach((n) => h3.append(n.cloneNode(true)));
    }

    a.append(mediaBox, h3);
    box.append(a);

    const content = document.createElement('div');
    content.className = 'news-card-content';
    const span = document.createElement('span');
    span.textContent = dateText;
    content.append(span);
    box.append(content);

    col.append(box);
    grid.append(col);
  });

  const out = [grid];

  if (ctaRow) {
    const band = document.createElement('div');
    band.className = 'cta-band';
    band.innerHTML = `
      <div class="colctrl-50">
        <div class="richtext-spacer"><p><br>\n </p></div>
        <div class="richtext-spacer"><p><br>\n </p></div>
      </div>
      <div class="colctrl-50"><div class="cta-inner">
        <div class="colctrl-60"><div class="richtext-spacer"><p><br>\n </p></div></div>
        <div class="colctrl-40"><div class="button"></div></div>
      </div></div>`;
    const cta = ctaRow.querySelector('a');
    if (cta) band.querySelector('.button').append(cta.cloneNode(true));
    out.push(band);
  }

  block.replaceChildren(...out);
}
