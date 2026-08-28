/**
 * news-hub — the /news listing composition (60/40 two-column):
 * h1 + breadcrumb + featured story + card grid (left) · press-release rail +
 * search button (right).
 *
 * Authoring rows, classified by content (#48), in order:
 *   1. single text cell, no links       = the h1
 *   2. links (+ trailing text), before any image row = breadcrumb
 *   -  FIRST image row (3 cells)        = featured story: image | linked title | teaser
 *   -  single text cells, no links      = column heads (grid heading, rail heading)
 *   -  image rows after the featured    = fallback news cards: image | linked title | date
 *   -  2-cell text rows                 = press-release items: date | linked title
 *   -  single-link row after the featured = the search-press-releases button
 *
 * Cards are DYNAMIC (dynamic-blocks-map): the block fetches /news-index.json,
 * filters category === 'centene:featured', sorts newest-first; when the index
 * yields at least as many entries as the authored fallback rows it renders
 * from the index, otherwise the authored rows ship (pre-wave-2 state).
 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(raw) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function externalize(a) {
  if (a.querySelector('i.link-external')) return a;
  try {
    const url = new URL(a.href, window.location.href);
    if (/^(jobs|investors)\./.test(url.hostname)
      || (!/centene\.com$/.test(url.hostname) && !/aem\.(page|live)$/.test(url.hostname) && url.hostname !== 'localhost')) {
      const i = document.createElement('i');
      i.className = 'link-external';
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = 'External Link';
      a.append(i, sr);
    }
  } catch { /* relative = internal */ }
  return a;
}

