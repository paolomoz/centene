#!/usr/bin/env python3
"""
import-sibling.py — wave-1 sibling importer (content/utility/pillar types).

Transforms a cached live centene.com page (AEM classic grid template) into an
EDS content page (DA body fragment) using the Phase-1 archetype vocabulary:

  backgroundcolorbox(hero)  -> hero-interior block (+variants from static signals)
  backgroundcolorbox(band)  -> rt section with band-* style (content transported)
  richtext                  -> default content (transform table)
  columncontrol             -> cols block
  accordion / accordiongroup-> accordion block rows
  relatedcontent/relatednews-> related block rows
  youtube                   -> default-content link + video-band block
  imagewithtext             -> image-text block
  imagelinktiles            -> image-tiles block
  statemap                  -> state-select block (map->select recorded deviation)
  button                    -> <p><strong><a>..</a></strong></p> (buttonized primary)
  image                     -> default-content <p><img></p>

Transform table (Phase-1 learnings): span class -> heading-level mapping with
the <hN><strong> display convention; whitespace-p and trailing-NBSP ride
<p><code>&nbsp;</code></p>; margin-left indents ride <blockquote>; heading
anchors re-slugified; internal links lose .html; b/i -> strong/em.

Media: downloads referenced images to stardust/import-media/ and records a
manifest for the DA upload pass; srcs rewritten to content.da.live URLs.

Usage: python3 stardust/scripts/import-sibling.py <slug> [...]  (or --all)
Output: content/<path>.html + stardust/import-report.json entries
"""
import re, os, sys, json, html as H, hashlib, subprocess, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, 'stardust/import-cache')
MEDIA = os.path.join(ROOT, 'stardust/import-media')
DA = 'https://content.da.live/paolomoz/centene/media/centene'
LIVE = 'https://www.centene.com'
os.makedirs(MEDIA, exist_ok=True)

SUBNAV = {'who-we-are': 'subnav-3', 'products-and-services': 'subnav-2', 'why-were-different': 'subnav-1'}
# l2 sections that carry a third-level nav (their pages get the l3 strip row)
L3_PARENTS = {'one-centeam', 'centene-foundation', 'corporate-sustainability',
              'strategic-partnerships', 'medicaid', 'marketplace'}

def subnav_style(path):
    parts = [x for x in path.strip('/').split('/') if x]
    style = SUBNAV.get(parts[0] if parts else '')
    if not style: return None
    if len(parts) >= 2 and parts[1] in L3_PARENTS:
        style += ', l3row'
    return style
BG = {'centenedotcom-sky-background': 'sky', 'white-background': None, 'light-gray-background': 'gray',
      'centenedotcom-navy-background': 'blue', 'navy-background': 'navy',
      'centenedotcom-plum-background': 'plum', 'centenedotcom-leaf-background': 'leaf',
      'centenedotcom-cerise-background': 'cerise', 'centenedotcom-carrot-background': 'carrot',
      'grape-background': 'plum', 'celticblue-background': 'blue', 'hngreen-background': 'leaf',
      'brand-background': 'blue', 'brand-background-light': 'sky',
      'background-color-box-more-padding': None}
TILE_COLORS = ['leaf', 'sky', 'plum', 'carrot', 'cerise', 'navy']

report = {'pages': [], 'media': {}, 'deviations': []}
try:
    NEWSFEED = json.load(open(os.path.join(ROOT, 'stardust/import-newsfeed.json')))
except Exception:
    NEWSFEED = {}
try:
    _arch = json.load(open(os.path.join(ROOT, 'stardust/import-archive.json')))
    FEATURED = {a['href'].replace('.html', '') for a in _arch if a.get('href')}
except Exception:
    FEATURED = set()

HEAD_TMPL = '''<body>
  <header></header>
  <main>
    <div>
      <div class="metadata">
        <div><div>Title</div><div>{title}</div></div>
        <div><div>Description</div><div>{desc}</div></div>
      </div>
    </div>
{secs}
  </main>
  <footer></footer>
</body>
'''

# ---------------------------------------------------------------- primitives
def walk_components(src, start=0, end=None):
    """Yield (cls, full_html) for each top-level aem-GridColumn component."""
    end = end if end is not None else len(src)
    i = start
    out = []
    while True:
        m = re.compile(r'<div class="([a-z][a-zA-Z0-9_]*)[^"]* aem-GridColumn[^"]*"[^>]*>').search(src, i, end)
        if not m: break
        j = m.end(); depth = 1
        while depth > 0:
            nxt = re.compile(r'<div\b|</div>').search(src, j, end)
            if not nxt: j = end; break
            j = nxt.end()
            depth += 1 if nxt.group(0) == '<div' else -1
        out.append((m.group(1), src[m.start():j]))
        i = j
    return out

