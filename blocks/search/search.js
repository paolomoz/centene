/**
 * search — site search page (dynamic: client-side query over /site-index.json
 * per dynamic-blocks-map; the live site posts to an AEM search endpoint).
 *
 * Authoring rows: heading text | button label | no-results message.
 * Reads ?q= on load; renders title+description matches.
 */
function render(resultsEl, countEl, items, q) {
  resultsEl.replaceChildren();
  if (!items.length) {
    const p = document.createElement('p');
    p.textContent = resultsEl.dataset.empty;
    resultsEl.append(p);
    countEl.classList.add('hidden-el');
    return;
  }
  countEl.textContent = `${items.length} result${items.length === 1 ? '' : 's'} for "${q}"`;
  countEl.classList.remove('hidden-el');
  items.forEach((it) => {
    const wrap = document.createElement('div');
    wrap.className = 'search-result';
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = it.path;
    a.textContent = it.title || it.path;
    h3.append(a);
    const p = document.createElement('p');
    p.textContent = it.description || '';
    wrap.append(h3, p);
    resultsEl.append(wrap);
  });
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
    <div class="pagination-wrap"><nav aria-label="Search pagination"><ul class="search-pagination hidden-el"></ul></nav></div>`;

  root.querySelector('h1').textContent = heading;
  root.querySelector('#search-button').textContent = btnLabel;
  const resultsEl = root.querySelector('#search-results');
  resultsEl.dataset.empty = emptyMsg;
  const countEl = root.querySelector('.search-count');
  const input = root.querySelector('#search-page');

  let index = null;
  const run = async (q) => {
    if (!q) { render(resultsEl, countEl, [], q); return; }
    if (!index) {
      try {
        const resp = await fetch('/site-index.json');
        index = resp.ok ? (await resp.json()).data || [] : [];
      } catch { index = []; }
    }
    const needle = q.toLowerCase();
    const items = index.filter((it) => `${it.title} ${it.description} ${it.path}`.toLowerCase().includes(needle));
    render(resultsEl, countEl, items, q);
  };

  root.querySelector('#search-button').addEventListener('click', () => run(input.value.trim()));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(input.value.trim()); });

  const q = new URLSearchParams(window.location.search).get('q') || '';
  input.value = q;
  run(q);

  block.replaceChildren(root);
}
