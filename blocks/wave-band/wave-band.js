/**
 * wave-band — navy wave banner: tagline + intro (left 2/3) and the
 * Browse-by-State selector (right 1/3). Bespoke interactive composition.
 *
 * Authoring rows:
 *   1. tagline paragraph + intro paragraph(s) (one cell)
 *   2. heading (h2) | state links list (ul of links → rendered as a <select>)
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const textRow = rows[0];
  const stateRow = rows[1] || textRow;

  const root = document.createElement('div');
  root.className = 'row wb-row';
  root.innerHTML = `
    <div class="colctrl-66"><div class="richtext"><div class="w-inner"></div></div></div>
    <div class="colctrl-33">
      <div class="richtext"><h2><span class="centene-h5"></span></h2></div>
      <div class="statemap"></div>
    </div>`;

  const inner = root.querySelector('.w-inner');
  if (textRow) {
    const ps = textRow.querySelectorAll('p').length ? [...textRow.querySelectorAll('p')] : [textRow];
    ps.forEach((line, i) => {
      const text = line.textContent.trim();
      if (!text) return;
      const p = document.createElement('p');
      if (i === 0) {
        const span = document.createElement('span');
        span.className = 'centene-h4 lead-br';
        span.textContent = text;
        p.append(span);
      } else {
        p.textContent = text;
      }
      inner.append(p);
    });
  }

  const heading = stateRow.querySelector('h1, h2, h3');
  root.querySelector('.centene-h5').textContent = heading ? heading.textContent.trim() : 'Browse by State';

  const select = document.createElement('select');
  select.className = 'selectState';
  select.setAttribute('aria-label', 'Select a State');
  const first = document.createElement('option');
  first.textContent = 'Select a State';
  select.append(first);
  stateRow.querySelectorAll('ul a, ol a').forEach((a) => {
    const opt = document.createElement('option');
    opt.value = new URL(a.href, window.location.href).pathname;
    opt.textContent = a.textContent.trim();
    select.append(opt);
  });
  select.addEventListener('change', () => {
    if (select.value && select.value !== 'Select a State') window.location.href = select.value;
  });
  root.querySelector('.statemap').append(select);

  block.replaceChildren(root);
}
