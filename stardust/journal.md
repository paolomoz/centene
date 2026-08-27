# Journal — centene.com → EDS migration

## 2026-08-26 — EDS site setup + replica pilot (home page)

**Prompt:** "Migrate https://www.centene.com/ to EDS with stardust. Start
with an exact clone of the home page via stardust:replica; set up the EDS
repo and DA folder with the personal eds-new-site skill."

**Setup (eds-new-site):** created `paolomoz/centene` from aem-boilerplate,
fstab → `content.da.live/paolomoz/centene`, added to Code Sync installation.
The bot didn't sync on its own; forced a code-sync job via
`POST admin.hlx.page/code/.../main/*` (202) — synced immediately after.
Boilerplate content seeded + published; both aem.page and aem.live live.

**Replica (bounded-single, index only):**
- Extract: crawl.mjs single-page, live playwright render (HTTP 200, medium
  wait). Vision check ok — note: crawler's consent dismissal does NOT match
  centene's cookieconsent banner (custom Decline/Accept widget).
- Preserve direction: bounded promotion branch — synthesized PRODUCT.md /
  DESIGN.md / DESIGN.json from page JSON + CSS lift. Register EMPTY (pure
  replica).
- CSS lift: full computed-style outline at 1440 and 360
  (stardust/replica/capture/), stylesheets + fonts intercepted. Fonts all
  self-hostable (Roboto woff2 + site TTFs + Font Awesome), no substitution.
- Recreation: clean semantic prototype (canon.css + index.css +
  index-proposed.html), verbatim content, granularity/role parity incl.
  hidden mega-menu, hidden newsfeed config divs, empty spacer richtexts.
- Gate (prototype regime): **1440 → 0.69% pixel, Δ0, 0 structural red;
  360 → 1.50%, Δ−1, 0 structural red.** Both PASS.

**Learnings worth keeping:**
1. Stale localhost server from a previous project poisoned the first
   content-diff (port 8791 already bound, serving another site). Check
   `lsof` before serving.
2. Centene's consent banner needs `--consent "a.cc-btn.cc-dismiss"` on every
   live capture — default dismissal misses it and it repeats at every
   stitch seam (32% false pixel diff).
3. AEM richtext empty paragraphs are `<p><br>\r\n </p>` — the trailing
   space renders a second line box. Same class: footer tagline ends
   `</i> &nbsp;</span>` (nbsp = real 4th line), and the live h1 has `<br>`
   BEFORE the text. Mirror the byte patterns, don't approximate.
4. Live clearfix wrappers contain component margins — `display: flow-root`
   on every richtext/button wrapper reproduces the non-collapsing behavior.
5. `.hero-text` needs the full live rule incl. `bottom:-20%` — it changes
   the resolved height and thus the translateY centering (~2% of the page).
6. Images: live keeps `margin-left:87px` on the serving-members image at
   360 (overflows viewport) — don't "fix" it; and `height:auto` is required
   since captured `<img>` carry width/height attrs.
7. Desktop nav has NO submenu interaction on live (hover = underline only);
   submenus are drawer-only on mobile.

**Open items / next:** deploy phase (stardust:deploy) for the gated
archetype → EDS blocks + DA content; published-origin gate re-run against
main--centene--paolomoz.aem.page. Inline analytics script text (2 🟡) and
the 20px doc tail are documented capture-state items.

## 2026-08-26 (later) — deploy phase (stardust:deploy)

Prototype approved by user; converted to vanilla-EDS blocks (hero, intro,
cards, feature x2 variants, panel x2 variants, careers + centene chrome),
content authored as DA body fragments, 12 editorial images uploaded to DA
media, published to main--centene--paolomoz.aem.page + .aem.live.

Published-origin gate (vs live centene.com): 1440 → 3.63%/Δ1px, 360 →
2.97%/Δ0px, CLS 0.0009, all delivered checks green. Fix rounds: global
border-box, picture-wrapper descender, footer specificity/whitespace/BFC
class (5 lessons in eds-conversion-log.md).

## 2026-08-27 — prepare-migration Phase 1 + 4.5 (full-site plan)

Sitemap discovered via robots (`/.sitemap.xml`, 212 URLs). Full prep crawl:
206/207 live-rendered (1 DUP folded, /careers.html 403 = external-jobs stub).
All pages typed into state.json (9 types; provenance OK on 206/206).
Vision spot-checks surfaced three template facts the pilot didn't show:
interior breadcrumb, products sub-nav band, news listing's press-release
rail (external IR feed → Tier-3 static decision).

Artifacts: stardust/migration-plan.md (the plan), dynamic-blocks-map.md
(2 dynamic listings + search on 2 indexes; metadata contract for articles),
helix-query.yaml (news-index, site-index), DESIGN.json modules[] (16).
Next: confirm plan → archetype prototypes (content, state, article,
listing, pillar, utility, form, search) via replica recreation + gate.
