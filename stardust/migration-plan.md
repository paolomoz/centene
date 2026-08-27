# centene.com → EDS full-migration plan

Written 2026-08-27 by prepare-migration (Phase 1 + 4.5 complete). URL roster
and per-page status tracked in `stardust/state.json` (206 pages, all typed,
provenance-verified live renders). Companion artifacts:
`stardust/dynamic-blocks-map.md`, `helix-query.yaml`,
`DESIGN.json.extensions.modules[]` (16 candidates).

## 1. URL inventory (tracked in state.json)

Discovery: `robots.txt → https://www.centene.com/.sitemap.xml` (212 URLs),
minus robots-disallowed + `/error` + `/blocked` = 207 crawled →
**206 captured** (1 DUP folded: `/who-we-are/our-purpose` ≡ `/our-mission`;
1 failure: `/careers.html` HTTP 403 — gated stub for jobs.centene.com,
client decision: migrate or redirect).

| Type | Pages | Examples |
|---|---|---|
| `content` | 84 | who-we-are/*, why-were-different/*, products-and-services/{medicaid,medicare,marketplace,whole-health}* |
| `state` | 51 | products-and-services/browse-by-state/&lt;state&gt; |
| `article` | 47 | /news/* |
| `utility` | 12 | privacy-policy, terms, accessibility (x2), legal/*, statements/*, site-map, price-transparency-files |
| `form` | 4 | contact, media-contact, foster-care contact (+thank-you) |
| `pillar` | 4 | who-we-are, why-were-different, products-and-services, browse-by-state |
| `listing` | 2 | news, featured-stories-archive |
| `landing` | 1 | / (DONE — pilot shipped, published-origin gate 2.63%/2.97%) |
| `search` | 1 | search |

## 2. Archetype prototyping plan (next step)

Per the replica cumulative-archetype rule, each type gets ONE standalone
prototype gated against its live page (≤10% pixel, Δ≤8px, 0 structural red,
both breakpoints), importing the pilot's gated canon (tokens, chrome,
button system) and iterating only on NEW modules. Proposed archetype pages,
in build order (each unlocks the largest sibling fan-out):

| # | Archetype | Prototype against | Sibling fan-out | New modules exercised |
|---|---|---|---|---|
| 1 | `content` | /who-we-are/our-mission.html | 84 | breadcrumb, interior hero, richtext bands |
| 2 | `state` | /products-and-services/browse-by-state/alabama.html | 51 | sub-nav, tall blue h1 band, brand-card rows |
| 3 | `article` | /news/achieving-whole-health-…-integration.html | 47 | article-body (date, photo, PDF links) |
| 4 | `listing` | /news.html | 2 (+home cards go dynamic) | dynamic cards (news-index), press-release-rail (static Tier-3), tile-links, pagination |
| 5 | `pillar` | /products-and-services.html | 4 | pillar hero + band compositions (mostly canon reuse) |
| 6 | `utility` | /privacy-policy.html | 12 | long-form richtext, anchor nav if present |
| 7 | `form` | /contact.html | 4 | form block + reCAPTCHA + endpoint config |
| 8 | `search` | /search.html | 1 | search-results over site-index |

Content-variant modules (people-grid, logo-grid, timeline, award-list) ride
the `content` archetype as block variants, verified page-by-page at migrate
time (sibling tier), not as separate archetypes.

## 3. Dynamic blocks & integrations (full detail: dynamic-blocks-map.md)

**Dynamic (query-index-backed):**
- `cards` news variant — news.html grid, archive, and (phase 2) the home
  Featured Stories → `news-index` (metadata contract: `publisheddate`,
  `category`, og:image). Pagination + page-size from block config.
- `search-results` + header search box → `site-index`.
- `site-map` — optional index-driven; static acceptable.

**Static-until-modeled (Tier 3, recorded decisions):**
- `press-release-rail` (news.html) — items live on the external IR platform;
  nothing on-site to index. Authored static.

**Integrations needing client decisions (flagged, not blockers for
prototyping):**
1. Form submission endpoint + reCAPTCHA site key (contact forms).
2. Adobe Launch property + cookie-consent solution (re-add via delayed.js).
3. `/careers.html` 403 stub — migrate vs redirect to jobs.centene.com.
4. IR press-release feed — license an API or keep the static rail.

**Solved patterns from the pilot:** YouTube embed (URL → block), chrome
(header/footer from /nav + /footer), button system, image pipeline
(2000px renditions for background layers).

## 4. Remaining prep steps (before migrate)

- [ ] **Descriptive spec re-synthesis + verbatim promotion** — the full-prep
      crawl now exists, so `current/PRODUCT.md`/`DESIGN.md`/`DESIGN.json`
      should be synthesized from the 206-page brand surface and promoted to
      replace the bounded-single spec (replica preserve-mode contract; no
      creative decisions — same design system, tokens already lifted).
- [ ] Archetype prototypes 1–8 (each: recreate → source-fidelity gate →
      approval), cumulative on the pilot canon.
- [ ] Metadata contract enforced at import time: every `/news/*` page's
      metadata block carries `publisheddate` + `category` from day one.
- [ ] Assets prep: favicon variants (base favicon captured 2026-08-27);
      fonts already self-hosted.
- [ ] Then `stardust:migrate` (sibling tier per archetype) →
      `stardust:rollout` (block dedup, publish roster, delivery gates) →
      `stardust:qa`.

## 5. Volume & sequencing

206 pages / 9 types. Suggested rollout waves after archetypes gate:
(1) content+utility+pillar (100 pages, lowest risk), (2) articles+listing
(49, index goes live first), (3) states (51, heavy curated content),
(4) forms+search (5, integration-dependent). Every page inherits the
archetype's gate; per-page content-fidelity measured at import
(fidelity-tiers § content-count acceptance).
