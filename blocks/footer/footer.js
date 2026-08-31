import { getMetadata } from '../../scripts/aem.js';
import { localizeHref } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * footer — centene.com chrome (template-slotted replica, D12).
 * /footer document contract (six sections, in order):
 *   1. reverse logo (image, linked to /)
 *   2. tagline + statement paragraphs (links render as uppercase bold rows)
 *   3. top nav links (capitalize, inline)
 *   4. list nav links (uppercase, one per line)
 *   5. social links (labelled by network — replaced by brand glyphs)
 *   6. copyright line
 * External links get the FA external-link glyph; social links map by host
 * to the Font Awesome brand glyphs the source uses.
 */

const SOCIAL_GLYPHS = [
  [/linkedin\.com/, 'fa-linkedin'],
  [/facebook\.com/, 'fa-facebook-square'],
  [/(twitter|x)\.com/, 'fa-square-x-twitter'],
  [/youtube\.com/, 'fa-youtube-square'],
];

function isExternal(a) {
  try {
    const url = new URL(a.href, window.location.href);
    return /^(jobs|investors)\./.test(url.hostname)
      || (!/centene\.com$/.test(url.hostname) && !/aem\.(page|live)$/.test(url.hostname) && url.hostname !== 'localhost');
  } catch { return false; }
}

function externalize(a) {
  if (a.querySelector('i.link-external')) return a;
  if (isExternal(a)) {
    const i = document.createElement('i');
    i.className = 'link-external';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = 'External Link';
    a.append(i, sr);
  }
  return a;
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  const sections = [...fragment.children];
  const [logoSec, richSec, topNavSec, listNavSec, socialSec, copySec] = sections;

  const root = document.createElement('div');
  root.className = 'f-root';
  root.innerHTML = `
    <div class="f-container"><div class="f-row">
      <div id="footer-left">
        <div class="f-logo-row"><div class="f-logo-col"><a class="abr-logo" href="/"></a></div></div>
        <div class="f-rich-row"><div class="f-richtext"></div></div>
      </div>
      <div id="footer-right">
        <nav class="footer-nav f-top" aria-label="Footer"></nav>
        <nav class="footer-nav f-list" aria-label="Footer utility"></nav>
        <div class="socialWrap"></div>
        <div class="copyright"></div>
      </div>
    </div></div>`;

  // 1. logo
  const logoSlot = root.querySelector('.abr-logo');
  if (logoSec) {
    const link = logoSec.querySelector('a');
    if (link && link.getAttribute('href')) logoSlot.href = link.getAttribute('href');
    const img = logoSec.querySelector('picture, img');
    if (img) {
      const raw = img.tagName === 'IMG' ? img : img.querySelector('img');
      if (raw) {
        raw.setAttribute('loading', 'lazy');
        raw.setAttribute('width', '270');
        raw.setAttribute('height', '66');
      }
      logoSlot.append(img.cloneNode(true));
    }
  }

  // 2. rich text (tagline italic + uppercase link rows + statements)
  const rich = root.querySelector('.f-richtext');
  if (richSec) {
    richSec.querySelectorAll('p').forEach((p) => {
      const clone = p.cloneNode(true);
      clone.querySelectorAll('a').forEach((a) => { a.href = localizeHref(a.href); });
      rich.append(clone);
    });
  }

  // 3-4. navs
  const fill = (sec, navEl) => {
    if (!sec) return;
    sec.querySelectorAll('a').forEach((a) => {
      const link = a.cloneNode(true);
      link.href = localizeHref(link.href);
      navEl.append(externalize(link));
    });
  };
  fill(topNavSec, root.querySelector('.f-top'));
  fill(listNavSec, root.querySelector('.f-list'));

  // 5. social glyphs
  const social = root.querySelector('.socialWrap');
  if (socialSec) {
    socialSec.querySelectorAll('a').forEach((a) => {
      const glyph = SOCIAL_GLYPHS.find(([re]) => re.test(a.href));
      const link = document.createElement('a');
      link.href = a.href;
      link.setAttribute('aria-label', a.textContent.trim() || 'social');
      const em = document.createElement('em');
      em.className = `fa-brands ${glyph ? glyph[1] : ''}`;
      link.append(em);
      social.append(link);
    });
  }

  // 6. copyright
  const copy = root.querySelector('.copyright');
  if (copySec) copySec.querySelectorAll('p').forEach((p) => copy.append(p.cloneNode(true)));

  // (the 20px tail once appended here replicated the live HOME page's
  // dismissed-consent residue — an artifact, not design; dropped site-wide)
  block.replaceChildren(root);
}
