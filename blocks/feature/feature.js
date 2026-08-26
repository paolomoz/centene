/**
 * feature — 2-col text + image band (template-slotted replica).
 * Variants: `members` (purple texture bg, text left / image right),
 *           `investors` (leaf green bg, image left / text right).
 * Schema: stardust/eds-schema/index.json § feature-members / feature-investors.
 *
 * Authoring rows (simple shape):
 *   1. heading (<h2>)
 *   2. body paragraph
 *   3. CTA (<em><a> = white secondary, <strong><a> = blue primary)
 *   4. image (editorial, authored <img>/<picture>)
 */

function spacerCol(cls) {
  const d = document.createElement('div');
  d.className = cls;
  d.innerHTML = '<div class="richtext-spacer"><p><br>\n </p></div>';
  return d;
}

export default async function decorate(block) {
  const heading = block.querySelector('h1, h2, h3');
  const ps = [...block.querySelectorAll('p')];
  const body = ps.find((p) => !p.querySelector('a, img, picture') && p.textContent.trim().length > 40);
  const cta = block.querySelector('a.button') || [...block.querySelectorAll('a')].find((a) => !a.querySelector('img'));
  const media = block.querySelector('picture, img');
  const isMembers = block.classList.contains('members');

  const h2 = document.createElement('h2');
  if (heading) {
    if (isMembers) {
      // source wraps the purple band's title in an inner 32px white span
      const span = document.createElement('span');
      [...heading.childNodes].forEach((n) => span.append(n.cloneNode(true)));
      h2.append(span);
    } else {
      [...heading.childNodes].forEach((n) => h2.append(n.cloneNode(true)));
    }
  }

  const lede = document.createElement('p');
  lede.className = 'lede';
  if (body) [...body.childNodes].forEach((n) => lede.append(n.cloneNode(true)));

  const button = document.createElement('div');
  button.className = 'button';
  if (cta) {
    const a = cta.cloneNode(true);
    // external targets carry the source's FA external-link glyph + sr-only label
    try {
      const url = new URL(a.href, window.location.href);
      if (!/centene\.com$|aem\.(page|live)$|^localhost$/.test(url.hostname) || /^(jobs|investors)\./.test(url.hostname)) {
        const i = document.createElement('i');
        i.className = 'link-external';
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = 'External Link';
        a.append(' ', i, sr);
      }
    } catch { /* relative href — internal */ }
    button.append(a);
  }

  const textCol = document.createElement('div');
  const imgCol = document.createElement('div');

  if (isMembers) {
    textCol.className = 'colctrl-40 f-text';
    textCol.innerHTML = `
      <div>
        <div class="spacer-line"><p></p></div>
        <div class="richtext f-title"></div>
        <div class="richtext f-body"></div>
        <div class="row f-cta">
          <div class="colctrl-40"><div class="richtext-spacer"><p><br>\n </p></div></div>
          <div class="colctrl-60"></div>
        </div>
      </div>`;
    textCol.querySelector('.f-title').append(h2);
    textCol.querySelector('.f-body').append(lede);
    textCol.querySelector('.f-cta .colctrl-60').append(button);

    imgCol.className = 'colctrl-60 f-media';
    imgCol.innerHTML = `
      <div><div class="row">
        <div class="colctrl-40"><div class="richtext-spacer"><p><br>\n </p></div></div>
        <div class="colctrl-60"><div class="richtext"><p class="img-p"></p></div></div>
      </div></div>`;
    if (media) imgCol.querySelector('.img-p').append(media.cloneNode(true));
    block.replaceChildren(wrapRow(textCol, imgCol));
  } else {
    imgCol.className = 'colctrl-50 f-media';
    imgCol.innerHTML = '<div class="richtext"><p class="img-p"></p></div>';
    if (media) imgCol.querySelector('.img-p').append(media.cloneNode(true));

    textCol.className = 'colctrl-50 f-text';
    textCol.innerHTML = `
      <div class="richtext f-title"></div>
      <div class="richtext f-body"></div>
      <div class="row f-cta">
        <div class="colctrl-50"></div>
        <div class="colctrl-50 f-cta-spare"><div></div></div>
      </div>`;
    textCol.querySelector('.f-title').append(h2);
    textCol.querySelector('.f-body').append(lede);
    const ctaCol = textCol.querySelector('.f-cta .colctrl-50');
    ctaCol.append(button);
    const sp = document.createElement('div');
    sp.className = 'richtext-spacer';
    sp.innerHTML = '<p><br>\n </p>';
    ctaCol.append(sp);
    block.replaceChildren(wrapRow(imgCol, textCol));
  }
}

function wrapRow(...cols) {
  const row = document.createElement('div');
  row.className = 'row f-row';
  cols.forEach((c) => row.append(c));
  return row;
}
