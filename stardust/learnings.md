# Learnings ledger — centene.com replica + deploy (2026-08-26/27)

Status: HARVESTED 2026-08-28 into adobe/skills stardust 0.18.3 (merged to
main 2026-08-29, PR adobe/skills#313, per the improvement plan
`plugins/stardust/notes/improvement-plan-2026-08-rwe-centene.md`): items 1
(gate.sh identity assertion + port-verify doc lines), 2 (crawl.mjs consent
text-match fallback), 3 (live-embed residual class), 4 (crawl.mjs favicon
capture in all modes + loud deploy skip), 5 (AEM-classic byte patterns,
recreation-procedure), 6 (flow-root clearfix containment, both docs), 7
(deploy border-box #106), 8 (rendition-width background rule #110), 9
(`<picture>` descender #111), 10 (whitespace-only content #112), 11
(flow-root mobile override #113), 12 (wrapper-reset specificity #114).
Items marked ⇄ RWE-N independently recurred in the rwe.com session
(`/Users/paolo/stardust/2026-08/rwe/rwe/stardust/learnings.md`) — two
sessions hitting the same failure is the strongest harvest signal.

## Recurred across sessions (harvest first)

1. **Stale localhost :8791 poisoned a gate round.** ⇄ RWE-11 (identical
   incident, same port, opposite direction: here the RWE server held the
   port and content-diff measured the RWE prototype as "the build"). The
   skill docs suggest the same port everywhere, guaranteeing cross-project
   collisions. Fix for the plugin: before any gate, assert a page-specific
   marker string on the served URL (or `lsof` the port / derive a
   per-project port from the repo name).
2. **Consent dismissal needs a visible-button text-match fallback.**
   ⇄ RWE-4. centene's cookieconsent widget (`a.cc-btn` Decline/Accept) was
   missed by both crawl.mjs (banner baked into the ground-truth screenshot)
   and stitch-shot (banner repeated at all 7 chunk seams → 32% false pixel
   diff; excluded as instrument-invalidated). A text match on
   Accept/Accept all/Allow/Decline is cheap, generic, and would have
   prevented both sessions' incidents.
3. **Live embeds: load the SAME embed on both sides.** ⇄ RWE-12. The
   "This is Centene" YouTube iframe was replicated same-src; the embed
   canceled out in the pixel diff. Confirms RWE's proposed
   recreation-procedure.md addition.

## Extract / replica (bounded path)

4. **Bounded (`--single`/`--pages`) extract silently drops the favicon.**
   Favicon capture lives in extract Phase 3 (brand surface), which bounded
   runs skip; deploy's favicon step then skips silently ("never invent one").
   Fix: capture `link[rel~=icon]` in crawl.mjs itself (one cheap fetch), or
   make deploy's skip a loud warning.
5. **AEM-classic richtext byte patterns are load-bearing.** Empty spacer
   paragraphs render TWO line boxes (`<p><br>\r\n </p>` — br + collapsible
   space still renders), headings lead with `<br>` (`<h1><br>\r\nTitle`),
   and a footer tagline ends `</i> &nbsp;</span>` (nbsp = real 4th line).
   Approximating these as `<p><br></p>` measures 20–36px short per instance.
   Candidate for recreation-procedure.md: "mirror richtext byte patterns,
   and diff innerHTML when a wrap-count mismatch survives width parity."
6. **`display: flow-root` reproduces AEM clearfix margin containment.** One
   rule replicated the live page's non-collapsing component margins across
   every section (fixed −48/−20px per-section errors in one move).

## Deploy (EDS pipeline)

7. **The boilerplate ships no global `border-box`.** A %-width + padding
   grid ported from any bootstrap-era source silently wraps every column
   (cards 2+1, 2-col bands stacked, footer wrapped: +1731px doc height)
   while all text gates stay green. Step 3 (foundation) should either add
   the reset or warn when block CSS uses `width: N% + padding`.
8. **Never copy the pipeline's fallback `<img src>` into a CSS background.**
   It is the 750px rendition; full-bleed background layers render soft.
   Rewrite the width param (`width=2000`) — `<picture>`-rendered images are
   unaffected. This is a natural companion to deploy's existing
   "images → background LAYER" rule, which doesn't mention rendition width.
9. **The `<picture>` wrapper adds an inline baseline descender** (+6/+7px
   per image paragraph vs a bare `<img>` source site); `line-height: 0` on
   the image paragraph restores parity.
10. **Pipeline drops whitespace-only authored content** (`<p>&nbsp;</p>`,
    trailing `<br>&nbsp;`): model those live line boxes as block CSS
    (padding/margins), never as authored whitespace — the encode side of
    item 5.
11. **Un-floating columns in a media query loses the float's BFC margin
    containment** — add `display: flow-root` to the mobile override or the
    last child's margin escapes (−10px only at mobile).
12. **Own-goal: a wrapper reset can out-specify the block's own rules**
    (`footer .footer > div` beats `footer .f-root`) — padding silently 0.

## Corroborating RWE items that would likely bite here later

- RWE-6 (`header { height: var(--nav-height) }` collapses block-internal
  `<header>`): avoided here only because no block emits `<header>`; the
  prototype DID use semantic `<header>`, so a straight port would have hit it.
- RWE-9 (mobile override loses to desktop variant specificity): the centene
  `feature`/`panel` variant CSS has exactly this shape; worth the block-brief
  warning before the site-wide rollout adds more variants.
- RWE-8 (whitespace-join classifier on JS-built DOM): all centene blocks are
  `append()`-built; round-trips passed here but the false-red class is live.

## 2026-08-28 — published gate, content archetype (post-HARVEST candidates)
- **line-height:0 descender fix must target the line-box container.** Putting `line-height: 0` on an inline
  child (the `<a>` wrapping the picture) is a no-op — the strut belongs to the block container generating the
  line box. Either put lh0 on the `<p>`/div container, or make the whole media chain (`a`, `picture`, `img`)
  `display: block`. First attempt on the related block was a silent no-op (RWE-10 flavor: verify the fix moved
  the number, not that the CSS shipped).
- **Chrome artifacts in a live capture can masquerade as design.** The home page's 20px white tail below the
  footer was residue of the dismissed consent banner in the capture, replicated as a `.doc-tail` element and then
  wrongly shipped site-wide (interior live pages have no tail → +20 on every interior gate). Rule: before
  replicating a band that only appears on ONE captured page, check whether a dismissed overlay/consent widget
  explains it.
- **Wrap-fork pins recur on the published origin even when the prototype matched.** Byte-identical text at
  identical metrics wrapped 13 lines on live vs 12 on EDS (360). Same ledger remedy (min-height pin, scoped to
  the gate width) — expect roughly one per text-heavy archetype at mobile.
- **Block names must not collide with template chrome classes.** A block named `brand-band` global-loads
  `.brand-band { padding: 25px 10% ... }` on any page using it — and the header template (lifted from the
  source site) also uses `.brand-band` internally → the header logo band inherited block padding + list-dot
  styles. Deploy should lint new block names against class names used in header/footer/template CSS before
  scaffolding. (Field cost: one full gate iteration.)
- **Instance-specific wrap-fork pins must ride section-metadata style classes, not block-type selectors.**
  The our-mission pin (`.statement .richtext > p:nth-of-type(3)`) silently hit the state page's lede variant
  trailing strut (+438px). Pins are per-INSTANCE facts; scope them to an authored section style class.
- **AEM classic `.cmp-image` wrappers need flow-root in recreations** — image margins (27px bottom) collapse
  through unstyled wrapper divs and swallow the wrapper's own margin.
- **Breadcrumbs built element-by-element need explicit inter-item whitespace** (live markup newlines = one
  space per gap); without it long crumbs stay on one line at 360 while live wraps to two.
- **Any main-scope decorator in scripts.js also runs on chrome fragments** (`loadFragment` → `decorateMain`),
  so content decoration must be idempotent or scoped away from fragment content — the footer's own externalize
  double-iconed links and wrapped a nav row (+19px, article gate).
- **davids-model-lint false positive: channel/profile URLs.** `youtube.com/user|channel|c|@` links are
  navigation targets (a "Videos" tile), not embeddable media — the D1 embed red should exempt them.
  Patched in the project copy; upstream candidate.
- **Replicate captured decoration, not the site's own rules.** The live IR press rail is third-party AJAX
  markup with NO external-link glyphs even though every other investors.* link on the site has one. Blanket
  externalize() on the rail caused a mobile wrap fork. Capture-state fidelity wins over rule consistency.
- **Long-form transported content meets the pipeline: 5 recurring transforms** (see eds-conversion-log
  § utility): whitespace-p drop, trailing-NBSP trim, inline-indent strip, heading-id slugification
  (leading digits dropped), and wrapper-scoped section styles not reaching block cells. Each has a stable
  authoring vehicle (`<p><code>&nbsp;</code></p>`, inline `<code>&nbsp;</code>`, `<blockquote>` nesting,
  text-slug anchors, section-wide scoping). Candidate for a migrate-importer transform table — the SAME
  transforms will hit all ~100 sibling content/utility pages.
- **Margin-collapse parity for merged default content.** AEM-classic pages wrap every richtext in a
  flow-root component, so 20px+20px boundaries render 40px. EDS merges consecutive richtexts into ONE
  default-content wrapper where those margins collapse to 20px. Mirror with `p + h2 { margin-top: 40px }`
  per interior section style; block boundaries keep the native 20.

## 2026-08-29 — wave-1 sibling importer
- **Push the code before measuring the content.** 92 pages deployed against uncommitted block CSS produced a
  phantom -638px fidelity gap; the deploy contract's computed-style check exists precisely to catch this — run
  it per BATCH, not just per archetype.
- **The pipeline strips <br> inside headings** — the AEM lead-br idiom must ride spacer paragraphs
  (`<p><code>&nbsp;</code></p>`) emitted around the heading at import time.
- **DA image validation: SVG > 40KB is rejected at preview (409 AEM_BACKEND_FETCH_FAILED**, naming the image
  index) — even for cross-origin srcs. Rasterize to PNG at import.
- **Balanced-div walkers must strip <script>/<style>/comments first** — embedded '<div' tokens silently swallow
  sibling components (cost: four columncontrols of logos).

## 2026-08-31 — phase 3 (rollout + QA)
- **The pipeline unwraps `<em>`/`<strong>` around pictures** — inline vehicles cannot carry image styling
  intent. Floated/constrained figures need a BLOCK (a 6-line `portrait` block did it).
- **`main img { width: auto }` defeats attr-based CLS reservation.** Width/height attrs only reserve the box
  when the inline size is definite; boilerplate-style `width: auto` leaves a 0-height placeholder. One scoped
  `width: 100%` on lead images took article CLS from 0.134 to 0.0002. Deploy's CWV gate should assert this
  per template.
- **QA link audits catch inventory gaps**: one live-200 page (doctors-day article) was never discovered by
  extract's crawl — linked only from two listing surfaces. A link-audit pass belongs in rollout, not just QA.
- **redirects.json needs BOTH extensionless and `.html` source rows** during re-platforms — old-world inbound
  links carry `.html`.
