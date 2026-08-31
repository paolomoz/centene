#!/usr/bin/env python3
"""import-state.py — wave-3 state sibling builder.
Clones the gated state-archetype authoring (alabama): hero-interior trail +
statement lede + icon-cards facts + product-brand bands.
"""
import re, os, sys, json, html as H, urllib.parse, importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location('imp', os.path.join(ROOT, 'stardust/scripts/import-sibling.py'))
imp = importlib.util.module_from_spec(spec)
import types
src_code = open(os.path.join(ROOT, 'stardust/scripts/import-sibling.py')).read()
src_code = src_code.replace("if __name__ == '__main__':\n    main()", '')
ns = {'__file__': os.path.join(ROOT, 'stardust/scripts/import-sibling.py')}
exec(compile(src_code, 'import-sibling', 'exec'), ns)
register_media = ns['register_media']
rewrite_href = ns['rewrite_href']
clean_rich = ns['clean_rich']
walk = ns['walk_components']
inner = ns['inner_components']
scan_divs = ns['scan_divs']
report = ns['report']

DA = ns['DA']; CACHE = ns['CACHE']

def cell_join(parts):
    return ''.join(parts)

def build_state(page):
    src = open(f"{CACHE}/{page['slug']}.html").read()
    title = re.search(r'<title>\s*(.*?)\s*</title>', src, re.S).group(1).strip()
    title = H.unescape(re.sub(r'\s+', ' ', title))
    dm = re.search(r'name="description" content="([^"]*)"', src)
    desc = H.unescape(dm.group(1)) if dm else ''
    m = re.search(r'<main[^>]*>(.*?)</main>', src, re.S)
    b = m.group(1)
    region = b[b.find('</header>') + 9: b.find('<footer')]
    region = re.sub(r'<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->', '', region, flags=re.S)

    secs = []
    # hero
    h1m = re.search(r'<h1[^>]*>(.*?)</h1>', region, re.S)
    h1raw = h1m.group(1)
    h1t = H.unescape(re.sub(r'<[^>]+>', '', h1raw)).replace('\xa0', ' ').strip()
    trail = ' trail' if '<br' in h1raw else ''
    crumbs = []
    bc = re.search(r'<ol[^>]*>(.*?)</ol>', region, re.S)
    active = ''
    for li in re.findall(r'<li[^>]*>(.*?)</li>', bc.group(1), re.S):
        a = re.search(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', li, re.S)
        name = H.unescape(re.sub(r'<[^>]+>', '', a.group(2) if a else li)).strip()
        if a: crumbs.append((a.group(1), name))
        elif name: active = name
    crumb = ' '.join(f'<a href="{rewrite_href(h)}">{H.escape(n)}</a>' for h, n in crumbs)
    if active: crumb += f' {H.escape(active)}'
    secs.append(f'''    <div>
      <div class="section-metadata">
        <div><div>style</div><div>subnav-2</div></div>
      </div>
      <div class="hero-interior{trail}">
        <div><div><img src="{DA}/mission-banner.png" alt=""></div></div>
        <div><div>{crumb}</div></div>
        <div><div><h1>{H.escape(h1t)}</h1></div></div>
      </div>
    </div>''')

    # statement lede
    st = re.search(r'<p[^>]*>\s*<span class="centene-h4">\s*(?:<span class="brand-color">)?\s*(.*?)\s*(?:</span>)?\s*</span>\s*</p>', region, re.S)
    if st:
        t = H.unescape(re.sub(r'<[^>]+>', '', st.group(1))).strip()
        secs.append(f'''    <div>
      <div class="statement lede">
        <div><div>{H.escape(t)}</div></div>
      </div>
    </div>''')

    # intro paragraphs between the statement and the facts eyebrow (some
    # states carry extra editorial copy — texas et al.)
    if st:
        seg_start = st.end()
        ebm = re.search(r'<span class="centene-h5">', region)
        seg_end = ebm.start() if ebm else seg_start
        intro = []
        for pm in re.finditer(r'<p[^>]*>(.*?)</p>', region[seg_start:seg_end], re.S):
            ih = pm.group(1)
            if '<img' in ih or 'centene-h' in ih: continue
            t = H.unescape(re.sub(r'<[^>]+>', '', ih)).replace('\xa0', ' ').strip()
            if t: intro.append(t)
        if intro:
            ps = '\n'.join(f'<p>{H.escape(t)}</p>' for t in intro)
            secs.append(f'''    <div>
      <div class="section-metadata">
        <div><div>style</div><div>rt</div></div>
      </div>
{ps}
    </div>''')

    # facts: eyebrow + icon cards
    eb = re.search(r'<span class="centene-h5">\s*(?:<span class="brand-color">)?([^<]+)', region)
    cards = []
    for a2, b2, _ in scan_divs(region, r'<div class="colctrl-40[^"]*"[^>]*>'):
        card = region[a2:b2]
        if 'CEN_Icon' not in card and '/icons/' not in card: continue
        img = re.search(r'<img[^>]*src="([^"]+)"', card)
        bt = re.search(r'<(?:b|strong)>\s*(?:<span[^>]*>)?([^<]+)', card)
        lines = []
        for pm in re.finditer(r'<p[^>]*>(.*?)</p>', card, re.S):
            txt = H.unescape(re.sub(r'<[^>]+>', '', pm.group(1))).replace('\xa0', ' ').strip()
            if not txt or (bt and txt == bt.group(1).strip()): continue
            if img and pm.group(1).find('img') >= 0: continue
            ital = bool(re.search(r'<(?:i|em)\b', pm.group(1))) or txt.startswith('*')
            lines.append((txt, ital))
        cells = [f'<img src="{register_media(img.group(1))}" alt="">' if img else '',
                 H.escape(bt.group(1).strip()) if bt else '']
        linehtml = ''.join(f'<p>{"<em>" + H.escape(t) + "</em>" if it else H.escape(t)}</p>' for t, it in lines)
        cells.append(linehtml)
        cards.append(cells)
    if cards:
        rows = ''
        if eb: rows += f'        <div><div><h2>{H.escape(eb.group(1).strip())}</h2></div></div>\n'
        rows += '\n'.join('        <div>' + ''.join(f'<div>{c}</div>' for c in card) + '</div>' for card in cards)
        secs.append(f'''    <div>
      <div class="icon-cards facts">
{rows}
      </div>
    </div>''')

    # brand bands: split per centene-h2 heading (some states put several
    # brands in one bgbox)
    band_segments = []
    for a2, b2, _ in scan_divs(region, r'<div class="backgroundcolorbox[^"]*"[^>]*>'):
        box = region[a2:b2]
        if 'centene-h2' not in box or 'box-shadow' not in box: continue
        starts = [mm.start() for mm in re.finditer(r'<h2[^>]*>\s*<span class="centene-h2">|<span class="centene-h2">', box)]
        # dedupe overlapping matches
        uniq = []
        for s0 in starts:
            if not uniq or s0 - uniq[-1] > 50: uniq.append(s0)
        for i0, s0 in enumerate(uniq):
            e0 = uniq[i0 + 1] if i0 + 1 < len(uniq) else len(box)
            band_segments.append(box[s0:e0])
    for band in band_segments:
        h2 = re.search(r'<span class="centene-h2">\s*(?:<span[^>]*>)?([^<]+)', band)
        imgs = re.findall(r'<img[^>]*class="[^"]*box-shadow[^"]*"[^>]*src="([^"]+)"|<img[^>]*src="([^"]+)"[^>]*class="[^"]*box-shadow', band)
        logos = [x or y for x, y in imgs]
        lm = re.search(r'<a[^>]*href="([^"]+)"[^>]*>((?:(?!</a>).)*?Learn more(?:(?!</a>).)*?)</a>', band, re.S)
        # description: rd-t-16 paragraphs not inside learn-more
        descs = []
        for pm in re.finditer(r'<p[^>]*>(.*?)</p>', band, re.S):
            inner_html = pm.group(1)
            if '<a' in inner_html or '<img' in inner_html or 'centene-h' in inner_html: continue
            t = H.unescape(re.sub(r'<[^>]+>', '', inner_html)).replace('\xa0', ' ').strip()
            if t: descs.append(t)
        lis = [H.unescape(re.sub(r'<[^>]+>', '', x)).strip() for x in re.findall(r'<li[^>]*>(.*?)</li>', band, re.S)]
        lis = [x for x in lis if x]
        struts = len(re.findall(r'strut|<p>\s*(?:&nbsp;|\xa0)\s*</p>', band))
        nstruts = len(re.findall(r'<p[^>]*>\s*(?:&nbsp;|\xa0|\s)*</p>', band))
        variant = ' struts' if nstruts >= 2 else ''
        lmtext = H.unescape(re.sub(r'<[^>]+>', '', lm.group(2))).replace('External Link', '').strip() if lm else ''
        imgcell = ''.join(f'<img src="{register_media(u)}" alt="{H.escape(h2.group(1).strip() if h2 else "")} logo">' for u in logos)
        desccell = ''.join(f'<p>{H.escape(d)}</p>' for d in descs)
        if lm: desccell += f'<p><strong><em><a href="{rewrite_href(lm.group(1))}">{H.escape(lmtext)}</a></em></strong></p>'
        listcell = '<ul>' + ''.join(f'<li>{H.escape(x)}</li>' for x in lis) + '</ul>' if lis else ''
        secs.append(f'''    <div>
      <div class="product-brand{variant}">
        <div><div>{H.escape(h2.group(1).strip()) if h2 else ''}</div></div>
        <div>
          <div>{imgcell}</div>
          <div>{desccell}</div>
          <div>{listcell}</div>
        </div>
      </div>
    </div>''')

    body = '\n'.join(secs)
    return f'''<body>
  <header></header>
  <main>
    <div>
      <div class="metadata">
        <div><div>Title</div><div>{H.escape(title)}</div></div>
        <div><div>Description</div><div>{H.escape(desc)}</div></div>
      </div>
    </div>
{body}
  </main>
  <footer></footer>
</body>
'''

def main():
    pages = json.load(open(os.environ.get('IMPORT_MANIFEST', '/tmp/wave3.json')))
    outrep = {'pages': [], 'media': report['media']}
    for p in pages:
        p['path'] = urllib.parse.urlparse(p['url']).path.replace('.html', '').lower()
        try:
            doc = build_state(p)
        except Exception as e:
            outrep['pages'].append({'slug': p['slug'], 'status': f'error:{e}'}); continue
        out = os.path.join(ROOT, 'content', p['path'].strip('/') + '.html')
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w').write(doc)
        outrep['pages'].append({'slug': p['slug'], 'path': p['path'], 'status': 'written', 'out': os.path.relpath(out, ROOT)})
    json.dump(outrep, open(os.path.join(ROOT, 'stardust/import-state-report.json'), 'w'), indent=1)
    done = sum(1 for x in outrep['pages'] if x['status'] == 'written')
    print(f"written {done}/{len(pages)}, media {len(report['media'])}")

if __name__ == '__main__':
    main()
