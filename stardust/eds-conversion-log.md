# EDS conversion log — centene.com home (replica pilot)

Single-page conversion of the gated replica prototype
(`stardust/prototypes/index-proposed.html`, 1440: 0.69%/Δ0, 360: 1.50%/Δ−1)
to vanilla aem-boilerplate blocks + DA content. Runtime contract:
`stardust/runtime-contract.json` (current boilerplate main, formatted-only
buttonization, `p.button-wrapper`, wrapTextNodes active).

## Locked names + decode tiers (Step 2 / 2b)

| Prototype section (`data-section`) | Block | Tier | Notes |
|---|---|---|---|
| hero | `hero` | template-slotted | banner image (editorial, authorable) + tagline `<p>` with `<b>`; no heading (mirrors live — page h1 lives in intro) |
| intro ("This is Centene") | `intro` | template-slotted | gray band + navy box: YouTube URL (plain link, auto-consumed by block), page `<h1>`, lede, white CTA |
| cards ("Featured Stories") | `cards` | reconstructive | section head = default content (styled in place); one row per card (image / linked title / date); trailing link-only row = the View-All CTA band |
| feature-members (purple) + feature-investors (leaf) | `feature` | template-slotted | ONE block, variants `members` (text left / image right, purple texture bg) and `investors` (image left / text right, leaf green) |
| panel-investing (truck) + panel-sustainability (lake) | `panel` | template-slotted | ONE block, variants `investing` (box right, 50%) and `sustainability` (box left, 40%); band photo = editorial authorable img rendered as bg layer; translucent white box = fixed CSS asset |
| careers | `careers` | template-slotted | 4 boxes: navy(#262768) text / centeam photo / DEI photo / cerise text; photos editorial authorable |
| header/footer | `header` / `footer` blocks | template-slotted (D12) | content in `/nav` + `/footer` docs; search form + drawer wired in block JS |

- D1 triage: no bare-prose sections on this page (every band is a bespoke
  composition or repeat group); the only default content is the cards
  section head ("Featured Stories").
- D11: `hero` and `cards` mirror Block Collection names/shapes; the rest are
  bespoke compositions (no collection match).
- Component-model shapes: hero/intro/feature/panel/careers = simple
  (one property per row); cards = container (one row per card).

## Media policy

- **Editorial (DA `/media/centene/`, authored `content.da.live` imgs):**
  hero banner, 3 news card images, serving-members png, investor handshake
  png, Ambetter truck jpg, sustainability lake jpg, careers-centeam jpg,
  DEI jpg, nav logo (centene_logo_2023.jpg), footer reverse logo.
- **Fixed CSS assets (repo `img/centene/`, root-relative):**
  90whitebox.png (translucent card bg), purple-background-2025.png (brand
  texture), icon-search.svg, icon-dropdown-gray/white.svg.
- Favicon: fixed 2026-08-27 — the bounded (`--single`) extract skips Phase 3
  (brand-surface extraction), which owns favicon capture, so nothing landed in
  `stardust/current/assets/` and deploy's favicon step correctly skipped.
  Backfilled from the live page's declared icon
  (`/content/dam/centenedotcom/logos/centene-favicon.ico`) into
  `stardust/current/assets/favicon.ico` + repo-root `favicon.ico`
  (`.ico` → auto-served, no head.html edit). PLUGIN GAP: bounded extract /
  replica bounded branch should capture the favicon (one cheap fetch), or
  deploy's skip should warn loudly instead of silently.

## Fonts

All faces self-hosted, no licensing alert needed (Roboto = Apache 2.0,
Font Awesome Free = OFL/MIT): Roboto woff2 400/500/700 (family `Roboto`),
site TTF-derived faces `Roboto-Regular` / `Roboto-Bold` / `Roboto-Italic`,
FA6 Free 900 + Brands 400. Stock `roboto-fallback` metric calibration in
styles.css reused (brand face IS Roboto). Arial is a system face (footer
base) — no self-hosting needed. Roboto-Italic is display-secondary
(nav/footer tagline): metric fallback = roboto-fallback (same family
metrics), documented trade-off.

## Section spacing

The live page's empty richtext spacer bands (71.42px, white) between
purple→truck, sustainability→investors, investors→footer are modeled as
section margins in block CSS (not authorable spacers — D1). The 20px white
doc tail after the footer rides `footer` block CSS.

## Published-origin gate plan

Pixel: live centene.com vs published origin (stitch + compare, per
breakpoint). Content: prototype ↔ published (`content-diff --profile eds`)
— live-main includes chrome while EDS main does not, so the
live-vs-published content scope is asymmetric by construction; the
prototype↔live equivalence was proven in the prototype gate.

## Deploy outcome (2026-08-26)

Published: `/` `/nav` `/footer` on main--centene--paolomoz.aem.page (+ .aem.live).

Gates: davids-model-lint 0 red (3 justified 🟡: hero + intro are bespoke
compositions, not default-content candidates; the cards link-only trailing
row is the deliberate View-All CTA band). block-roundtrip closed on every
block. qa-gate PASS (schema repeat expectations for the 4 template-slotted
sections cleared — the clusterer had misread layout columns as authorable
units; their compositions are fixed and verified by roundtrip).

Published-origin gate: 1440 → 3.63% pixel / Δ1px; 360 → 2.97% / Δ0px;
CLS 0.0009. Content CTAs 8/8; chrome verified by direct link-count probe
(the prototype↔published content-diff's 62 reds are pure scope asymmetry:
the live site nests chrome inside <main>, EDS does not).

Pipeline lessons this run:
1. The EDS boilerplate ships NO global border-box — a bootstrap-style
   %-width + padding grid silently wraps every column (cards 2+1, features
   stacked, footer wrapped) while typography still looks right. One
   foundation rule fixed +1731px of document height.
2. The pipeline strips authored dimensions and wraps imgs in <picture>:
   pin editorial image sizes in block CSS and zero the picture wrapper's
   inline baseline descender (line-height: 0 on the image paragraph).
3. The pipeline drops whitespace-only content (<p>&nbsp;</p>, trailing
   <br>&nbsp;): model those live line boxes as block CSS (padding-bottom /
   margins), never as authored whitespace.
4. Own-goal to avoid: a `footer .footer > div` reset out-specifies
   `footer .f-root` — don't ship a wrapper reset you then have to beat.
5. Floats create BFCs that contain child margins; when a media query
   un-floats columns, add display: flow-root to keep the containment.
6. Background-layer blocks must NOT copy the pipeline's fallback <img src>
   into CSS backgrounds verbatim — it is the 750px rendition and renders
   soft at full-bleed widths. Rewrite the width param to 2000 (media_ URLs
   accept any width). <picture>-rendered images are unaffected (the 2000w
   source wins on desktop). Post-fix 1440 gate: 3.63% → 2.63%.

## content archetype — /who-we-are/our-mission (2026-08-28)
Published-origin gate PASS: 1440 → 1.50% / Δ−1 · 360 → 2.98% / Δ0.
Fix chain from anchor diffs: (1) hero-interior `.richtext { display: flow-root }` (h1 top-margin collapse, −20);
(2) footer `.doc-tail` removed site-wide — the 20px band was the live HOME capture's dismissed-consent residue,
not design (interior live pages end at the footer; home re-gate 2.62% with expected Δ21);
(3) picture-descender: `line-height: 0` belongs on the line-box CONTAINER — on icon-cards it was the `<p>` (worked);
on related the first attempt put it on the inline `<a>` (no-op, the card div's strut survives) → fixed by making
`a`/`picture`/`img` display:block; (4) statement wrap-fork pin: live wraps the first lede 13 lines at 360 vs our 12
at byte-identical text/metrics → `min-height: 464px` @ ≤400px (ledger pattern).

## state archetype — /products-and-services/browse-by-state/alabama (2026-08-28)
Published-origin gate PASS: 1440 → 1.25% / Δ0 · 360 → 2.60% / Δ1.
New block: `product-brand` (h2 + logo card w/ shadow + description + learn-more + bullet list; variants
`struts`, `ambetter` wrap-fork pin). Reused: hero-interior (+`trail` variant: 57px trailing h1 line),
statement (+`lede` variant), icon-cards `facts` (+91.42px footnote strut padding).
Fix chain: (1) **block-name collision** — block `brand-band` leaked `padding: 25px 10%` and ul-dot styles into
the header's internal `.brand-band` class → renamed `product-brand`; (2) statement wrap-fork pin had leaked into
the lede variant's trailing strut (+438px @360) → re-scoped to section style class `pin-lede-13` on our-mission;
(3) `.cmp-image` flow-root (img 27px bottom margin collapsed with wrapper's 20px → −20/band);
(4) breadcrumb inter-item whitespace text nodes (live wraps the crumb to 2 lines at 360);
(5) facts footnote: trailing `<br>` renders no line box — struts only (91.42 not 114.28).

## article archetype — /news/achieving-whole-health-… (2026-08-28)
Published-origin gate PASS: 1440 → 1.21% / Δ0 · 360 → 2.83% / Δ0.
No block: pure default content + section style `article` (D1). scripts.js gains `decorateExternalLinks`
(default-content scope). Fixes: (1) idempotency guard on ALL external-link decoration — `loadFragment`
runs `decorateMain` on the footer fragment, so footer links got a second icon and a nav link wrapped (+19);
(2) date-line margin rule needed `.default-content-wrapper h1 + p` specificity. `publisheddate` meta authored
per the news-index contract.

## listing archetype — /news (2026-08-28)
Published-origin gate PASS: 1440 → 1.27% / Δ2 · 360 → 2.05% / Δ0.
New blocks: `news-hub` (60/40 composition; card grid is INDEX-DRIVEN from /news-index.json filtered
category=centene:featured with authored-rows fallback until wave 2 populates it — per dynamic-blocks-map) and
`image-tiles` (color-token link tiles). The query index is verified live (article import appears in
/news-index.json). Fixes: press-rail links must NOT get external glyphs (live IR markup has none — icon caused
a +24 wrap fork); tile mobile geometry 122px + 20px margin; lint refined to exempt youtube channel URLs from
the embed red (false positive on the Videos tile).

## pillar archetype — /products-and-services (2026-08-28)
Published-origin gate PASS on first deploy: 1440 → 1.23% / Δ0 · 360 → 1.73% / Δ0.
New blocks: `wave-band` (navy wave banner; Browse-by-State <select> built from an authored 51-link list,
onchange navigation), `product-columns` (h2 + eyebrow + 3 pill-button columns), `product-cards` (colored
equal-height cards; color + `pin-1line` wrap-fork pin ride an authored token cell). Reused hero-interior
(+`pillar` h1-idiom variant: 57px leading / 114px trailing br lines) and the related block unchanged.

## utility archetype — /privacy-policy (2026-08-28)
Published-origin gate PASS on pixels: 1440 → 4.03% / Δ−40 · 360 → 7.56% / Δ185 (residuals documented — the
97px live indents are modeled as nested-blockquote 80px; wrap forks in the longest sections; archetype
prototype itself carried a Δ10 residual here). New block: `table` (plain). The page surfaced FIVE pipeline
transforms that will matter for every long-form transported sibling:
(1) whitespace-only paragraphs are dropped → spacer vehicle `<p><code>&nbsp;</code></p>`;
(2) trailing space+NBSP is trimmed → same code vehicle inline;
(3) inline `margin-left` indents are stripped → `<blockquote>` (nested per 40px level);
(4) heading ids are slugified from text WITH leading digits dropped — intra-page anchors must match;
(5) legal list styling must be scoped section-wide (not `.default-content-wrapper`) to reach table-block cells.

## form archetype — /contact (2026-08-28)
Published-origin gate PASS: 1440 → 2.35% / Δ−2 · 360 → 5.25% / Δ2.
New block: `accordion` (title|body rows, +/− glyph toggle, Glyphicons Halflings self-hosted).
Key decode: live's every-richtext-is-flow-root means component-boundary margins never collapse; merged
EDS default content must mirror with `p + h2 { margin-top: 40px }` (block boundaries already supply the
uncollapsed margin — first h2 after a block reverts to 20).

## search archetype — /search (2026-08-28)
Published-origin gate PASS on first deploy: 1440 → 1.87% / Δ0 · 360 → 4.12% / Δ1.
New block: `search` — client-side query over /site-index.json with ?q= wiring; functionally verified
("mission" → /who-we-are/our-mission). Both query indexes (news-index, site-index) are now live and consumed.

# PHASE 1 COMPLETE (2026-08-28)
All 7 interior archetypes converted to EDS and green on the published-origin gate:
content 1.50/2.98 · state 1.25/2.60 · article 1.21/2.83 · listing 1.27/2.05 · pillar 1.23/1.73 ·
utility 4.03/7.56 (documented residuals) · form 2.35/5.25 · search 1.87/4.12 (1440%/360%).
Block library: hero-interior (sky/navy/compact/trail/pillar), statement (lede), icon-cards (how/facts),
video-band, related, product-brand, news-hub, image-tiles, wave-band, product-columns, product-cards,
table (plain), accordion, search + section styles article/legal/contact + header subnav + footer.
Next: Phase 2 — stardust:migrate sibling fan-out in waves (content+utility+pillar ~100 → articles+listing 49
with publisheddate/category from first import → states 51 → forms+search 5).

# PHASE 2 — WAVE 1 (content + utility + pillar siblings) — 2026-08-29
92 pages imported and LIVE (81 content, 9 utility, 2 pillar; 5 live URLs are redirect stubs recorded for
rollout's redirect config). Importer: `stardust/scripts/import-sibling.py` — transforms cached live AEM-grid
pages into EDS content via the Phase-1 vocabulary (hero-interior/statement/cols/accordion/related/video-band/
image-text/image-tiles/state-select + rt section transform table). 290 media assets bundled to DA.
New blocks: `cols`, `state-select`, `image-text`; image-tiles gained photo tiles; video-band gained navy.
Verification: David's-Model lint 0 red across the tree; 92/92 delivered-plain checks (1 h1, 0 about:error);
runtime smoke on 8-page sample clean; text-coverage spot-checks; anchor spot-check on history Δ-132/4823
(timeline trailing-spacer residual, logged).
Importer decodes worth keeping: scripts/comments must be stripped before balanced-div walks; pipeline strips
<br> inside headings (emit as spacer-p vehicle); DA rejects SVGs > 40KB (rasterize); extension-less CDN
renditions need hashed names; centene-hN spans map to heading levels with the <hN><strong> display convention.
