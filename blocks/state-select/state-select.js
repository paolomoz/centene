/**
 * state-select — Browse-by-State selector (source: AEM statemap).
 * The source renders an interactive US map on desktop and a dropdown on
 * mobile; this block ships the dropdown at all widths (recorded deviation —
 * see stardust/replica/inconsistency-register.md § statemap).
 *
 * Authoring rows: optional heading | ul of state links.
 */
export default async function decorate(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5');
  const root = document.createElement('div');
  root.className = 'statemap';
  if (heading) {
    const h2 = document.createElement('h2');
    const span = document.createElement('span');
    span.className = 'centene-h5';
    span.textContent = heading.textContent.trim();
    h2.append(span);
    root.append(h2);
  }
  const select = document.createElement('select');
  select.className = 'selectState';
  select.setAttribute('aria-label', 'Select a State');
  const first = document.createElement('option');
  first.textContent = 'Select a State';
  select.append(first);
  block.querySelectorAll('a').forEach((a) => {
    const opt = document.createElement('option');
    opt.value = new URL(a.href, window.location.href).pathname;
    opt.textContent = a.textContent.trim();
    select.append(opt);
  });
  select.addEventListener('change', () => {
    if (select.value && select.value !== 'Select a State') window.location.href = select.value;
  });
  root.append(select);
  block.replaceChildren(root);
}
