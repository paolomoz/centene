# Phase 3 — Rollout + QA report (2026-08-31)

## Rollout decisions (user-confirmed)
| Decision | Choice |
|---|---|
| Form submission | Mock submit → navigates to the migrated thank-you page; real endpoint + reCAPTCHA key are a content-only swap (author the external URL in the form block's action row) |
| Analytics / consent | None for the demo; Launch wiring point = `scripts/delayed.js` |
| /careers | 301 → jobs.centene.com/us/en |
| IR press-release rail | Static-authored (Tier-3 recorded decision) |
| State map | Dropdown everywhere (recorded deviation; live desktop map deferred) |
| Header search | Wired to EDS /search (?q=) — verified end-to-end (8 results for "foster care") |

## Rollout artifacts
- `redirects.json` (DA, published): 16 rows — 5 source redirect stubs + /careers + 2 normalized
  article slugs, each in extensionless and `.html` form. All verified 301.
- `helix-sitemap.yaml`: /sitemap.xml generated from site-index — serving 200.
- Mock form submit verified: fill → submit → lands on contact-thankyou.

## QA — standard sweep results
- **Runtime sweep (201 pages):** all blocks loaded, 0 pageerrors, 0 broken images site-wide.
  3 pages have no h1 — all live-faithful (legal + statements render empty on the source;
  the biometric notice has no h1 on the source either).
- **Internal-link audit:** 204 unique internal targets. 14 initially broken →
  5 fixed (stale `.html` hrefs + one malformed nested URL repaired),
  1 inventory gap imported (+/news/national-doctors-day-centene-thank-you → 202 pages),
  8 remain broken ON THE SOURCE SITE TOO (live 404s) — replicated as captured, listed in
  `stardust/qa/link-audit.json`.
- **Core Web Vitals (aem.live):**
  | Page | CLS | LCP |
  |---|---|---|
  | / | 0.001 | 1252ms |
  | /who-we-are/our-mission | 0.0002 | 692ms |
  | /products-and-services/browse-by-state/alabama | 0 | 472ms |
  | /news | 0.0002 | 908ms |
  | /news/food-is-medicine-… | 0.0002 (was 0.1335 — lead-image reservation fix) | 540ms |
  | /privacy-policy | 0.0002 | 592ms |
- **Pixel spot-samples (1440, vs live):** archetypes all previously gated green.
  Siblings: state/texas ≈ 2.6% height envelope; utility/accessibility 9.13%;
  article/food-is-medicine RESIDUAL — the live source hand-rolls inline-styled
  float/min-width column layouts inside a handful of articles (6 with floated
  portraits); content is complete and presentable (portrait block, verified
  screenshot), layout redistribution logged as a sibling-tier residual.

## Fixes landed during QA
- Article sections: sub-head style (29px brand), related-news sections restored on all
  46 sibling articles, floated portraits modeled as a `portrait` block (the pipeline
  unwraps `<em>` around pictures — inline vehicles cannot survive), lead-image layout
  reservation (CLS 0.13 → 0.0002).
- Site-wide `.html`-href normalization pass (importer + one-off fixer).

## Standing residuals / client blockers
1. Form endpoint + reCAPTCHA site key (mock submit until provided).
2. Adobe Launch property + consent solution (delayed.js wiring point ready).
3. IR feed licensing (rail stays static).
4. 8 source-broken internal links (also 404 on centene.com) — editorial fix list.
5. Desktop US-map statemap variant (4 pages, dropdown shipped).
6. Article float-layout residual on 6 portrait articles; utility deep-indent approximation.
