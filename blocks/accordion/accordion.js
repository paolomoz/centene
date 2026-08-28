/**
 * accordion — collapsible panel(s) (source: AEM accordion component).
 *
 * Authoring rows (one per panel): title cell | body cell.
 * Panels start collapsed; the heading button toggles, glyph flips +/−.
 */
export default async function decorate(block) {
  const wrapper = document.createElement('div');
  wrapper.className = 'theme-default accordion-inner';

  [...block.children].forEach((row, i) => {
    const [titleCell, bodyCell] = [...row.children];
    const panel = document.createElement('div');
    panel.className = 'panel';

    const h2 = document.createElement('h2');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'panel-heading collapsed';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `acc-panel-${i}`);
    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = titleCell ? titleCell.textContent.trim() : '';
    const glyph = document.createElement('span');
    glyph.className = 'glyphicon glyphicon-plus-sign';
    btn.append(title, glyph);
    h2.append(btn);

    const collapse = document.createElement('div');
    collapse.id = `acc-panel-${i}`;
    collapse.className = 'panel-collapse';
    const body = document.createElement('div');
    body.className = 'panel-body';
    if (bodyCell) body.append(...bodyCell.childNodes);
    collapse.append(body);

    btn.addEventListener('click', () => {
      const open = collapse.classList.toggle('in');
      btn.setAttribute('aria-expanded', open);
      btn.classList.toggle('collapsed', !open);
      glyph.classList.toggle('glyphicon-plus-sign', !open);
      glyph.classList.toggle('glyphicon-minus-sign', open);
    });

    panel.append(h2, collapse);
    wrapper.append(panel);
  });

  block.replaceChildren(wrapper);
}