def inner_components(comp_html):
    """Components nested one grid level down (inside a bgbox)."""
    m = re.search(r'<div class="aem-Grid[^"]*"[^>]*>', comp_html)
    if not m: return []
    return walk_components(comp_html, m.end())

def media_name(src):
    p = urllib.parse.urlparse(src).path
    base = urllib.parse.unquote(os.path.basename(p))
    stem, ext = os.path.splitext(base)
    slug = re.sub(r'[^a-z0-9]+', '-', stem.lower()).strip('-')
    if not ext or len(ext) > 5:
        # extension-less CDN paths ('/original'): unique name + assumed jpeg
        h = hashlib.sha1(src.encode()).hexdigest()[:8]
        return f'{slug}-{h}.jpg'
    return f'{slug}{ext.lower()}'

MEDIA_ALIAS = {'our-mission-test-banner-no-copy.png': 'mission-banner.png'}
KEEP_SOURCE_URL = set()
# DA rejects SVGs > 40KB — rasterized to PNG and aliased
MEDIA_ALIAS['ichra-coverage-map-2026.svg'] = 'ichra-coverage-map-2026.png'

def register_media(src):
    if src.startswith('data:'): return src
    if src.startswith(DA): return src  # already rewritten (second pass over emitted markup)
    absu = src if src.startswith('http') else LIVE + src
    name = media_name(src)
    if name in MEDIA_ALIAS:
        return f'{DA}/{MEDIA_ALIAS[name]}'
    if name in KEEP_SOURCE_URL:
        # DA rejects SVGs > 40KB — reuse the source-origin URL (media-reconciliation reuse path)
        return absu
    report['media'][name] = absu
    return f'{DA}/{name}'

def slugify_heading(t):
    t = re.sub(r'<[^>]+>', '', t)
    t = H.unescape(t).lower()
    t = re.sub(r'[^a-z0-9]+', '-', t).strip('-')
    return re.sub(r'^\d+-', '', t)

def rewrite_href(href):
    href = H.unescape(href)
    if href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'): return href
    if '/content/dam/' in href:
        return href if href.startswith('http') else LIVE + href
    u = urllib.parse.urlparse(href)
    if u.netloc and 'www.centene.com' not in u.netloc: return href
    path = u.path
    if path.endswith('.html'): path = path[:-5]
    if not path: return href
    path = re.sub(r'[_]+', '-', path)
    path = re.sub(r'-{2,}', '-', path)
    return path + (('#' + u.fragment) if u.fragment else '')

