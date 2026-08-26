<!--
_provenance:
  writtenBy: stardust:replica
  mode: bounded-single
  synthesizedFrom:
    - stardust/current/pages/index.json
    - stardust/replica/capture/tokens.json
-->

# Centene.com visual system (descriptive — captured current state)

Every value below is lifted from the live site's own CSS / computed styles
(see stardust/replica/capture/tokens.json for the full lift with sources).

## Colors

- Brand blue `#00598c` (buttons, footer, headings accent, mega-menu bg);
  hover `#003356`
- Body text `#58595b`; dark text `#333`; black `#000`; card meta `#4d4d4d`;
  nav links `#6e6e6e`; link blue `#006dc1`
- Light gray surface `#dcddde`; card image placeholder `#e0e0e0`
- Section accents: navy `#262768` (Careers), cerise `#cb187d`
  (Life at Centene), leaf `#2c8641` (Investor Relations), purple via
  background image (Serving our Members)
- Card border `#949494`, hover `#4c8fb6`

## Typography

- Families: `Roboto` (400/500/700, self-hosted woff2), plus site-declared
  single-face families `Roboto-Regular`, `Roboto-Bold`, `Roboto-Italic`
  (TTF), `Arial` (body/footer base), Font Awesome 6 Free/Brands for icons.
- Body base: Arial 14/20 (body), Roboto 14/20 in content region.
- Hero: Roboto 34/48.57 400 white with bold `<b>` span.
- H1 32/48 500 · H2 32/35.2 500 · news-card H3 23/32 500 underlined
  `#00598c` · paragraph 18/25.71 400 · buttons 1.3em (18.2/26).
- Nav: Roboto-Italic 16/22.86 700. Footer tagline: Roboto-Italic 25px italic;
  footer headings Roboto-Bold 16 uppercase; footer links Roboto-Regular 16.

## Rounded / elevation

- Buttons r4; search input r17 (pill); news cards r12 with
  `0 3px 6px rgba(26,26,26,.12), 0 0 1px rgba(26,26,26,.08)` shadow and 1px
  `#949494` border; rounded white-box cards r6 (translucent 90% white PNG bg).

## Container model

- Sections: full-bleed `background-color-box` with `padding: 25px 10% 20px`.
- Hero text container 1170px centered, `padding: 0 25px`.
- Grid: 24-col bootstrap variant; rows `margin: 0 -10px`, cols
  `padding: 0 10px` (hero row `0 -15px`); `colctrl-40/50/60` =
  33.33/50/66.67%; `equalHeight` = flex.
- Header 145px @1440 (91 brand bar + 54 nav), 92px @360; footer `#00598c`,
  `padding: 56px 24.5px`, inner container 1160px.

## Breakpoints

- Mobile hero swap at `max-width: 779px` (image strip 56.25vw + solid
  `#00598c` text block). Grid collapses to stacked columns at bootstrap-like
  sm/md thresholds (measured at 360: all colctrl full-width).
