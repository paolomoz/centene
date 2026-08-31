/**
 * search — site search page (dynamic: client-side query over /site-index.json
 * per dynamic-blocks-map; the live site posts to an AEM search endpoint).
 *
 * Matching mirrors the source behavior: full text (indexed `text` field) plus
 * title/description; title matches rank first. Results render the source
 * design (h2 + description + `Visit "Title"` anchor), 10 per page.
 *
 * Authoring rows: heading text | button label | no-results message.
 */
const PAGE_SIZE = 10;

function render(root, items, q, page) {
  const resultsEl = root.querySelector('#search-results');
  const countEl = root.querySelector('.search-count');
  const pager = root.querySelector('.search-pagination');
  resultsEl.replaceChildren();
  pager.replaceChildren();
  if (!items.length) {
    const p = document.createElement('p');
    p.textContent = resultsEl.dataset.empty;
    resultsEl.append(p);
    countEl.classList.add('hidden-el');
    return;
  }
  const start = page * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);
  countEl.textContent = `Showing ${start + 1} - ${start + slice.length} of ${items.length} results`;
  countEl.classList.remove('hidden-el');
  slice.forEach((it) => {
    const wrap = document.createElement('div');
    wrap.className = 'search-result';
    const title = (it.title || it.path).split('|')[0].trim();
    const h2 = document.createElement('h2');
    h2.textContent = title;
    const p = document.createElement('p');
    p.textContent = it.description || (it.text ? `${it.text.split(' ').slice(0, 30).join(' ')}…` : '');
    const a = document.createElement('a');
    a.className = 'block-anchor';
    a.href = it.path;
    a.textContent = `Visit "${title}"`;
    wrap.append(h2, p, a);
    resultsEl.append(wrap);
  });
  const pages = Math.ceil(items.length / PAGE_SIZE);
  if (pages > 1) {
    for (let i = 0; i < pages; i += 1) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = i + 1;
      if (i === page) li.className = 'active';
      btn.addEventListener('click', () => { render(root, items, q, i); window.scrollTo({ top: 0 }); });
      li.append(btn);
      pager.append(li);
    }
  }
}

export default async function decorate(block) {
  const rows = [...block.children].map((r) => r.textContent.trim());
  const [heading = 'Search Results for:', btnLabel = 'Search', emptyMsg = 'No results were found. Please modify your search.'] = rows;

  const root = document.createElement('div');
  root.className = 's-col';
  root.innerHTML = `
    <div class="centenedotcom-search">
      <h1 class="search-term-display"></h1>
      <div class="search-input"><div class="s-row">
        <div class="s-input-col">
          <label class="sr-only" for="search-page">Search</label>
          <input id="search-page" class="search-page" type="text">
        </div>
        <div class="s-btn-col"><button id="search-button" class="btn site-btn" type="button"></button></div>
        <div class="s-count-col"><h3 class="search-count hidden-el"></h3></div>
      </div></div>
    </div>
    <div class="spinner-container"><div id="spinner" class="search-spinner"></div></div>
    <div id="search-results"></div>
    <div class="pagination-wrap"><nav aria-label="Search pagination"><ul class="search-pagination"></ul></nav></div>`;

  root.querySelector('h1').textContent = heading;
  root.querySelector('#search-button').textContent = btnLabel;
  root.querySelector('#search-results').dataset.empty = emptyMsg;
  const input = root.querySelector('#search-page');

  let index = null;
  const run = async (q) => {
    if (!q) { render(root, [], q, 0); return; }
    if (!index) {
      try {
        const resp = await fetch('/site-index.json?limit=500');
        index = resp.ok ? (await resp.json()).data || [] : [];
      } catch { index = []; }
    }
    const needle = q.toLowerCase();
    const scored = [];
    index.forEach((it) => {
      const title = (it.title || '').toLowerCase();
      const desc = (it.description || '').toLowerCase();
      const text = (it.text || '').toLowerCase();
      let score = 0;
      if (title.includes(needle)) score = 3;
      else if (desc.includes(needle)) score = 2;
      else if (text.includes(needle)) score = 1;
      if (score) scored.push({ ...it, score });
    });
    scored.sort((x, y) => y.score - x.score);
    render(root, scored, q, 0);
  };

  root.querySelector('#search-button').addEventListener('click', () => run(input.value.trim()));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(input.value.trim()); });

  const q = new URLSearchParams(window.location.search).get('q') || '';
  input.value = q;
  run(q);

  block.replaceChildren(root);
}
