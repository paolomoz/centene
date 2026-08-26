/**
 * intro — "This is Centene" band (template-slotted replica).
 * Schema: stardust/eds-schema/index.json § intro.
 *
 * Authoring rows (simple shape, one property per row):
 *   1. video URL (plain link — the block builds the embed)
 *   2. heading — the page's single <h1>
 *   3. lede paragraph
 *   4. CTA — accent (<em><strong><a>) = white fill + brand border
 *
 * Composition (gray band, spacers, navy 2-col box) is fixed template DOM;
 * only the four values above are authored.
 */

function spacer() {
  const d = document.createElement('div');
  d.className = 'richtext-spacer';
  const p = document.createElement('p');
  p.innerHTML = '<br>\n ';
  d.append(p);
  return d;
}

export default async function decorate(block) {
  // the video URL is authored as a plain link in the section's leading
  // default content (D1); the block reabsorbs it (section-head pattern) —
  // the wrapper is a sibling of the block's wrapper, not of the block
  let videoA = null;
  const prev = block.parentElement && block.parentElement.previousElementSibling;
  if (prev && prev.matches('.default-content-wrapper')) {
    videoA = [...prev.querySelectorAll('a')].find((a) => /youtube\.com|youtu\.be|vimeo\.com/.test(a.href));
    if (videoA) {
      videoA = videoA.cloneNode(true);
      prev.remove();
    }
  }
  // defensive fallback: an in-table video link (older authored shape)
  if (!videoA) videoA = [...block.querySelectorAll('a')].find((a) => /youtube\.com|youtu\.be|vimeo\.com/.test(a.href));
  const heading = block.querySelector('h1, h2, h3');
  const ps = [...block.querySelectorAll('p')];
  const lede = ps.find((p) => !p.querySelector('a') && p.textContent.trim().length > 40);
  const cta = [...block.querySelectorAll('a.button, p a')].find((a) => a !== videoA);

  const videoUrl = videoA ? videoA.href : '';
  const videoTitle = videoA ? videoA.textContent.trim() : '';

  const h1 = document.createElement('h1');
  if (heading) {
    h1.innerHTML = '<br>\n';
    [...heading.childNodes].forEach((n) => h1.append(n.cloneNode(true)));
  }

  const ledeP = document.createElement('p');
  ledeP.className = 'lede';
  if (lede) [...lede.childNodes].forEach((n) => ledeP.append(n.cloneNode(true)));

  const embed = document.createElement('div');
  embed.className = 'youtubeEmbed';
  if (videoUrl) {
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl;
    iframe.title = videoTitle || 'video';
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    embed.append(iframe);
  }

  const button = document.createElement('div');
  button.className = 'button';
  if (cta) button.append(cta.cloneNode(true));

  const box = document.createElement('div');
  box.className = 'inner-box navy-box';
  box.innerHTML = `
    <div><div class="equal-height">
      <div class="colctrl-50"><div>
        <div class="richtext-spacer"><p><br>\n </p></div>
        <div class="youtube"><div class="youtube-row"><div class="youtube-col"></div></div></div>
      </div></div>
      <div class="colctrl-50"><div>
        <div class="richtext intro-text"></div>
        <div class="row pad-col intro-cta">
          <div class="colctrl-50"><div class="richtext-spacer"><p><br>\n </p></div></div>
          <div class="colctrl-50"></div>
        </div>
      </div></div>
    </div></div>`;
  box.querySelector('.youtube-col').append(embed);
  box.querySelector('.intro-text').append(h1, ledeP);
  box.querySelector('.intro-cta .colctrl-50:last-child').append(button);

  block.replaceChildren(spacer(), box, spacer());
}