# ------------------------------------------------------------ text transform
def clean_rich(x, in_block=False):
    """The Phase-1 transform table, applied to a richtext fragment."""
    x = re.sub(r'<link[^>]*>|<script.*?</script>|<style.*?</style>', '', x, flags=re.S)
    # centered/floated portrait construct -> <em> vehicle
    x = re.sub(r'<center>\s*(<img[^>]*>)\s*</center>', r'<p><em>\1</em></p>', x, flags=re.S)
    x = re.sub(r'</?center>', '', x)
    x = re.sub(r'</?div[^>]*>', '', x)
    # heading-level mapping BEFORE span unwrap
    # p/h wrapping a centene-hN span -> heading level N (display convention)
    def head_map(m):
        wrapper = m.group(1)
        lvl = m.group(2)
        body = m.group(3)
        # the pipeline strips <br> inside headings — emit the source's
        # leading/trailing br lines as spacer paragraphs around the heading
        pre = post = ''
        b2 = body
        while re.match(r'\s*<br\s*/?>', b2):
            pre += '<p><code>&nbsp;</code></p>'
            b2 = re.sub(r'^\s*<br\s*/?>', '', b2, count=1)
        while re.search(r'<br\s*/?>(?:\s|&nbsp;|\xa0)*$', b2):
            post += '<p><code>&nbsp;</code></p>'
            b2 = re.sub(r'<br\s*/?>(?:\s|&nbsp;|\xa0)*$', '', b2, count=1)
        if wrapper == 'h1' or lvl == '1': return f'{pre}<h1>{b2}</h1>{post}'
        if lvl in ('2', '3'): return f'{pre}<h{lvl}><strong>{b2}</strong></h{lvl}>{post}'
        return f'{pre}<h{lvl}>{b2}</h{lvl}>{post}'
    x = re.sub(r'<(p|h[1-6])[^>]*>\s*(?:<span class="brand-color">\s*)?<span class="centene-h([1-5])[^"]*">(.*?)</span>\s*(?:</span>\s*)?</\1>',
               head_map, x, flags=re.S)
    # indent paragraphs -> blockquote (before attr strip)
    def indent(m):
        px = float(m.group(1)); body = m.group(2)
        levels = max(1, min(3, round(px / 40)))
        return '<blockquote>' * levels + body + '</blockquote>' * levels
    x = re.sub(r'<p style="[^"]*margin-left:\s*([0-9.]+)px[^"]*"[^>]*>(.*?)</p>', indent, x, flags=re.S)
    x = re.sub(r'<(/?)b\b', r'<\1strong', x)
    x = re.sub(r'<(/?)i\b(?![a-z])', r'<\1em', x)
    # drop pre-rendered external-link glyphs (runtime re-adds)
    x = re.sub(r'<em class="link-external[^>]*>\s*</em>', '', x)
    x = re.sub(r'<span class="sr-only">External Link</span>', '', x)
    x = re.sub(r'<span[^>]*>', '', x); x = x.replace('</span>', '')
    # strip attrs — but keep img width/height (authored display size; also CLS)
    def keep_img_dims(m):
        tag = m.group(0)
        w = re.search(r'width="(\d+)"', tag)
        s = re.search(r'src="([^"]+)"', tag)
        if w and s:
            name = media_name(s.group(1))
            prev = report.setdefault('mediaWidths', {}).get(name)
            report['mediaWidths'][name] = min(int(w.group(1)), prev) if prev else int(w.group(1))
        tag = re.sub(r'\s(style|class|id|lang|xml:lang|target|rel|data-[a-z-]+|aria-[a-z-]+|title|align|hspace|vspace)="[^"]*"', '', tag)
        return tag
    x = re.sub(r'<img[^>]*>', keep_img_dims, x)
    x = re.sub(r'<(?!img)([a-zA-Z0-9]+)((?:\s+[a-zA-Z:_-]+="[^"]*")*)\s*(/?)>',
               lambda m: '<' + m.group(1) + re.sub(r'\s(style|class|id|lang|xml:lang|target|rel|data-[a-z-]+|aria-[a-z-]+|itemscope|itemtype|itemprop|width|height|align|valign|border|cellpadding|cellspacing|title|name|hspace|vspace)="[^"]*"', '', m.group(2)) + (' /' if m.group(3) else '') + '>', x)
    x = x.replace('<br />', '<br>').replace('\xa0', '&nbsp;')
    # rewrite hrefs + srcs
    x = re.sub(r'href="([^"]+)"', lambda m: f'href="{rewrite_href(m.group(1))}"', x)
    x = re.sub(r'src="([^"]+)"', lambda m: f'src="{register_media(m.group(1))}"', x)
    # heading anchors -> text slugs
    heads = re.findall(r'<h2[^>]*>(.*?)</h2>', x, flags=re.S)
    # spacers + trailing nbsp
    x = re.sub(r'<p>(?:&nbsp;|\s|<br>)*</p>', '<p><code>&nbsp;</code></p>', x)
    x = re.sub(r'<blockquote>(?:&nbsp;|\s|<br>)*</blockquote>', '', x)
    x = re.sub(r'(?<!<p><code>)(?:\s|&nbsp;)*(?:&nbsp;)(?:\s|&nbsp;)*</(li|p|strong|em|h[1-6]|blockquote|td)>',
               lambda m: f' <code>&nbsp;</code></{m.group(1)}>', x)
    x = re.sub(r'<p><code>&nbsp;</code> <code>&nbsp;</code></p>', '<p><code>&nbsp;</code></p>', x)
    # empty leftovers
    x = re.sub(r'<(p|h[1-6]|strong|em)>\s*</\1>', '', x)
    x = re.sub(r'\n\s*\n+', '\n', x).strip()
    return x

