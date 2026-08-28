/**
 * hero-interior — interior page hero band (template-slotted replica).
 * Variants: `sky` (default: sky blue + banner texture), `navy` (photo band,
 * white text), `compact` (utility pages: no tall h1 margin).
 *
 * Authoring rows (simple shape):
 *   1. banner image (editorial, authored <img>/<picture>) — optional
 *   2. breadcrumb: links, then the current page name as trailing plain text
 *   3. heading — the page's single <h1>
 */
function hiRes(src) {
  return src.replace(/width=\d+/, 'width=2000');
}

export default async function decorate(block) {
  const img = block.querySelector('picture img, img');
  if (img) {
    block.style.backgroundImage = `url("${hiRes(img.currentSrc || img.src)}")`;
  }

  const heading = block.querySelector('h1, h2');
  const crumbRow = [...block.children].find((row) => row.querySelector('a') && !row.querySelector('picture, img, h1, h2'));

  const ol = document.createElement('ol');
  if (crumbRow) {
    crumbRow.querySelectorAll('a').forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.href;
      const span = document.createElement('span');
      span.textContent = a.textContent.trim();
      link.append(span);
      li.append(link);
      ol.append(li);
    });
    // trailing plain text = the active crumb
    const cell = crumbRow.querySelector(':scope > div') || crumbRow;
    const tail = [...cell.childNodes, ...[...cell.children].flatMap((c) => [...c.childNodes])]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim())
      .pop();
    if (tail) {
      const li = document.createElement('li');
      li.className = 'active';
      const span = document.createElement('span');
      span.textContent = tail;
      li.append(span);
      ol.append(li);
    }
  }

  const crumb = document.createElement('div');
  crumb.className = 'breadcrumb';
  const nav = document.createElement('nav');
  nav.className = 'cmp-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.append(ol);
  crumb.append(nav);

  const h1 = document.createElement('h1');
  const span = document.createElement('span');
  span.className = 'centene-h1';
  if (heading) [...heading.childNodes].forEach((n) => span.append(n.cloneNode(true)));
  h1.append(span);
  const wrap = document.createElement('div');
  wrap.className = 'h1-wrap';
  wrap.append(h1);
  const rt = document.createElement('div');
  rt.className = 'richtext';
  rt.append(wrap);

  block.replaceChildren(crumb, rt);
}
