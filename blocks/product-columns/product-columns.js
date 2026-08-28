/**
 * product-columns — pillar product overview: h2 + eyebrow + 3 titled columns
 * each with a description and a pill button.
 *
 * Authoring rows:
 *   1. heading (h2)
 *   2. eyebrow line (text)
 *   3..N: columns: title | description | button link
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const head = document.createElement('div');
  head.className = 'richtext pc-head';
  const grid = document.createElement('div');
  grid.className = 'row pc-grid';

  let headed = false;
  rows.forEach((row) => {
    const cells = [...row.children];
    const link = row.querySelector('a');
    if (cells.length === 1 && !link) {
      const text = row.textContent.trim();
      if (!text) return;
      if (!headed) {
        const h2 = document.createElement('h2');
        const s1 = document.createElement('span');
        s1.className = 'brand-color';
        const s2 = document.createElement('span');
        s2.className = 'centene-h2';
        s2.textContent = text;
        s1.append(s2);
        h2.append(s1);
        head.append(h2);
        headed = true;
      } else {
        const p = document.createElement('p');
        p.className = 'eyebrow-p';
        const s1 = document.createElement('span');
        s1.className = 'brand-color';
        const b = document.createElement('b');
        const s2 = document.createElement('span');
        s2.className = 'centene-h5';
        s2.textContent = text;
        b.append(s2);
        s1.append(b);
        p.append(s1);
        head.append(p);
      }
      return;
    }
    const col = document.createElement('div');
    col.className = 'colctrl-40';
    const rt = document.createElement('div');
    rt.className = 'richtext';
    const h3 = document.createElement('h3');
    h3.innerHTML = '<span class="brand-color"><i><span class="rd-t-16"><b></b></span></i></span>';
    h3.querySelector('b').textContent = cells[0] ? cells[0].textContent.trim() : '';
    const p = document.createElement('p');
    const span = document.createElement('span');
    span.className = 'rd-t-16';
    span.textContent = cells[1] ? cells[1].textContent.trim() : '';
    p.append(span);
    rt.append(h3, p);
    const btnWrap = document.createElement('div');
    btnWrap.className = 'button';
    if (link) {
      const a = document.createElement('a');
      a.className = 'btn site-btn';
      a.href = link.href;
      a.textContent = link.textContent.trim();
      btnWrap.append(a);
    }
    col.append(rt, btnWrap);
    grid.append(col);
  });

  block.replaceChildren(head, grid);
}