# ------------------------------------------------------- component emitters
def emit_hero(comp, page, stray_crumb=None):
    bgm = re.search(r'background-color-box ([a-z- ]+)"', comp)
    bgcls = (bgm.group(1) if bgm else '').strip()
    variant = 'navy' if 'navy' in bgcls else ''
    bgimg = re.search(r'background-image:\s*url\((.*?\.(?:png|jpg|jpeg|svg|webp))\)', comp, re.I)
    img = register_media(H.unescape(bgimg.group(1)).strip('"\'')) if bgimg else f'{DA}/mission-banner.png'
    h1m = re.search(r'<h1[^>]*>(.*?)</h1>', comp, re.S)
    h1raw = h1m.group(1) if h1m else ''
    h1txt = re.sub(r'<[^>]+>', '', h1raw)
    h1txt = H.unescape(h1txt).replace('\xa0', ' ').strip()
    trail = 'trail' if re.search(r'<br\s*/?>\s*\xa0?\s*</span>|<br\s*/?>\s*&nbsp;', h1raw) else ''
    tall = 'margin-bottom: 150' in comp
    if not variant:
        variant = '' if tall else 'compact'
    variants = ' '.join(v for v in [variant, trail] if v)
    # breadcrumb links + trailing active text
    crumbs = []
    active = ''
    bc = re.search(r'<ol[^>]*>(.*?)</ol>', comp, re.S) or (re.search(r'<ol[^>]*>(.*?)</ol>', stray_crumb, re.S) if stray_crumb else None)
    if bc:
        for li in re.findall(r'<li[^>]*>(.*?)</li>', bc.group(1), re.S):
            a = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', li, re.S)
            name = H.unescape(re.sub(r'<[^>]+>', '', a.group(2) if a else li)).strip()
            if a: crumbs.append((rewrite_href(a.group(1)), name))
            elif name: active = name
    crumb_html = ' '.join(f'<a href="{("https://www.centene.com" + h + ".html") if h == "/" or not h.startswith("http") and False else h}">{H.escape(n)}</a>' for h, n in crumbs)
    crumb_html = ' '.join(f'<a href="{h if h.startswith("http") else ("https://www.centene.com" + (h if h != "/" else "/"))}">{H.escape(n)}</a>' for h, n in crumbs)
    if active: crumb_html += f' {H.escape(active)}'
    cls = 'hero-interior' + (f' {variants}' if variants else '')
    style = subnav_style(page['path'])
    sm = (f'      <div class="section-metadata">\n        <div><div>style</div><div>{style}</div></div>\n      </div>\n') if style else ''
    return (f'''    <div>
{sm}      <div class="{cls}">
        <div><div><img src="{img}" alt=""></div></div>
        <div><div>{crumb_html}</div></div>
        <div><div><h1>{H.escape(h1txt)}</h1></div></div>
      </div>
    </div>''')

def emit_default(content_html, band=None):
    body = clean_rich(content_html)
    if not body: return ''
    style = 'rt' + (f', band-{band}' if band else '')
    return (f'''    <div>
      <div class="section-metadata">
        <div><div>style</div><div>{style}</div></div>
      </div>
{body}
    </div>''')

def emit_block_rows(name, rows, variants='', band=None, style=None):
    cls = name + (f' {variants}' if variants else '')
    stylestr = style or (f'band-{band}' if band else None)
    sm = (f'''      <div class="section-metadata">
        <div><div>style</div><div>{stylestr}</div></div>
      </div>
''') if stylestr else ''
    rh = '\n'.join('        <div>' + ''.join(f'<div>{c}</div>' for c in r) + '</div>' for r in rows)
    return (f'''    <div>
{sm}      <div class="{cls}">
{rh}
      </div>
    </div>''')

def scan_divs(src, pattern):
    """(start, end, tag_html) for each top-level div matching pattern within src."""
    out=[]; i=0
    while True:
        m=re.compile(pattern).search(src, i)
        if not m: break
        j=m.end(); depth=1
        while depth>0:
            nxt=re.compile(r'<div\b|</div>').search(src, j)
            if not nxt: j=len(src); break
            j=nxt.end()
            depth += 1 if nxt.group(0)=='<div' else -1
        out.append((m.start(), j, m.group(0)))
        i=j
    return out

def emit_cols(comp, band=None):
    rows=[]
    row_spans = scan_divs(comp, r'<div class="(?:row|equalHeight)[^"]*"[^>]*>')
    if not row_spans:
        row_spans = [(0, len(comp), '')]
    for a,b,_ in row_spans:
        rowhtml=comp[a:b]
        cells=[]
        for ca,cb,_ in scan_divs(rowhtml, r'<div class="[^"]*colctrl-[a-z0-9-]*[^"]*"[^>]*>'):
            cells.append(clean_rich(rowhtml[ca:cb], in_block=True))
        cells=[x for x in cells if x]
        if cells: rows.append(cells)
    if not rows: return ''
    # equal row widths per block (D3): pad ragged rows
    w=max(len(r) for r in rows)
    rows=[r+['']*(w-len(r)) for r in rows]
    return emit_block_rows('cols', rows, band=band)

def emit_accordion(comp, band=None):
    rows = []
    titles = re.findall(r'panel-title">\s*([^<]+)', comp)
    bodies = []
    for m in re.finditer(r'class="panel-collapse[^"]*"[^>]*>', comp):
        i = m.end(); depth = 1; j = i
        while depth > 0:
            nxt = re.compile(r'<div\b|</div>').search(comp, j)
            if not nxt: break
            j = nxt.end()
            depth += 1 if nxt.group(0) == '<div' else -1
        bodies.append(clean_rich(comp[m.end():j], in_block=True))
    for t, b in zip(titles, bodies):
        rows.append([H.escape(t.strip()), b])
    if not rows: return ''
    style = 'rt' + (f', band-{band}' if band else '')
    return emit_block_rows('accordion', rows, style=style)

