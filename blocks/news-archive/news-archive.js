/**
 * news-archive — featured-stories archive grid (dynamic: /news-index.json,
 * category centene:featured, newest first, 12 per page with pagination —
 * mirroring the source's AJAX newsfeed).
 *
 * Authoring rows: optional fallback cards (image | linked title | date),
 * used only when the index is empty/unreachable.
 */
const PAGE_SIZE = 12;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function cardEl({ href, imgEl, title, date }) {
  const col = document.createElement('div');
  col.className = 'news-col';
  const box = document.createElement('div');
  box.className = 'column-box';
  const a = document.createElement('a');
  a.href = href;
  const imgWrap = document.createElement('div');
  imgWrap.className = 'news-card-image';
  if (imgEl) imgWrap.append(imgEl);
  const h3 = document.createElement('h3');
  h3.className = 'news-card-title';
  h3.textContent = title;
  a.append(imgWrap, h3);
  const content = document.createElement('div');
  content.className = 'news-card-content';
  const span = document.createElement('span');
  span.textContent = date;
  content.append(span);
  box.append(a, content);
  col.append(box);
  return col;
}

export default async function decorate(block) {
  const fallback = [...block.children].map((row) => {
    const media = row.querySelector('picture, img');
    const link = row.querySelector('a');
    return media && link ? {
      href: link.href,
      imgEl: media.cloneNode(true),
      title: link.textContent.trim(),
      date: ([...row.children].pop() || { textContent: '' }).textContent.trim(),
    } : null;
  }).filter(Boolean);

  const root = document.createElement('div');
  root.innerHTML = `
    <div class="news-grid"></div>
    <div class="pagination-container"><nav aria-label="Page navigation"><ul class="search-pagination"></ul></nav></div>`;
  const grid = root.querySelector('.news-grid');
  const pager = root.querySelector('.search-pagination');

  let items = fallback;
  try {
    const resp = await fetch('/news-index.json?limit=500');
    if (resp.ok) {
      const { data } = await resp.json();
      const fromIndex = (data || [])
        .filter((it) => it.category === 'centene:featured' && it.publisheddate)
        .sort((x, y) => new Date(y.publisheddate) - new Date(x.publisheddate))
        .map((it) => {
          const img = document.createElement('img');
          img.src = it.image;
          img.alt = it.title;
          img.setAttribute('loading', 'lazy');
          return {
            href: it.path, imgEl: img, title: it.title, date: formatDate(it.publisheddate),
          };
        });
      if (fromIndex.length) items = fromIndex;
    }
  } catch { /* fallback stays */ }

  const renderPage = (n) => {
    grid.replaceChildren(...items.slice(n * PAGE_SIZE, (n + 1) * PAGE_SIZE).map(cardEl));
    const pages = Math.ceil(items.length / PAGE_SIZE);
    pager.replaceChildren();
    for (let i = 0; i < pages; i += 1) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = i + 1;
      if (i === n) li.className = 'active';
      btn.addEventListener('click', () => { renderPage(i); window.scrollTo({ top: 0 }); });
      li.append(btn);
      pager.append(li);
    }
    if (pages < 2) pager.parentElement.parentElement.classList.add('hidden-el');
  };
  renderPage(0);

  block.replaceChildren(root);
}