function cardEl({ href, img, title, date }) {
  const col = document.createElement('div');
  col.className = 'news-col';
  const box = document.createElement('div');
  box.className = 'column-box';
  const a = document.createElement('a');
  a.href = href;
  const imgWrap = document.createElement('div');
  imgWrap.className = 'news-card-image';
  imgWrap.append(img);
  const h3 = document.createElement('h3');
  h3.className = 'news-card-title';
  h3.textContent = title;
  a.append(imgWrap, h3);
  const content = document.createElement('div');
  content.className = 'news-card-content';
  const span = document.createElement('span');
  span.textContent = date;
  content.append(span);
  box.append(a, content);
  col.append(box);
  return col;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const slots = {
    h1: '', crumbs: null, featured: null, heads: [], cards: [], press: [], btn: null,
  };

  rows.forEach((row) => {
    const cells = [...row.children];
    const media = row.querySelector('picture, img');
    const links = [...row.querySelectorAll('a')];
    const text = row.textContent.trim();
    if (media) {
      const linkEl = links[0];
      const texts = cells.filter((c) => !c.querySelector('picture, img'));
      const card = {
        media,
        href: linkEl ? linkEl.href : '#',
        title: (row.querySelector('h2, h3') || linkEl || { textContent: '' }).textContent.trim(),
        extra: texts.length > 1 ? texts[texts.length - 1].textContent.trim() : '',
      };
      if (!slots.featured) slots.featured = card;
      else slots.cards.push(card);
    } else if (links.length && !slots.featured) {
      slots.crumbs = { links, tail: text.replace(links.map((a) => a.textContent.trim()).join(' '), '').trim() };
    } else if (links.length === 1 && cells.length === 1) {
      slots.btn = links[0];
    } else if (cells.length >= 2 && links.length) {
      slots.press.push({ date: cells[0].textContent.trim(), link: links[0] });
    } else if (text) {
      if (!slots.h1) slots.h1 = text;
      else slots.heads.push(text);
    }
  });

  const root = document.createElement('div');
  root.className = 'l-cols clearfix';
  root.innerHTML = `
    <div class="colctrl-60">
      <div class="richtext"><h1><span class="rd-t-32"></span><span class="brand-color"></span></h1></div>
      <div class="breadcrumb"><nav class="cmp-breadcrumb" aria-label="Breadcrumb"><ol></ol></nav></div>
      <div class="featurednews"></div>
      <div class="richtext sec-heading"><h2><span class="centene-h3"><span class="brand-color"></span></span></h2></div>
      <div class="newsfeed"><div class="news-grid"></div><div class="pagination-container"></div></div>
    </div>
    <div class="colctrl-40">
      <div class="richtext pr-head"><h2><span class="centene-h3"><span class="brand-color"></span></span></h2></div>
      <div class="pressreleases"><div id="news-list"></div></div>
      <div class="button-slot"></div>
    </div>`;

  root.querySelector('h1 .brand-color').textContent = slots.h1;
  root.querySelector('.sec-heading .brand-color').textContent = slots.heads[0] || '';
  root.querySelector('.pr-head .brand-color').textContent = slots.heads[1] || '';

  const ol = root.querySelector('.breadcrumb ol');
  if (slots.crumbs) {
    slots.crumbs.links.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.href;
      const span = document.createElement('span');
      span.textContent = a.textContent.trim();
      link.append(span);
      li.append(link);
      if (ol.children.length) ol.append(document.createTextNode(' '));
      ol.append(li);
    });
    if (slots.crumbs.tail) {
      const li = document.createElement('li');
      li.className = 'active';
      const span = document.createElement('span');
      span.textContent = slots.crumbs.tail;
      li.append(span);
      if (ol.children.length) ol.append(document.createTextNode(' '));
      ol.append(li);
    }
  }

  const feat = root.querySelector('.featurednews');
  if (slots.featured) {
    const a = document.createElement('a');
    a.href = slots.featured.href;
    const media = slots.featured.media.cloneNode(true);
    const raw = media.tagName === 'IMG' ? media : media.querySelector('img');
    if (raw) raw.setAttribute('loading', 'eager');
    a.append(media);
    const h2 = document.createElement('h2');
    const ta = document.createElement('a');
    ta.href = slots.featured.href;
    ta.textContent = slots.featured.title;
    h2.append(ta);
    const p = document.createElement('p');
    p.textContent = slots.featured.extra;
    feat.append(a, h2, p);
  }

  // card grid: index-driven when populated, authored fallback otherwise
  const grid = root.querySelector('.news-grid');
  const renderAuthored = () => {
    grid.replaceChildren(...slots.cards.map((c) => {
      const media = c.media.cloneNode(true);
      const raw = media.tagName === 'IMG' ? media : media.querySelector('img');
      if (raw) raw.setAttribute('loading', 'lazy');
      return cardEl({
        href: c.href, img: media, title: c.title, date: c.extra,
      });
    }));
  };
  renderAuthored();
  try {
    const resp = await fetch('/news-index.json');
    if (resp.ok) {
      const { data } = await resp.json();
      const items = (data || [])
        .filter((it) => it.category === 'centene:featured' && it.publisheddate)
        .sort((x, y) => new Date(y.publisheddate) - new Date(x.publisheddate))
        .slice(0, slots.cards.length || 9);
      if (items.length >= (slots.cards.length || 9)) {
        grid.replaceChildren(...items.map((it) => {
          const img = document.createElement('img');
          img.src = it.image;
          img.alt = it.title;
          img.setAttribute('loading', 'lazy');
          return cardEl({
            href: it.path, img, title: it.title, date: formatDate(it.publisheddate),
          });
        }));
      }
    }
  } catch { /* index unavailable — authored fallback already rendered */ }

  const list = root.querySelector('#news-list');
  slots.press.forEach((item) => {
    const d = document.createElement('p');
    d.textContent = item.date;
    const e = document.createElement('p');
    e.className = 'event';
    e.append(externalize(item.link.cloneNode(true)));
    list.append(d, e);
  });

  if (slots.btn) {
    const wrap = root.querySelector('.button-slot');
    wrap.className = 'button';
    const a = document.createElement('a');
    a.className = 'btn site-btn';
    a.href = slots.btn.href;
    a.textContent = slots.btn.textContent.trim();
    externalize(a);
    wrap.append(a);
  }

  block.replaceChildren(root);
}