def emit_related(comp):
    rows = []
    heads = re.findall(r'<h[23][^>]*>\s*(?:<span[^>]*>\s*)*([^<]+)', comp)
    cards = []
    for m in re.finditer(r'<div class="[^"]*(?:rel-card|column-box|card)[^"]*"[^>]*>', comp):
        pass
    # generic: anchors wrapping imgs = cards
    for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"', comp):
        cards.append((rewrite_href(m.group(1)), register_media(m.group(2)), H.unescape(m.group(3))))
    # titles: the anchor following each card image (same href)
    titles = {}
    for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>([^<]{10,200})</a>', comp):
        titles.setdefault(rewrite_href(m.group(1)), H.unescape(m.group(2)).strip())
    # rail links: list items with plain links
    rail = []
    ul = re.search(r'<ul[^>]*>(.*?)</ul>', comp[comp.find('See Also') if 'See Also' in comp else 0:], re.S)
    if ul:
        for a in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>([^<]+)</a>', ul.group(1)):
            rail.append((rewrite_href(a.group(1)), H.unescape(a.group(2)).strip()))
    if heads: rows.append([H.escape(heads[0].strip())])
    for href, img, alt in cards:
        t = titles.get(href, alt)
        rows.append([f'<img src="{img}" alt="{H.escape(alt)}">', f'<h3><a href="{href}">{H.escape(t)}</a></h3>'])
    if len(heads) > 1: rows.append([H.escape(heads[1].strip())])
    if rail:
        rows.append([' '.join(f'<a href="{h}">{H.escape(t)}</a>' for h, t in rail)])
    if not rows: return ''
    return emit_block_rows('related', rows)

def emit_youtube(comp, band=None):
    m = re.search(r'data-src="([^"]+)"|src="(https://www\.youtube\.com/embed[^"]+)"', comp)
    if not m: return ''
    url = m.group(1) or m.group(2)
    t = re.search(r'title="([^"]*)"', comp)
    label = H.escape(H.unescape(t.group(1))) if t else 'Video'
    sm = (f'''      <div class="section-metadata">
        <div><div>style</div><div>band-{band}</div></div>
      </div>
''') if band else ''
    return (f'''    <div>
{sm}      <p><a href="{H.escape(url)}">{label}</a></p>
      <div class="video-band"><div><div></div></div></div>
    </div>''')

def emit_imagewithtext(comp):
    tok = None
    for c, t in BG.items():
        if c in comp and t: tok = t; break
    if not tok and 'navy-background' in comp: tok = 'navy'
    fi = re.search(r'featured-image[^"]*"', comp)
    right = bool(fi and 'right' in fi.group(0))
    img = re.search(r'<img[^>]*src="([^"]+)"', comp)
    fts = scan_divs(comp, r'<div class="featured-text[^"]*"[^>]*>')
    txt = clean_rich(comp[fts[0][0]:fts[0][1]]) if fts else ''
    variants = ' '.join(v for v in [tok or 'navy', 'right' if right else ''] if v)
    return emit_block_rows('image-text', [[f'<img src="{register_media(img.group(1))}" alt="">' if img else '', txt]], variants)

def emit_tiles(comp):
    rows = []
    for a, b, _ in scan_divs(comp, r'<div class="image-link-tiles?[ "][^"]*"[^>]*>'):
        t = comp[a:b]
        link = re.search(r'<a[^>]*href="([^"]+)"', t)
        title = re.search(r'class="title[^"]*"[^>]*>([^<]+)', t)
        if not (link and title): continue
        label = H.escape(H.unescape(title.group(1)).strip())
        photo = re.search(r"background-image:\s*url\('?([^')\"]+)'?\)", t)
        if photo:
            rows.append([f'<a href="{rewrite_href(link.group(1))}">{label}</a>',
                         f'<img src="{register_media(photo.group(1))}" alt="">'])
        else:
            bgc = re.search(r'img-container ([a-z-]+)', t)
            tok = next((x for x in TILE_COLORS if bgc and x in bgc.group(1)), 'sky')
            rows.append([f'<a href="{rewrite_href(link.group(1))}">{label}</a>', tok])
    if not rows:
        # flat-color variant without per-tile wrapper (news style)
        for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>.*?img-container ([a-z-]+)".*?class="title"[^>]*>([^<]+)', comp, re.S):
            tok = next((t for t in TILE_COLORS if t in m.group(2)), 'sky')
            rows.append([f'<a href="{rewrite_href(m.group(1))}">{H.escape(H.unescape(m.group(3)).strip())}</a>', tok])
    if not rows: return ''
    return emit_block_rows('image-tiles', rows)

