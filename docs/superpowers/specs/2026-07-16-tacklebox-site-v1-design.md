# Tacklebox customer site — v1 design

**Date:** 2026-07-16
**Status:** Approved (brainstorming session 2026-07-16)

## Goal

Stand up the first production iteration of the Tacklebox bot's public site on GitHub
Pages, converting the two finished prototype pages in `design-reference/` into a real
static site with no runtime CDN dependencies. This is a conversion job, not a design
job — all copy, palette, dark mode, and layout come from the prototypes.

## Decisions made

| Decision | Choice |
|---|---|
| Build tech | Static site generator |
| Generator | 11ty (Nunjucks templates) |
| Deploy | GitHub Actions → GitHub Pages (official Pages actions, on push to `main`) |
| Screenshot slots | Styled placeholders in v1; real screenshots are a fast follow |
| Fonts | Self-hosted woff2 (Oswald, Work Sans, JetBrains Mono), `font-display: swap` |

## Repository layout

```
src/
  _layouts/base.njk        ← shared shell: head, nav, footer
  _includes/               ← nav, footer, bot-frame partials
  css/site.css             ← extracted from prototype inline styles + CSS vars
  js/site.js               ← tabs, scroll-spy, collapsibles (~60 lines vanilla JS)
  fonts/                   ← self-hosted woff2
  img/                     ← logo assets, placeholder art
  index.njk                ← landing page
  commands.njk             ← command reference
eleventy.config.js
.github/workflows/deploy.yml
```

Build output goes to `_site/` (gitignored). The site is served at
`outland-anglers.github.io/tacklebox`, so the 11ty build sets `pathPrefix` to
`/tacklebox/` and all internal links/asset URLs go through it.

## Pages

Faithful conversions of the two prototypes:

- **`index.njk`** (from `design-reference/Tacklebox Landing.dc.html`): sticky nav,
  hero with bot-frame panel, six feature cards, Party Manager deep-dive (dark band),
  Loot Split deep-dive, CTA band, footer.
- **`commands.njk`** (from `design-reference/Tacklebox Commands.dc.html`): sticky
  nav, sidebar with scroll-spy (Party, Loot, Regear, Clock, Bank, Admin,
  Permissions), command sections with Player/Officer flow cards, two collapsible
  detail panels (sheet setup & column layout; payout checklist).

Same copy, same palette including the `prefers-color-scheme: dark` variables, same
responsive breakpoints (860px, 560px). Inline styles are consolidated into
`site.css` with classes; the CSS custom properties carry over as-is.

## Interactivity (vanilla JS, ~60 lines)

- **Landing:** two Player/Officer tab toggles (Party deep-dive defaults to Player,
  Loot deep-dive defaults to Officer, matching the prototype defaults).
- **Commands:** IntersectionObserver scroll-spy highlighting the sidebar link for
  the section in view (rootMargin `-35% 0px -55% 0px`, matching the prototype);
  collapsible panels implemented as native `<details>`/`<summary>` if the styling
  allows, else a small JS toggle.
- **JS-off degradation:** tab panels show their default flow; `<details>`
  collapsibles still work; scroll-spy simply doesn't highlight.

## Baked-in values (from prototype scripts)

- Invite URL: `https://discord.com/oauth2/authorize?client_id=1448447132393672807`
- Support server: `https://discord.gg/A56K9EgxMj`
- Accent color: `#D89B3C`
- Sheet template link and bot service account
  (`tacklebox-bot@tacklebox-489703.iam.gserviceaccount.com`) as they appear in the
  commands prototype.

## Screenshot placeholders

The three bot-frame panels (hero, `/party`, `/loot`) keep the prototype's dark
bot-frame styling and exact dimensions (220px / 240px / 320px heights) with a
tasteful "screenshot coming soon" placeholder treatment. Swapping in real Discord
screenshots later is a file replacement, no layout change.

## Content verification

Before finalizing copy, spot-check command names, options, and defaults (35%
default tax, 24h reminder / 48h expiry, 10-party cap, 5 regear timers per player,
1-hour checklist window, 40-user override lists) against the private
`Outland-Anglers/outland-anglers` bot repo via read-only GitHub MCP, per repo
convention. Copy discrepancies are fixed on the site side; `design-reference/` is
left untouched.

## Housekeeping in scope

- Update `CLAUDE.md` hosting convention: root-of-`main` → GitHub Actions deploy.
- `README.md`: document local dev (`npx @11ty/eleventy --serve`) and structure.
- `.gitignore`: add `node_modules/` and `_site/`.
- GitHub Pages must be enabled in repo Settings → Pages with source
  "GitHub Actions" (manual step, flagged at handoff).
- The ~2MB `design-reference/assets/tacklebox_beta_logo.png` is **not** used by the
  site (the prototypes use an inline SVG fish mark); it stays untouched in
  `design-reference/`.
- Run `graphify update .` after implementation.
- LICENSE remains an open item — explicitly out of scope for v1.

## Testing / acceptance

- `npx @11ty/eleventy --serve` builds clean and serves both pages locally.
- Browser verification (Playwright) of the built site: nav links between pages and
  to anchors work under the `/tacklebox/` path prefix; tab toggles switch flows;
  scroll-spy tracks sections; collapsibles open/close; dark mode renders via
  `prefers-color-scheme`; no network request leaves the origin (fonts, JS, CSS all
  self-hosted).
- GitHub Actions workflow builds and deploys on push to `main`.

## Out of scope for v1

Real Discord screenshots, LICENSE, blog/changelog content, custom domain,
optimizing the beta logo PNG.
