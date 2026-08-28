# Learnings ledger — centene.com replica + deploy (2026-08-26/27)

Status: HARVESTED 2026-08-28 into adobe/skills stardust 0.18.3 (branch
`harvest-rwe-centene`, per the improvement plan
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