def emit_statemap(comp, page):
    links = re.findall(r'<a[^>]*href="([^"]+)"[^>]*>\s*([^<]+?)\s*</a>', comp)
    seen = set(); items = []
    for h, t in links:
        h2 = rewrite_href(h)
        if 'browse-by-state/' in h2 and h2 not in seen:
            seen.add(h2); items.append((h2, H.unescape(t).strip()))
    if not items: return ''
    report['deviations'].append({'page': page['path'], 'kind': 'statemap->select',
                                 'note': 'desktop US map replaced by the dropdown (Tier-3 recorded deviation)'})
    lis = ''.join(f'<li><a href="{h}">{H.escape(t)}</a></li>' for h, t in items)
    return emit_block_rows('state-select', [[f'<ul>{lis}</ul>']])

def emit_button(comp):
    m = re.search(r'<a[^>]*href="([^"]+)"[^>]*>\s*(.*?)\s*</a>', comp, re.S)
    if not m: return ''
    label = re.sub(r'<[^>]+>', '', m.group(2))
    label = H.unescape(label).strip()
    return f'<p><strong><a href="{rewrite_href(m.group(1))}">{H.escape(label)}</a></strong></p>'

def emit_image(comp):
    m = re.search(r'<img[^>]*src="([^"]+)"[^>]*?(?:alt="([^"]*)")?[^>]*>', comp)
    if not m: return ''
    return f'<p><img src="{register_media(m.group(1))}" alt="{H.escape(H.unescape(m.group(2) or ""))}"></p>'

