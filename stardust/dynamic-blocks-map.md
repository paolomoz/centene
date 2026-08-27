# Dynamic-blocks map — centene.com migration

Written by prepare-migration Phase 4.5 (2026-08-27), from the 206-page prep
crawl. "Dynamic" = the block reads an EDS query-index at runtime; "static" =
authored content. Tier definitions per
`rollout/reference/dynamic-listings.md`.

## Listing blocks

| Block | Where | Verdict | Index | Notes |
|---|---|---|---|---|
| `cards` (news variant) | `/news.html` Featured Stories grid, `/featured-stories-archive.html` | **dynamic** | `news-index` | Live site is an AJAX newsfeed (config divs: tags, page-size=3/12, order=newest) with pagination. |
| `cards` (home Featured Stories) | `/` | **dynamic (phase 2)** | `news-index` | Pilot shipped it static-authored (3 cards). Switch to index-driven top-3-by-date after the index exists; zero content change (block gains a fallback: authored rows OR index fetch). |
| `press-release-rail` | `/news.html` right rail | **static until modeled (Tier 3)** | — | Items come from the external IR platform (investors.centene.com press releases), not from site pages — there is nothing on-site to index. Author the current 5 items as content; revisit only if an IR feed API is licensed. Recorded decision, not faked. |
| `related-links` (inline article links) | `/news/*` | **static** | — | Authored inline links in article prose; no repeating listing structure. |
| `site-map` | `/site-map.html` | **dynamic (optional)** | `site-index` | Can render from the full site index instead of hand-maintained lists; low priority — static authoring acceptable at 206 pages. |
| `search-results` | `/search.html` + header search box | **dynamic** | `site-index` | Live posts to AEM search. EDS: client-side search over the full query index (title/description/path). Header form targets `/search.html?q=`. |
| `brand-card` rows | `/products-and-services/browse-by-state/*` (51) | **static** | — | Per-state plan rows are curated editorial content (brand, description, plan links), not derived from site pages. |

## Metadata contract (Tier 2 — emit at author time, per page)

| Content type | `<meta name>` fields | Used by |
|---|---|---|
| `article` (47 `/news/*`) | `publisheddate` (ISO), `category` (e.g. Featured Stories / Press Release), `image` (og:image, Tier 1) | news-index → listing cards, home cards, archive |
| all pages | `title`, `description` (already mandatory per deploy #34) | site-index → search, site-map |
| `state` (51) | `state` (name), `plans` (comma list: wellcare, ambetter, …) | optional states index if browse-by-state ever goes dynamic; authored static for now |

Retrofit warning: these fields must ride each page's metadata block from the
FIRST import — retrofitting 47 articles later is a second migration.

## Tier-1 extractions (index selectors, zero content change)

- `h1` → title fallback · `og:image` → card image · first `<p>` → teaser.

## Integrations inventory (not listing blocks, but implementation work)

| Integration | Where seen | Migration decision |
|---|---|---|
| Invisible reCAPTCHA v2 (`google.com/recaptcha`) | EVERY page (global form framework) | Load only on form pages, from the form block (CSP: frame-src https: already allows). Needs site key + a submission endpoint. |
| Form submission backend (AEM forms POST) | `/contact.html`, `/media-contact.html`, `/products-and-services/medicaid/foster-care/contact.html` (+ 2 thank-you pages) | DECISION NEEDED: EDS forms-service / external endpoint (e.g. existing AEM instance) / marketing-automation endpoint. Blocks render the form; endpoint is config. |
| YouTube embeds | home, who-we-are, history, foster-care, investors | Solved pattern: plain URL in content → block/auto-block embed (pilot `intro`). Generalize as `embed` auto-block in `buildAutoBlocks()`. |
| Investor Relations platform | investors.centene.com (nav/footer links, `/investors.html` stub, press-release rail) | External links only; rail handled above (Tier 3 static). |
| Careers platform | jobs.centene.com (nav/footer); `/careers.html` returns 403 to non-browsers | External links only. `/careers.html` appears to be a gated stub — confirm with client whether to migrate or redirect. |
| Adobe Launch analytics (`assets.adobedtm.com`) | every page | Re-add via `delayed.js` (martech, not a block). Property decision with client. |
| Cookie consent (cookieconsent widget) | every page | Consent solution decision with client (same widget via delayed.js, or replacement). Gate captures must keep dismissing it. |
| Machine-readable files CDN | `/price-transparency-files.html` | Static external links; no work beyond content. |

## Indexes authored

`helix-query.yaml` (repo root): `news-index` (scoped to `/news/**`) and
`site-index` (all pages). Note: the boilerplate AGENTS.md marks
helix-query.yaml as retired in favor of tools.aem.live config — verify at
rollout which path this project's config service honors and mirror the same
properties there if needed.
