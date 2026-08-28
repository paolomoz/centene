/**
 * related — Related News cards + See Also rail (reconstructive).
 *
 * Authoring rows, classified by content (#48):
 *   text-only rows = column heads (1st = left/cards head, 2nd = rail head)
 *   rows with a picture = news cards (image cell | linked title cell)
 *   link-only rows after the 2nd head = See Also items
 */
const CHEVRON = '<svg viewBox="0 0 13 23" xmlns="http://www.w3.org/2000/svg"><path d="M1 1 L11 11.5 L1 22" fill="none" stroke="#00aeef" stroke-width="3"/></svg>';

export default async function decorate(block) {
  const rows = [...block.children];
  const heads = [];
  const cards = [];
  const railLinks = [];

  rows.forEach((row) => {
    const media = row.querySelector('picture, img');
    const links = [...row.querySelectorAll('a')];
    const text = row.textContent.trim();
    if (media) {
      const link = links[0];
      const title = row.querySelector('h1,h2,h3,h4');
      cards.push({ media, href: link ? link.href : '#', title: (title || link || { textContent: '' }).textContent.trim() });
    } else if (links.length && heads.length >= 2) {
      links.forEach((a) => railLinks.push(a));
    } else if (links.length && heads.length < 2 && text === links.map((a) => a.textContent.trim()).join('')) {
      links.forEach((a) => railLinks.push(a));
    } else if (text) {
      heads.push(text);
    }
  });

  const root = document.createElement('div');
  root.className = 'relatedcontent';
  root.innerHTML = `
    <div class="related-block">
      <div class="related-row">
        <div class="featured-content">
          <h2></h2>
          <div class="rel-cards"></div>
        </div>
        <div class="see-also">
          <h2></h2>
          <ul></ul>
        </div>
      </div>
    </div>`;
  root.querySelector('.featured-content h2').textContent = heads[0] || '';
  root.querySelector('.see-also h2').textContent = heads[1] || '';

  const cardsEl = root.querySelector('.rel-cards');
  cards.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'rel-card';
    const a = document.createElement('a');
    a.href = c.href;
    const media = c.media.cloneNode(true);
    const img = media.tagName === 'IMG' ? media : media.querySelector('img');
    if (img) img.setAttribute('loading', 'lazy');
    a.append(media);
    const txt = document.createElement('div');
    txt.className = 'text';
    const p = document.createElement('p');
    const ta = document.createElement('a');
    ta.href = c.href;
    ta.textContent = c.title;
    p.append(ta);
    txt.append(p);
    card.append(a, txt);
    cardsEl.append(card);
  });

  const ul = root.querySelector('.see-also ul');
  railLinks.forEach((a) => {
    const li = document.createElement('li');
    const link = a.cloneNode(true);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rcb';
    btn.setAttribute('aria-label', `Go to ${a.textContent.trim()}`);
    btn.addEventListener('click', () => { window.location.href = a.href; });
    const span = document.createElement('span');
    span.innerHTML = CHEVRON;
    btn.append(span);
    li.append(link, btn);
    ul.append(li);
  });

  block.replaceChildren(root);
}