# ---------------------------------------------------------------- page build
def build_page(page):
    slug = page['slug']
    src = open(f'{CACHE}/{slug}.html').read()
    title = re.search(r'<title>\s*(.*?)\s*</title>', src, re.S)
    title = H.unescape(title.group(1)).strip() if title else page['path']
    desc = re.search(r'name="description" content="([^"]*)"', src)
    desc = H.unescape(desc.group(1)) if desc else ''
    m = re.search(r'<main[^>]*>(.*?)</main>', src, re.S)
    body = m.group(1)
    hend = body.find('</header>')
    fstart = body.find('<footer')
    region = body[hend + 9 if hend >= 0 else 0: fstart if fstart >= 0 else len(body)]
    # scripts/comments can contain <div tokens that derail the balanced walk
    region = re.sub(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->', '', region, flags=re.S)
    comps = walk_components(region)
    is_article = 'news-container' in region
    if not comps and not is_article:
        # empty live shell (legal/statements render nothing): chrome-only page
        if re.sub(r'<[^>]+>', '', region).strip() == '':
            report['deviations'].append({'page': page['path'], 'kind': 'empty-live-shell',
                                         'note': 'live page renders no content — chrome-only import'})
            secs = ''
            doc = HEAD_TMPL.format(title=H.escape(title), desc=H.escape(desc), secs='')
            return doc, None
        return None, 'no-grid'

    sections = []
    pending_default = []
    state = {'hero_done': False, 'stray_crumb': None}

    if is_article:
        nc = scan_divs(region, r'<div class="news-container"[^>]*>')
        art = ''
        for a_, b_, _ in nc:
            art += region[a_:b_]
        h1m = re.search(r'<h1[^>]*>\s*(.*?)\s*</h1>', art, re.S)
        h1t = H.unescape(re.sub(r'<[^>]+>', '', h1m.group(1))).strip() if h1m else title
        datem = re.search(r'class="date"[^>]*>\s*([^<]+)', art)
        imgm = re.search(r'<img[^>]*src="([^"]+)"[^>]*?(?:alt="([^"]*)")?[^>]*>', art)
        descm = scan_divs(art, r'<div class="news-desc"[^>]*>')
        desc_html = '\n'.join(clean_rich(art[a2:b2]) for a2, b2, _ in descm)
        parts = [f'<h1>{H.escape(h1t)}</h1>']
        if datem: parts.append(f'<p>{H.escape(datem.group(1).strip())}</p>')
        img_url = register_media(imgm.group(1)) if imgm else ''
        if imgm: parts.append(f'<p><img src="{img_url}" alt="{H.escape(H.unescape(imgm.group(2) or ""))}"></p>')
        # news metadata contract (Tier 2 — must ride the FIRST import)
        if page['path'].startswith('/news/'):
            extra = ''
            if datem: extra += f'\n        <div><div>publisheddate</div><div>{H.escape(datem.group(1).strip())}</div></div>'
            if page['path'] in FEATURED: extra += '\n        <div><div>category</div><div>centene:featured</div></div>'
            # no explicit image metadata: the pipeline's default og:image is the
            # first content image, rewritten to the public media bus (a raw
            # content.da.live URL 401s for anonymous browsers)
            page['_meta_extra'] = extra
        if desc_html: parts.append(desc_html)
        body_html = '\n'.join(parts)
        # floated portraits become a portrait BLOCK (the pipeline unwraps <em>
        # around pictures, so an inline vehicle cannot survive)
        body_html = re.sub(r'<p><em>(<img[^>]*>)</em></p>',
                           r'<div class="portrait"><div><div>\1</div></div></div>', body_html)

        sn = subnav_style(page['path'])
        art_style = 'article' + (f', {sn}' if sn else '')
        sections.append(f'''    <div>
      <div class="section-metadata">
        <div><div>style</div><div>{art_style}</div></div>
      </div>
{body_html}
    </div>''')
        state['hero_done'] = True
        rc = scan_divs(region, r'<div class="relatedcontent[^"]*"[^>]*>')
        for a3, b3, _ in rc:
            s3 = emit_related(region[a3:b3])
            if s3: sections.append(s3)

    def flush(band=None):
        if pending_default:
            sec = emit_default('\n'.join(pending_default), band)
            if sec: sections.append(sec)
            pending_default.clear()

    def handle(cls, comp, band):
        if cls == 'backgroundcolorbox':
            bgm = re.search(r'background-color-box ([a-z- ]+)"', comp)
            bgtok = None
            if bgm:
                for cc, t in BG.items():
                    if cc in bgm.group(1): bgtok = t; break
            if '<h1' in comp and not state['hero_done']:
                flush(band)
                sections.append(emit_hero(comp, page, state['stray_crumb']))
                state['hero_done'] = True
                # the hero consumed only breadcrumb + h1; pass any sibling
                # content in the same band through the normal pipeline
                for icls, icomp in inner_components(comp):
                    if icls == 'breadcrumb': continue
                    if icls == 'richtext' and '<h1' in icomp:
                        rem = re.sub(r'<h1[^>]*>.*?</h1>', '', icomp, flags=re.S)
                        if re.sub(r'<[^>]+>', '', rem).strip():
                            handle('richtext', rem, bgtok)
                        continue
                    handle(icls, icomp, bgtok)
                flush(bgtok)
                return
            flush(band)
            for icls, icomp in inner_components(comp):
                handle(icls, icomp, bgtok)
            flush(bgtok)
        elif cls == 'richtext':
            pending_default.append(comp)
        elif cls == 'columncontrol':
            if 'id="news-results"' in comp or 'class="newsfeed' in comp:
                handle('newsfeed', comp, band)
                return
            flush(band); s = emit_cols(comp, band)
            if s: sections.append(s)
        elif cls in ('accordion', 'accordiongroup'):
            flush(band); s = emit_accordion(comp, band)
            if s: sections.append(s)
        elif cls in ('relatedcontent', 'relatednews'):
            flush(band); s = emit_related(comp)
            if s: sections.append(s)
        elif cls == 'youtube':
            flush(band); s = emit_youtube(comp, band)
            if s: sections.append(s)
        elif cls == 'imagewithtext':
            flush(band); s = emit_imagewithtext(comp)
            if s: sections.append(s)
        elif cls == 'imagelinktiles':
            flush(band); s = emit_tiles(comp)
            if s: sections.append(s)
        elif cls == 'statemap':
            flush(band); s = emit_statemap(comp, page)
            if s: sections.append(s)
        elif cls == 'button':
            pending_default.append(f'<div>{emit_button(comp)}</div>')
        elif cls == 'image':
            pending_default.append(f'<div>{emit_image(comp)}</div>')
        elif cls == 'newsfeed':
            flush(band)
            if page['path'] == '/featured-stories-archive':
                rows = []
                for card in _arch[:12]:
                    img = f'<img src="{register_media(card["img"])}" alt="">' if card.get('img') else ''
                    rows.append([img, f'<h3><a href="{rewrite_href(card["href"])}">{H.escape(card["title"])}</a></h3>', H.escape(card.get('date', ''))])
                sections.append(emit_block_rows('news-archive', rows))
                report['deviations'].append({'page': page['path'], 'kind': 'newsfeed->news-archive',
                                             'note': 'index-driven archive grid (12/page pagination), 12 harvested fallback rows'})
                return
            feed = NEWSFEED.get(page['slug'], [])
            if feed:
                rows = []
                for card in feed:
                    img = f'<img src="{register_media(card["img"])}" alt="">' if card.get('img') else ''
                    t = H.escape(card.get('title', ''))
                    href = rewrite_href(card.get('href') or '#')
                    row = [img, f'<h3><a href="{href}">{t}</a></h3>']
                    if card.get('date'): row.append(H.escape(card['date']))
                    rows.append(row)
                sections.append(emit_block_rows('cards', rows))
                report['deviations'].append({'page': page['path'], 'kind': 'newsfeed->static-cards',
                                             'note': f'{len(feed)} cards harvested from the rendered AJAX feed (dynamic phase-2 candidate)'})
            else:
                report['deviations'].append({'page': page['path'], 'kind': 'newsfeed-unharvested', 'note': 'feed dropped'})
        elif cls == 'sitemap':
            flush(band)
            s = emit_default(comp, None)
            if s: sections.append(s)
        elif cls == 'breadcrumb':
            if not state['hero_done']: state['stray_crumb'] = comp
        elif cls in ('topheaderbanner', 'cardtabs', 'wrapper'):
            # topheaderbanner is an empty marker; cardtabs renders empty on live
            report['deviations'].append({'page': page['path'], 'kind': f'empty-live-widget:{cls}',
                                         'note': 'renders nothing on the live origin — replicated as captured'})
        else:
            report['deviations'].append({'page': page['path'], 'kind': f'unhandled:{cls}',
                                         'note': 'component dropped — needs follow-up'})

    for cls, comp in comps:
        handle(cls, comp, None)
    flush()

    secs = '\n'.join(sections)
    doc = f'''<body>
  <header></header>
  <main>
    <div>
      <div class="metadata">
        <div><div>Title</div><div>{H.escape(title)}</div></div>
        <div><div>Description</div><div>{H.escape(desc)}</div></div>
      </div>
    </div>
{secs}
  </main>
  <footer></footer>
</body>
'''
    if page.get('_meta_extra'):
        doc = doc.replace('</div></div>\n      </div>', '</div></div>' + page['_meta_extra'] + '\n      </div>', 1)
    # exactly one h1 per page: demote any later h1 to h2
    seen = [0]
    def demote(m):
        seen[0] += 1
        if seen[0] == 1: return m.group(0)
        return m.group(0).replace('<h1', '<h2').replace('</h1>', '</h2>')
    doc = re.sub(r'<h1[^>]*>.*?</h1>', demote, doc, flags=re.S)
    return doc, None

def content_counts(html):
    return {
        'h': len(re.findall(r'<h[1-6]', html)),
        'p': len(re.findall(r'<p[ >]', html)),
        'li': len(re.findall(r'<li[ >]', html)),
        'img': len(re.findall(r'<img', html)),
        'a': len(re.findall(r'<a ', html)),
    }

REDIRECT_STUBS = {'investors-html', 'who-we-are-accreditations-awards-html',
                  'who-we-are-centene-foundation-become-a-partner-html',
                  'who-we-are-diversity-equity-and-inclusion-html', 'who-we-are-our-purpose-html'}

def main():
    manifest = os.environ.get('IMPORT_MANIFEST', '/tmp/wave1.json')
    pages = [p for p in json.load(open(manifest)) if p['slug'] not in REDIRECT_STUBS]
    args = sys.argv[1:]
    if args and args[0] != '--all':
        pages = [p for p in pages if p['slug'] in args]
    done = failed = 0
    for p in pages:
        p['path'] = urllib.parse.urlparse(p['url']).path.replace('.html', '').lower()
        p['path'] = re.sub(r'-{2,}', '-', re.sub(r'[_]+', '-', p['path']))
        cache = f"{CACHE}/{p['slug']}.html"
        if not os.path.exists(cache) or os.path.getsize(cache) < 5000:
            report['pages'].append({'slug': p['slug'], 'status': 'skip-nocache'}); continue
        try:
            doc, err = build_page(p)
        except Exception as e:
            report['pages'].append({'slug': p['slug'], 'status': f'error:{e}'}); failed += 1; continue
        if err:
            report['pages'].append({'slug': p['slug'], 'status': err}); failed += 1; continue
        out = os.path.join(ROOT, 'content', p['path'].strip('/') + '.html')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w').write(doc)
        # content-count acceptance vs live content region
        src = open(cache).read()
        m = re.search(r'</header>(.*?)<footer', re.search(r'<main[^>]*>(.*?)</main>', src, re.S).group(1), re.S)
        lr = m.group(1) if m else ''
        lr = re.sub(r'<nav\b.*?</nav>|<div class="hidden-config".*?</div>|<ul id="stateList".*?</ul>|<select.*?</select>', '', lr, flags=re.S)
        live_counts = content_counts(lr)
        mine = content_counts(doc)
        report['pages'].append({'slug': p['slug'], 'path': p['path'], 'status': 'written',
                                'out': os.path.relpath(out, ROOT), 'live': live_counts, 'mine': mine})
        done += 1
    json.dump(report, open(os.path.join(ROOT, 'stardust/import-report.json'), 'w'), indent=1)
    print(f'written {done}, failed {failed}, media {len(report["media"])}, deviations {len(report["deviations"])}')

if __name__ == '__main__':
    main()
