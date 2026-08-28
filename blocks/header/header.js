import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * header — centene.com chrome (template-slotted replica, D12).
 * /nav document contract (three sections):
 *   1. brand — logo image wrapped in a link to /
 *   2. sections — the nested nav list (<ul>, up to 3 levels)
 *   3. tools — utility links (Contact)
 * Presentation is fixed template DOM; the authored sections fill role slots.
 * Interactions (probed on the live site): desktop nav has NO submenu popup
 * (hover underline only); mobile hamburger slides the drawer + search from
 * left:-100% to 0; drawer chevrons expand submenus.
 */

function buildNavList(sourceUl, level) {
  const ul = document.createElement('ul');
  ul.className = `nav-l${level}`;
  [...sourceUl.children].forEach((li) => {
    const item = document.createElement('li');
    const wrap = document.createElement('div');
    wrap.className = 'control-wrapper';
    const a = li.querySelector(':scope > a, :scope > p > a'); // #98: live unwraps to <li><p><a>
    const sub = li.querySelector(':scope > ul');
    if (a) {
      const link = a.cloneNode(true);
      link.className = level === 1 ? 'l1-link' : '';
      wrap.append(link);
    }
    if (sub) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dropdown-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Toggle submenu');
      btn.addEventListener('click', () => {
        const open = wrap.querySelector(':scope > ul').classList.toggle('submenu-open');
        btn.setAttribute('aria-expanded', open);
      });
      wrap.append(btn, buildNavList(sub, level + 1));
    }
    item.append(wrap);
    ul.append(item);
  });
  return ul;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const sections = [...fragment.children];
  const brandSection = sections[0];
  const listSection = sections[1];
  const toolsSection = sections[2];

  const brandLink = brandSection ? brandSection.querySelector('a') : null;
  const brandImg = brandSection ? brandSection.querySelector('picture, img') : null;
  const sourceUl = listSection ? listSection.querySelector('ul') : null;
  const toolLinks = toolsSection ? [...toolsSection.querySelectorAll('a')] : [];

  const wrapper = document.createElement('nav');
  wrapper.className = 'nav-wrapper';
  wrapper.setAttribute('aria-label', 'Main');
  wrapper.innerHTML = `
    <div class="brand-band">
      <div class="brand-bar"><div class="brand-row">
        <div class="brand-wrap">
          <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Open navigation">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"></span>
          </button>
          <a class="abr-logo" href="/"></a>
        </div>
        <div class="search-wrap">
          <form class="search-form" action="https://www.centene.com/search-results.html" role="search">
            <input id="search-box-top" placeholder="Search" type="search" name="q" aria-label="search">
            <button class="search-btn" type="submit">Search</button>
          </form>
          <button class="nav-toggle nav-toggle-x" type="button" aria-expanded="false" aria-label="Close navigation">
            <span class="sr-only">Toggle navigation</span>
            <span class="x-bar"></span><span class="x-bar"></span>
          </button>
        </div>
        <div class="link-wrap"><div class="topmenu"><ul></ul></div></div>
      </div></div>
    </div>
    <div class="brand-band-strip"></div>
    <div class="nav-band"><div id="navbar"></div></div>`;

  const logoSlot = wrapper.querySelector('.abr-logo');
  if (brandLink) logoSlot.href = brandLink.getAttribute('href') || '/';
  if (brandImg) {
    const img = brandImg.tagName === 'IMG' ? brandImg : brandImg.querySelector('img');
    if (img) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('width', '222');
      img.setAttribute('height', '55');
    }
    logoSlot.append(brandImg.cloneNode(true));
  }

  const toolsUl = wrapper.querySelector('.topmenu ul');
  toolLinks.forEach((a) => {
    const li = document.createElement('li');
    li.append(a.cloneNode(true));
    toolsUl.append(li);
  });

  if (sourceUl) {
    const navList = buildNavList(sourceUl, 1);
    // interior pages: the current section's submenu renders as a persistent
    // open band under the nav row (source-site behavior). Current section =
    // first path segment match against the l1 link pathnames.
    const seg = window.location.pathname.split('/').filter(Boolean)[0];
    if (seg) {
      [...navList.children].forEach((li) => {
        const a = li.querySelector('a.l1-link');
        if (!a) return;
        try {
          const linkSeg = new URL(a.href, window.location.href).pathname.split('/').filter(Boolean)[0];
          if (linkSeg && linkSeg.replace(/\.html$/, '') === seg && li.querySelector('ul.nav-l2')) {
            li.classList.add('current');
            // mark the active page inside the band
            const path = window.location.pathname.replace(/\.html$/, '');
            li.querySelectorAll('ul.nav-l2 a').forEach((sub) => {
              try {
                const p = new URL(sub.href, window.location.href).pathname.replace(/\.html$/, '');
                // exact page OR ancestor section (live underlines the parent
                // sub-link on deeper pages, e.g. browse-by-state on /…/alabama)
                if (p === path || path.startsWith(`${p}/`)) sub.classList.add('active-page');
              } catch { /* ignore */ }
            });
          }
        } catch { /* ignore */ }
      });
    }
    wrapper.querySelector('#navbar').append(navList);
  }

  const toggleDrawer = (force) => {
    const open = force !== undefined ? force : !wrapper.classList.contains('drawer-open');
    wrapper.classList.toggle('drawer-open', open);
    wrapper.querySelectorAll('.nav-toggle').forEach((b) => b.setAttribute('aria-expanded', open));
  };
  wrapper.querySelectorAll('.nav-toggle').forEach((btn) => btn.addEventListener('click', () => toggleDrawer()));
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape') toggleDrawer(false); });

  block.replaceChildren(wrapper);
}
