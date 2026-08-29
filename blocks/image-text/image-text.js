/**
 * image-text — photo + lede band (source: AEM imagewithtext).
 * Variants: color token (navy/sky/plum/leaf/cerise/carrot/white) and `right`
 * (image on the right; default left).
 *
 * Authoring row: image cell | text cell (lede paragraphs).
 */
export default async function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const imgCell = cells.find((c) => c.querySelector('picture, img'));
  const textCell = cells.find((c) => c !== imgCell);

  const root = document.createElement('div');
  root.className = 'imagetext-row';
  const imgCol = document.createElement('div');
  imgCol.className = 'featured-image';
  if (imgCell) {
    const media = imgCell.querySelector('picture, img').cloneNode(true);
    const raw = media.tagName === 'IMG' ? media : media.querySelector('img');
    if (raw) raw.setAttribute('loading', 'lazy');
    imgCol.append(media);
  }
  const textCol = document.createElement('div');
  textCol.className = 'featured-text';
  const rt = document.createElement('div');
  rt.className = 'richtext';
  if (textCell) {
    const lines = textCell.querySelectorAll('p, h2, h3, h4, ul').length
      ? [...textCell.querySelectorAll(':scope p, :scope h2, :scope h3, :scope h4, :scope ul')] : [textCell];
    lines.forEach((line) => {
      const text = line.textContent.trim();
      if (!text) return;
      if (line.tagName === 'P' && !line.querySelector('a, strong, em')) {
        const p = document.createElement('p');
        const span = document.createElement('span');
        span.className = 'centene-h4';
        span.textContent = text;
        p.append(span);
        rt.append(p);
      } else {
        rt.append(line.cloneNode(true));
      }
    });
  }
  textCol.append(rt);
  if (block.classList.contains('right')) root.append(textCol, imgCol);
  else root.append(imgCol, textCol);
  block.replaceChildren(root);
}
