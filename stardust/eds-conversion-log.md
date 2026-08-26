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
- Favicon: bounded extract captured none; boilerplate default retained
  (noted, not invented).

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
