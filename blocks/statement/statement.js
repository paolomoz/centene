/**
 * statement — mission-statement typography band (template-slotted replica).
 * Schema: stardust/eds-schema (content archetype § statement).
 *
 * Authoring rows (positional — fixed composition, template-slotted #95):
 *   1. the statement line (rendered in the site's centene-h3 face)
 *   2..N: italic lede paragraphs (centene-h4)
 * DA strips class spans, so decorate() re-wraps each row's text in the
 * source site's type spans (classes defined in styles.css).
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const out = document.createElement('div');
  out.className = 'richtext';

  const strut = document.createElement('p');
  strut.className = 'strut-p';
  out.append(strut);

  rows.forEach((row, i) => {
    const text = row.textContent.trim();
    if (!text) return;
    const p = document.createElement('p');
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    if (i === 0) {
      outer.className = 'brand-color';
      inner.className = 'centene-h3';
      inner.textContent = text;
      outer.append(inner);
    } else {
      outer.className = 'centene-h4';
      inner.className = 'brand-color';
      inner.textContent = text;
      outer.append(inner);
    }
    p.append(outer);
    out.append(p);
  });

  block.replaceChildren(out);
}
