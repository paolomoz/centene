/**
 * panel — full-bleed photo band with translucent white box (template-slotted).
 * Variants: `investing` (box right, 50% col), `sustainability` (box left, 40% col).
 * Schema: stardust/eds-schema/index.json § panel-investing / panel-sustainability.
 *
 * Authoring rows (simple shape):
 *   1. band background image (editorial, authored <img>/<picture>)
 *   2. heading (<h2>)
 *   3. body paragraph
 *   4. CTA (<strong><a> = blue primary)
 *
 * The band photo renders as a background layer (mirrors the source's
 * background-color-box background-image); the translucent box is the fixed
 * brand asset /img/centene/90whitebox.png (CSS).
 */
// full-bleed background layer: request the 2000px rendition, not the
// pipeline's 750px fallback <img src>
function hiRes(src) {
  return src.replace(/width=\d+/, 'width=2000');
}

export default async function decorate(block) {
  const media = block.querySelector('picture img, img');
  const src = media ? hiRes(media.currentSrc || media.src) : '';
  const heading = block.querySelector('h1, h2, h3');
  const ps = [...block.querySelectorAll('p')];
  const body = ps.find((p) => !p.querySelector('a, img, picture') && p.textContent.trim().length > 40);
  const cta = block.querySelector('a.button') || [...block.querySelectorAll('a')].find((a) => !a.querySelector('img'));

  if (src) block.style.backgroundImage = `url("${src}")`;

  const h2 = document.createElement('h2');
  const span = document.createElement('span');
  span.className = 'brand-color';
  if (heading) [...heading.childNodes].forEach((n) => span.append(n.cloneNode(true)));
  h2.append(span);

  const lede = document.createElement('p');
  lede.className = 'lede';
  if (body) [...body.childNodes].forEach((n) => lede.append(n.cloneNode(true)));

  const button = document.createElement('div');
  button.className = 'button';
  if (cta) button.append(cta.cloneNode(true));

  const box = document.createElement('div');
  box.className = 'inner-box white-box rounded-box';
  box.innerHTML = `
    <div>
      <div class="richtext p-title"></div>
      <div class="richtext p-body"></div>
      <div class="row p-cta">
        <div class="colctrl-50"><div class="richtext-spacer"><p><br>\n </p></div></div>
        <div class="colctrl-50"></div>
      </div>
    </div>`;
  box.querySelector('.p-title').append(h2);
  box.querySelector('.p-body').append(lede);
  box.querySelector('.p-cta .colctrl-50:last-child').append(button);

  const row = document.createElement('div');
  row.className = 'row p-row';

  if (block.classList.contains('sustainability')) {
    const boxCol = document.createElement('div');
    boxCol.className = 'colctrl-40';
    boxCol.append(box);
    const spare = document.createElement('div');
    spare.className = 'colctrl-60';
    spare.innerHTML = '<div></div>';
    row.append(boxCol, spare);
  } else {
    const spacers = document.createElement('div');
    spacers.className = 'colctrl-50';
    spacers.innerHTML = `
      <div class="richtext-spacer"><p><br>\n </p></div>
      <div class="richtext-spacer"><p><br>\n </p></div>`;
    const boxCol = document.createElement('div');
    boxCol.className = 'colctrl-50';
    boxCol.append(box);
    row.append(spacers, boxCol);
  }

  block.replaceChildren(row);
}
