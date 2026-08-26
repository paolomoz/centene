/**
 * careers — Careers / Life at Centene 2x2 box band (template-slotted replica).
 * Schema: stardust/eds-schema/index.json § careers.
 *
 * Authoring rows (simple shape, in order):
 *   1. heading "Careers" (<h2>)
 *   2. Careers body paragraph
 *   3. Careers CTA (<em><a> = white secondary; external → FA icon appended)
 *   4. photo 1 (careers-centeam, editorial)
 *   5. photo 2 (DEI band, editorial)
 *   6. heading "Life at Centene" (<h2>)
 *   7. Life body paragraph
 *   8. Life CTA (<em><a>)
 *
 * Decode queries by role/order (headings split the two text boxes; images
 * are taken in authored order) — never by hard row index (#42/#48).
 */

function spacer() {
  const d = document.createElement('div');
  d.className = 'richtext-spacer';
  d.innerHTML = '<p><br>\n </p>';
  return d;
}

function pullUp(cls) {
  const d = document.createElement('div');
  d.className = 'richtext-spacer';
  d.innerHTML = `<div class="${cls}"> <p><br>\n </p>\n</div>`;
  return d;
}

function externalize(a) {
  try {
    const url = new URL(a.href, window.location.href);
    if (/^(jobs|investors)\./.test(url.hostname) || (!/centene\.com$/.test(url.hostname) && !/aem\.(page|live)$/.test(url.hostname) && url.hostname !== 'localhost')) {
      const i = document.createElement('i');
      i.className = 'link-external';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = 'External Link';
      a.append(' ', i, sr);
    }
  } catch { /* relative = internal */ }
  return a;
}

function textBox(cls, heading, body, cta) {
  const box = document.createElement('div');
  box.className = `inner-box ${cls}`;
  box.innerHTML = `
    <div>
      <div class="richtext c-title"></div>
      <div class="richtext c-body"></div>
      <div class="row pad-col c-cta">
        <div class="colctrl-50"><div></div></div>
        <div class="colctrl-50"><div class="button"></div></div>
      </div>
    </div>`;
  const h2 = document.createElement('h2');
  if (heading) [...heading.childNodes].forEach((n) => h2.append(n.cloneNode(true)));
  box.querySelector('.c-title').append(h2);
  const p = document.createElement('p');
  p.className = 'lede';
  if (body) [...body.childNodes].forEach((n) => p.append(n.cloneNode(true)));
  box.querySelector('.c-body').append(p);
  if (cta) box.querySelector('.button').append(externalize(cta.cloneNode(true)));
  return box;
}

export default async function decorate(block) {
  const headings = [...block.querySelectorAll('h1, h2, h3')];
  const medias = [...block.querySelectorAll('picture, img')].filter((m) => !m.closest('picture') || m.tagName === 'PICTURE');
  const ps = [...block.querySelectorAll('p')].filter((p) => !p.querySelector('img, picture'));
  const bodies = ps.filter((p) => !p.querySelector('a') && p.textContent.trim().length > 40);
  const ctas = [...block.querySelectorAll('a')].filter((a) => !a.querySelector('img'));

  const careersBox = textBox('navy2-box', headings[0], bodies[0], ctas[0]);
  const lifeBox = textBox('cerise-box', headings[1], bodies[1], ctas[1]);

  // Life box: shorter lede margin + the source's trailing -80px pull richtext
  const lifeLede = lifeBox.querySelector('.lede');
  if (lifeLede) lifeLede.classList.add('short');
  const pullNeg = document.createElement('div');
  pullNeg.className = 'richtext';
  pullNeg.innerHTML = '<div class="pull-neg-80"><p><br>\n </p></div>';
  lifeBox.firstElementChild.append(pullNeg);

  const photoBox = (media, cls) => {
    const box = document.createElement('div');
    box.className = `inner-box photo-box ${cls}`;
    const img = media && (media.tagName === 'IMG' ? media : media.querySelector('img'));
    if (img) box.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    box.append(document.createElement('div'));
    return box;
  };

  const centeamBox = photoBox(medias[0], 'centeam');
  centeamBox.firstElementChild.append(spacer(), spacer(), spacer(), pullUp('pull-up-45'));

  const deiBox = photoBox(medias[1], 'dei');
  const brOnly = document.createElement('div');
  brOnly.className = 'richtext';
  brOnly.innerHTML = '<div class="br-only"><br>\n<br>\n </div>';
  deiBox.firstElementChild.append(spacer(), spacer(), brOnly, spacer(), pullUp('pull-up-50'));

  const left = document.createElement('div');
  left.className = 'colctrl-50';
  const leftInner = document.createElement('div');
  leftInner.append(careersBox, centeamBox);
  left.append(leftInner);

  const right = document.createElement('div');
  right.className = 'colctrl-50';
  const rightInner = document.createElement('div');
  rightInner.append(deiBox, lifeBox);
  right.append(rightInner);

  const eq = document.createElement('div');
  eq.className = 'equal-height';
  eq.append(left, right);

  block.replaceChildren(eq);
}
