# Tacklebox Customer Site v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the two finished prototype pages in `design-reference/` into a production 11ty static site deployed to GitHub Pages via GitHub Actions.

**Architecture:** 11ty (Nunjucks) builds `src/` into `_site/`. A shared base layout carries the head/nav/footer; two page templates hold the converted landing and commands content; one stylesheet holds all extracted styles and CSS variables; ~60 lines of vanilla JS handle tabs, scroll-spy, and nothing else (collapsibles are native `<details>`). A GitHub Actions workflow builds and deploys on push to `main`.

**Tech Stack:** Node.js ≥ 20, `@11ty/eleventy` v3, Nunjucks templates, vanilla JS, GitHub Actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`).

## Global Constraints

- Site is served at `https://outland-anglers.github.io/tacklebox/` — every internal link and asset URL must go through 11ty's `pathPrefix: "/tacklebox/"` (use the `| url` filter in templates).
- **Zero external runtime requests.** No Google Fonts CDN, no unpkg, no CDN of any kind. Fonts are self-hosted woff2. Verification includes checking that no request leaves the origin.
- **Copy is sacred:** all visible text comes verbatim from `design-reference/Tacklebox Landing.dc.html` and `design-reference/Tacklebox Commands.dc.html` unless Task 8's verification against the bot repo finds a factual error. Never edit files in `design-reference/`.
- Baked-in values (from prototype scripts):
  - Invite URL: `https://discord.com/oauth2/authorize?client_id=1448447132393672807`
  - Support server: `https://discord.gg/A56K9EgxMj`
  - Accent color: `#D89B3C`
  - Invite button label: `Add to Discord`
- Fonts: Oswald 500/600/700, Work Sans 400/500/600, JetBrains Mono 500, all `font-display: swap`.
- Dark mode via `@media (prefers-color-scheme: dark)` overriding CSS custom properties — same variable names as the prototypes.
- Responsive breakpoints: 860px and 560px, matching the prototypes.
- Commit after every task. Do not commit `node_modules/` or `_site/`.

---

### Task 1: 11ty scaffold that builds

**Files:**
- Create: `package.json`
- Create: `eleventy.config.js`
- Create: `src/index.njk` (temporary stub, replaced in Task 5)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run build` → `_site/`; `npm run serve` → local dev server. `src/` is the input dir; `src/css`, `src/js`, `src/fonts`, `src/img` are passthrough-copied. `pathPrefix` is `/tacklebox/`. All later tasks rely on these paths.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tacklebox-site",
  "private": true,
  "version": "1.0.0",
  "description": "Landing page and docs site for the Tacklebox Discord bot",
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create eleventy.config.js**

```js
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/img");

  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
      includes: "_includes",
    },
    pathPrefix: "/tacklebox/",
  };
}
```

- [ ] **Step 3: Create stub src/index.njk**

```html
---
title: Tacklebox
---
<p>stub — replaced in Task 5</p>
```

(No layout yet; 11ty will emit it raw. That's fine for the scaffold check.)

- [ ] **Step 4: Update .gitignore**

Append to the existing `.gitignore`:

```
node_modules/
_site/
```

- [ ] **Step 5: Install and run the build (this is the failing→passing test for the scaffold)**

Run: `npm install && npm run build`
Expected: `[11ty] Wrote 1 file` (or similar), exit code 0, and `_site/index.html` exists containing the stub text.

Run: `ls _site/index.html && grep -q "stub" _site/index.html && echo OK`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json eleventy.config.js src/index.njk .gitignore
git commit -m "feat: scaffold 11ty build with /tacklebox/ path prefix"
```

---

### Task 2: Self-hosted fonts

**Files:**
- Create: `src/fonts/oswald-500.woff2`, `src/fonts/oswald-600.woff2`, `src/fonts/oswald-700.woff2`
- Create: `src/fonts/work-sans-400.woff2`, `src/fonts/work-sans-500.woff2`, `src/fonts/work-sans-600.woff2`
- Create: `src/fonts/jetbrains-mono-500.woff2`
- Create: `src/css/fonts.css`

**Interfaces:**
- Produces: font files at `/fonts/<name>.woff2` (site-relative, behind pathPrefix) and `src/css/fonts.css` declaring families `Oswald`, `Work Sans`, `JetBrains Mono`. Task 4's stylesheet and Task 3's layout consume these.

- [ ] **Step 1: Download woff2 files (latin subset) from the google-webfonts-helper API**

```bash
mkdir -p src/fonts
for spec in "oswald:500" "oswald:600" "oswald:700" "work-sans:400" "work-sans:500" "work-sans:600" "jetbrains-mono:500"; do
  fam="${spec%%:*}"; wt="${spec##*:}"
  curl -fsSL "https://gwfh.mranftl.com/api/fonts/${fam}?download=zip&subsets=latin&variants=${wt}&formats=woff2" -o "/tmp/${fam}-${wt}.zip"
  unzip -o -j "/tmp/${fam}-${wt}.zip" -d src/fonts/
done
ls src/fonts/
```

Expected: seven `.woff2` files. Rename them to the short names used below:

```bash
cd src/fonts
for f in *.woff2; do
  new=$(echo "$f" | sed -E 's/^([a-z-]+)-v[0-9]+-latin-([0-9]+)\.woff2$/\1-\2.woff2/')
  [ "$f" != "$new" ] && mv "$f" "$new"
done
ls
cd ../..
```

Expected: `jetbrains-mono-500.woff2 oswald-500.woff2 oswald-600.woff2 oswald-700.woff2 work-sans-400.woff2 work-sans-500.woff2 work-sans-600.woff2`

(If the gwfh.mranftl.com API is down, fall back to cloning `https://github.com/google/fonts` variable-font TTFs is overkill — instead fetch the woff2 URLs that `https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700` returns when curled with a modern browser User-Agent, one weight at a time.)

- [ ] **Step 2: Create src/css/fonts.css**

```css
@font-face {
  font-family: "Oswald";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("../fonts/oswald-500.woff2") format("woff2");
}
@font-face {
  font-family: "Oswald";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../fonts/oswald-600.woff2") format("woff2");
}
@font-face {
  font-family: "Oswald";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("../fonts/oswald-700.woff2") format("woff2");
}
@font-face {
  font-family: "Work Sans";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../fonts/work-sans-400.woff2") format("woff2");
}
@font-face {
  font-family: "Work Sans";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("../fonts/work-sans-500.woff2") format("woff2");
}
@font-face {
  font-family: "Work Sans";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../fonts/work-sans-600.woff2") format("woff2");
}
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("../fonts/jetbrains-mono-500.woff2") format("woff2");
}
```

- [ ] **Step 3: Verify the build copies fonts through**

Run: `npm run build && ls _site/fonts/ | wc -l`
Expected: `7`

- [ ] **Step 4: Commit**

```bash
git add src/fonts src/css/fonts.css
git commit -m "feat: self-host Oswald, Work Sans, JetBrains Mono woff2"
```

---

### Task 3: Base layout, nav, footer

**Files:**
- Create: `src/_layouts/base.njk`
- Create: `src/_includes/nav.njk`
- Create: `src/_includes/logo-mark.njk`
- Create: `src/_includes/footer.njk`
- Create: `src/_data/site.js`

**Interfaces:**
- Consumes: `fonts.css` (Task 2), pathPrefix config (Task 1).
- Produces: layout `base.njk` used via front matter `layout: base.njk`; page front-matter variables it reads: `title` (string), `bodyClass` (optional string), `navVariant` (`"landing"` or `"commands"`). Global data `site.inviteUrl`, `site.supportUrl`, `site.inviteLabel` available in all templates. Tasks 5 and 6 consume all of these.

- [ ] **Step 1: Create src/_data/site.js**

```js
export default {
  inviteUrl: "https://discord.com/oauth2/authorize?client_id=1448447132393672807",
  supportUrl: "https://discord.gg/A56K9EgxMj",
  inviteLabel: "Add to Discord",
};
```

- [ ] **Step 2: Create src/_layouts/base.njk**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ title }}</title>
  <meta name="description" content="Tacklebox — a free Discord bot for Albion Online guilds: party sign-ups, loot splits, regear timers, and more.">
  <link rel="stylesheet" href="{{ '/css/fonts.css' | url }}">
  <link rel="stylesheet" href="{{ '/css/site.css' | url }}">
</head>
<body{% if bodyClass %} class="{{ bodyClass }}"{% endif %}>
  {% include "nav.njk" %}
  {{ content | safe }}
  {% include "footer.njk" %}
  <script src="{{ '/js/site.js' | url }}" defer></script>
</body>
</html>
```

- [ ] **Step 3: Create src/_includes/nav.njk**

The nav differs slightly per page (landing shows section links; commands shows the "/ Commands" crumb) — prototype sources: `Tacklebox Landing.dc.html:34-48` and `Tacklebox Commands.dc.html:38-47`. Reproduce both variants:

```html
<header class="tb-topnav">
  <div class="tb-topnav-inner">
    {% if navVariant == "commands" %}
    <a href="{{ '/' | url }}" class="tb-brand">
      {% include "logo-mark.njk" %}
      <span class="tb-brand-name">TACKLEBOX</span>
      <span class="tb-brand-crumb">/ Commands</span>
    </a>
    {% else %}
    <div class="tb-brand">
      {% include "logo-mark.njk" %}
      <span class="tb-brand-name">TACKLEBOX</span>
    </div>
    <nav class="tb-navlinks">
      <a href="#features">Features</a>
      <a href="#party-manager">Party Manager</a>
      <a href="#loot-split">Loot Split</a>
      <a href="{{ '/commands/' | url }}">Commands</a>
    </nav>
    {% endif %}
    <a href="{{ site.inviteUrl }}" target="_blank" rel="noopener" class="tb-btn tb-btn-invite">{{ site.inviteLabel }}</a>
  </div>
</header>
```

Also create `src/_includes/logo-mark.njk` containing the inline SVG fish mark, copied exactly from `Tacklebox Landing.dc.html:37` (the 30×30 hook/fish `<svg>`), with `width`/`height` left as attributes so CSS can override per context.

- [ ] **Step 4: Create src/_includes/footer.njk**

Content from `Tacklebox Landing.dc.html:220-232` (landing variant) and `Tacklebox Commands.dc.html:279-288` (commands variant):

```html
<footer class="tb-footer">
  <div class="tb-footer-inner">
    {% if navVariant == "commands" %}
    <span class="tb-footer-note">Need more help? Join the support server.</span>
    <div class="tb-footer-links">
      <a href="{{ '/' | url }}">← Back home</a>
      <a href="{{ site.supportUrl }}" target="_blank" rel="noopener">Support server</a>
      <a href="{{ site.inviteUrl }}" target="_blank" rel="noopener">Add to Discord</a>
    </div>
    {% else %}
    <div class="tb-footer-beta">
      {% include "logo-mark.njk" %}
      <span>Tacklebox is currently in beta — expect the occasional rough edge.</span>
    </div>
    <div class="tb-footer-links">
      <a href="{{ '/commands/' | url }}">Commands</a>
      <a href="{{ site.supportUrl }}" target="_blank" rel="noopener">Support server</a>
      <a href="{{ site.inviteUrl }}" target="_blank" rel="noopener">Add to Discord</a>
    </div>
    {% endif %}
  </div>
</footer>
```

- [ ] **Step 5: Wire the stub page into the layout and verify**

Change `src/index.njk` front matter to:

```html
---
title: Tacklebox
layout: base.njk
navVariant: landing
---
<p>stub — replaced in Task 5</p>
```

Run: `npm run build && grep -c "tacklebox/css/site.css" _site/index.html && grep -c "TACKLEBOX" _site/index.html`
Expected: build succeeds; both greps return ≥ 1 (proving pathPrefix-ed CSS link and nav render).

- [ ] **Step 6: Commit**

```bash
git add src/_layouts src/_includes src/_data src/index.njk
git commit -m "feat: base layout with shared nav and footer"
```

---

### Task 4: Stylesheet — extract the prototype's design system

**Files:**
- Create: `src/css/site.css`

**Interfaces:**
- Consumes: class names referenced by Task 3's partials (`tb-topnav`, `tb-topnav-inner`, `tb-brand`, `tb-brand-name`, `tb-brand-crumb`, `tb-navlinks`, `tb-btn`, `tb-btn-invite`, `tb-footer`, `tb-footer-inner`, `tb-footer-beta`, `tb-footer-note`, `tb-footer-links`).
- Produces: the full class vocabulary Tasks 5 and 6 use for page content (listed per section in those tasks). Later tasks must not invent new visual values — every color/size in this file comes from the prototype inline styles.

- [ ] **Step 1: Create src/css/site.css — foundation**

Start with the token block and element defaults, copied from `Tacklebox Landing.dc.html:14-31` and `Tacklebox Commands.dc.html:14-35` (union of both pages' variables):

```css
:root {
  --page-bg: #F7F4EC; --card-bg: #FFFFFF; --card-border: #E8E1D2;
  --text-primary: #16323B; --text-secondary: #5B6668;
  --chip-bg: #EAE2D2; --chip-text: #7A5A22;
  --code-bg: #F7F4EC; --code-bg-strong: #EAE2D2; --code-bg-soft: #F7F4EC;
  --admin-code-bg: #F0E6D3; --admin-code-text: #7A5A22;
  --callout-bg: #F0E6D3; --callout-text: #7A5A22;
  --text-body: #3E4C4F; --flow-player: #2F5F6E;
  --accent: #D89B3C; --ink: #16323B; --paper: #F7F4EC;
  --band-dark: #16323B; --band-darker: #0F262D; --panel-dark: #1F3F49;
}
@media (prefers-color-scheme: dark) {
  :root {
    --page-bg: #10191C; --card-bg: #182428; --card-border: #28393D;
    --text-primary: #F0EBDF; --text-secondary: #A6B4B6;
    --chip-bg: #23343A; --chip-text: #E0AE5C;
    --code-bg: #1B2A2E; --code-bg-strong: #23343A; --code-bg-soft: #1B2A2E;
    --admin-code-bg: #2A2318; --admin-code-text: #E0AE5C;
    --callout-bg: #2A2318; --callout-text: #E0AE5C;
    --text-body: #C9D3D4; --flow-player: #7FB8C4;
  }
}
body {
  margin: 0;
  background: var(--page-bg);
  font-family: "Work Sans", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
html { scroll-behavior: smooth; }
a { color: #2F5F6E; text-decoration: none; }
a:hover { color: var(--accent); }
h1, h2, h3, h4 { font-family: "Oswald", system-ui, sans-serif; margin: 0; }
code { font-family: "JetBrains Mono", monospace; }
::selection { background: var(--accent); color: var(--ink); }
```

- [ ] **Step 2: Add component classes**

Translate every inline `style="…"` from the prototypes into classes, preserving exact values. Work section by section through both prototype files; the class vocabulary (used by Tasks 3, 5, 6) is:

- Nav: `.tb-topnav` (sticky, `background: var(--band-dark)`), `.tb-topnav-inner` (max-width 1180px landing / 1240px commands — use a `--nav-max` variable set by `bodyClass`), `.tb-brand`, `.tb-brand-name`, `.tb-brand-crumb`, `.tb-navlinks a`, `.tb-btn`, `.tb-btn-invite`, `.tb-btn-outline`
- Landing hero: `.tb-hero` (grid `1.1fr 0.9fr`), `.tb-chip`, `.tb-hero h1` (52px), `.tb-hero-sub`, `.tb-hero-ctas`, `.tb-hero-perms`
- Bot frame: `.tb-botframe` (`background: var(--panel-dark)`, radius 14, shadow), `.tb-botframe-head`, `.tb-botframe-avatar`, `.tb-botframe-tag`, `.tb-botframe-caption`, `.tb-shot` (the placeholder panel, Task 5 Step 2)
- Feature grid: `.tb-features`, `.tb-kicker`, `.tb-features h3`, `.tb-grid` (3-col), `.tb-card` (hover: `translateY(-3px)` + shadow), `.tb-card h4`, `.tb-card p`, `.tb-card-icon`
- Deep-dives: `.tb-band` (dark, `background: var(--band-dark)`), `.tb-band-light`, `.tb-deepdive` (2-col grid), `.tb-feature-num`, `.tb-tabs` (pill container), `.tb-tab` / `.tb-tab.is-active`, `.tb-flowlist` (the `<ol>`), plus dark-band text colors (`.tb-band` scoped overrides)
- CTA band: `.tb-cta`
- Footer: `.tb-footer` (`background: var(--band-darker)`), `.tb-footer-inner`, `.tb-footer-beta`, `.tb-footer-note`, `.tb-footer-links a`
- Commands layout: `.tb-layout` (grid `220px 1fr`), `.tb-sidebar` (sticky top 78px), `.tb-sidebar a` / `.tb-sidebar a.is-active` (active = accent bg, ink text), `.tb-cmdsection` (`scroll-margin-top: 78px`), `.tb-cmdtitle` (h2 + slash chip row), `.tb-slashchip`, `.tb-cmdcard` (COMMANDS box), `.tb-cmdrow`, `.tb-cmdcode`, `.tb-cmdcode-admin`, `.tb-flowgrid` (2-col), `.tb-flowcard`, `.tb-flowlabel-player`, `.tb-flowlabel-officer`, `.tb-callout`, `.tb-details` (styled `<details>`: summary looks like the prototype's `▸ / ▾` toggle button)
- Responsive, from `Tacklebox Landing.dc.html:234-245` and `Tacklebox Commands.dc.html:290-296`:

```css
@media (max-width: 860px) {
  .tb-navlinks { display: none; }
  .tb-grid { grid-template-columns: 1fr 1fr; }
  .tb-deepdive, .tb-hero { grid-template-columns: 1fr; }
  .tb-deepdive .tb-botframe { order: -1; }
  .tb-layout { grid-template-columns: 1fr; }
  .tb-sidebar { position: static; flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .tb-flowgrid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .tb-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Verify build and no leftover font CDN references**

Run: `npm run build && ! grep -r "fonts.googleapis\|unpkg" src/ && echo CLEAN`
Expected: build succeeds, `CLEAN`.

- [ ] **Step 4: Commit**

```bash
git add src/css/site.css
git commit -m "feat: extract prototype design system into site.css"
```

---

### Task 5: Landing page conversion

**Files:**
- Modify: `src/index.njk` (replace stub entirely)
- Create: `src/img/placeholder-shot.svg`

**Interfaces:**
- Consumes: `base.njk` layout, `site.*` data, all `.tb-*` classes from Task 4.
- Produces: landing page at `/` with tab markup Task 7's JS drives: each deep-dive wraps in an element with `data-tabs`; buttons carry `data-tab-target="player"|"officer"`; panels carry `data-tab-panel="player"|"officer"` and the default-hidden panel has the `hidden` attribute.

- [ ] **Step 1: Convert the landing page content**

Source of truth: `design-reference/Tacklebox Landing.dc.html`, sections in order:
- Hero: lines 50–75 (chip, h1, sub, CTAs, permissions note, bot-frame panel)
- Feature grid: lines 77–119 (kicker, h3, six cards — copy each card's inline SVG icon and text exactly; card links point to `{{ '/commands/' | url }}#party` etc.)
- Party Manager deep-dive (dark band): lines 121–165 — replace the `sc-if` pair with both `<ol>` lists as sibling panels; Player is the default-visible panel (`state.partyView = 'player'` in the prototype script, line 250)
- Loot Split deep-dive (light band): lines 167–212 — same treatment; Officer is the default-visible panel (`state.lootView = 'officer'`, line 250)
- CTA band: lines 214–218
- Replace every `{{ inviteUrl }}` / `{{ supportUrl }}` / `{{ accentColor }}` / `{{ inviteLabel }}` with the baked values via `site.*` data or CSS classes. Replace `Tacklebox Commands.dc.html` hrefs with `{{ '/commands/' | url }}`.

Front matter and tab markup shape:

```html
---
title: "Tacklebox — party sign-ups, loot splits & regear timers for Albion guilds"
layout: base.njk
navVariant: landing
bodyClass: page-landing
---
```

```html
<div class="tb-tabs" data-tabs>
  <button type="button" class="tb-tab is-active" data-tab-target="player">Player Flow</button>
  <button type="button" class="tb-tab" data-tab-target="officer">Officer Flow</button>
</div>
<ol class="tb-flowlist" data-tab-panel="player"><!-- lines 135-140 content --></ol>
<ol class="tb-flowlist" data-tab-panel="officer" hidden><!-- lines 143-148 content --></ol>
```

(For the Loot deep-dive, `is-active` and `hidden` swap so Officer is visible by default.)

- [ ] **Step 2: Create the screenshot placeholder**

Each of the two bot-frame slots on this page (hero: 220px tall; party deep-dive: 240px; the loot one at 320px lands in this same partial) becomes:

```html
<div class="tb-botframe">
  <div class="tb-botframe-head">
    <span class="tb-botframe-avatar">{% include "logo-mark.njk" %}</span>
    <span>Tacklebox</span>
    <span class="tb-botframe-tag">BOT</span>
  </div>
  <div class="tb-shot" style="--shot-h: 220px">
    <img src="{{ '/img/placeholder-shot.svg' | url }}" alt="" width="640" height="220">
    <span class="tb-shot-label">Screenshot coming soon</span>
  </div>
</div>
```

Create `src/img/placeholder-shot.svg` — a simple dark panel echoing a Discord embed skeleton:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" role="img" aria-label="">
  <rect width="640" height="220" fill="#16323B"/>
  <rect x="24" y="24" width="4" height="172" rx="2" fill="#D89B3C"/>
  <rect x="48" y="30" width="220" height="14" rx="7" fill="#2C4A54"/>
  <rect x="48" y="62" width="420" height="10" rx="5" fill="#22404A"/>
  <rect x="48" y="84" width="380" height="10" rx="5" fill="#22404A"/>
  <rect x="48" y="106" width="410" height="10" rx="5" fill="#22404A"/>
  <rect x="48" y="150" width="110" height="30" rx="6" fill="#2C4A54"/>
  <rect x="170" y="150" width="110" height="30" rx="6" fill="#2C4A54"/>
</svg>
```

`.tb-shot` styles it: `height: var(--shot-h)`, `img { width: 100%; height: 100%; object-fit: cover; }`, label overlaid center in `#8FAAB0` 11.5px. Drop the prototype's "drag a screenshot onto the box" caption — that was design-tool-only copy; replace with nothing (the "coming soon" label covers it).

- [ ] **Step 3: Verify**

Run: `npm run build && grep -c 'data-tab-panel' _site/index.html && grep -c 'FEATURE 01' _site/index.html && ! grep -q '{{' _site/index.html && echo NO-TEMPLATE-LEAKS`
Expected: `4` panels, `1` FEATURE 01, `NO-TEMPLATE-LEAKS`.

Run: `npx @11ty/eleventy --serve` and eyeball `http://localhost:8080/tacklebox/` against the prototype (open `design-reference/Tacklebox Landing.dc.html` in a browser for comparison). Layout, colors, and copy should match; both tab states are present in the DOM (one hidden).

- [ ] **Step 4: Commit**

```bash
git add src/index.njk src/img/placeholder-shot.svg src/css/site.css
git commit -m "feat: convert landing page from design prototype"
```

---

### Task 6: Commands page conversion

**Files:**
- Create: `src/commands.njk`

**Interfaces:**
- Consumes: `base.njk`, `site.*`, `.tb-*` classes.
- Produces: page at `/commands/` with sidebar links `href="#party|#loot|#regear|#clock|#bank|#admin|#permissions"` and matching `<section id="…" class="tb-cmdsection">` elements — Task 7's scroll-spy reads exactly these. Collapsibles are native `<details class="tb-details">`.

- [ ] **Step 1: Convert the commands page**

Source of truth: `design-reference/Tacklebox Commands.dc.html`:
- Front matter:

```html
---
title: "Tacklebox — Command Reference"
layout: base.njk
navVariant: commands
bodyClass: page-commands
permalink: /commands/
---
```

- Sidebar: lines 51–59 → plain anchors in `.tb-sidebar` (no per-link inline style; `is-active` class managed by JS, `#party` gets it initially)
- Intro: lines 63–66
- Sections in order, each `<section id="…" class="tb-cmdsection">`: party (68–112), loot (114–159), regear (161–194), clock (196–211), bank (213–226), admin (228–244), permissions (246–274)
- The two `sc-if` collapsibles become native `<details>`:

```html
<details class="tb-details">
  <summary>Sheet setup &amp; column layout</summary>
  <div class="tb-details-body">
    <!-- content from Commands.dc.html lines 103-110, verbatim,
         including the sheet template link and service-account address -->
  </div>
</details>
```

(Same pattern for "Payout checklist, in detail", lines 150–158.) The `▸/▾` arrow is CSS: `summary::before { content: "▸"; } details[open] summary::before { content: "▾"; }` with the default marker suppressed.
- The admin callout (`showAdminNotes`, lines 232–234) is always shown — render the `.tb-callout` div unconditionally.
- Replace `{{ inviteUrl }}`/`{{ supportUrl }}` with `site.*` values; "Back home" links to `{{ '/' | url }}`.

- [ ] **Step 2: Verify**

Run: `npm run build && test -f _site/commands/index.html && grep -o 'id="[a-z]*"' _site/commands/index.html | sort -u`
Expected: file exists; ids include `admin bank clock loot party permissions regear`.

Run: `grep -c '<details' _site/commands/index.html && ! grep -q '{{' _site/commands/index.html && echo NO-TEMPLATE-LEAKS`
Expected: `2`, `NO-TEMPLATE-LEAKS`.

- [ ] **Step 3: Commit**

```bash
git add src/commands.njk src/css/site.css
git commit -m "feat: convert commands reference page from design prototype"
```

---

### Task 7: Interactive JS — tabs and scroll-spy

**Files:**
- Create: `src/js/site.js`

**Interfaces:**
- Consumes: `[data-tabs]`/`[data-tab-target]`/`[data-tab-panel]` markup (Task 5); `.tb-sidebar a[href^="#"]` + `.tb-cmdsection[id]` markup (Task 6).
- Produces: nothing consumed later; behavior only.

- [ ] **Step 1: Write src/js/site.js (complete file)**

```js
// Player/Officer tab toggles (landing page)
for (const group of document.querySelectorAll("[data-tabs]")) {
  const scope = group.parentElement;
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab-target]");
    if (!btn) return;
    const target = btn.dataset.tabTarget;
    for (const b of group.querySelectorAll("[data-tab-target]")) {
      b.classList.toggle("is-active", b === btn);
    }
    for (const panel of scope.querySelectorAll("[data-tab-panel]")) {
      panel.hidden = panel.dataset.tabPanel !== target;
    }
  });
}

// Sidebar scroll-spy (commands page)
const sidebarLinks = document.querySelectorAll('.tb-sidebar a[href^="#"]');
if (sidebarLinks.length > 0 && "IntersectionObserver" in window) {
  const linkById = new Map(
    [...sidebarLinks].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of sidebarLinks) a.classList.remove("is-active");
        linkById.get(entry.target.id)?.classList.add("is-active");
      }
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );
  for (const id of linkById.keys()) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}
```

- [ ] **Step 2: Manual behavior test**

Run: `npx @11ty/eleventy --serve`, open `http://localhost:8080/tacklebox/`:
- Party deep-dive: clicking "Officer Flow" swaps the list and the pill highlight; clicking "Player Flow" swaps back. Same on Loot (starting on Officer).

Open `http://localhost:8080/tacklebox/commands/`:
- Scrolling moves the accent highlight down the sidebar; clicking a sidebar link jumps to the section (smooth) and the highlight follows.
- Both `<details>` panels open and close, arrow flips.

- [ ] **Step 3: JS-off degradation test**

Disable JS in the browser (or add a `<noscript>` sanity pass): default tab panels are visible (Player for Party, Officer for Loot), hidden panels stay hidden, `<details>` still work, sidebar links still jump. Expected: page fully usable.

- [ ] **Step 4: Commit**

```bash
git add src/js/site.js
git commit -m "feat: vanilla JS tabs and sidebar scroll-spy"
```

---

### Task 8: Copy verification against the bot repo

**Files:**
- Modify (only if discrepancies found): `src/index.njk`, `src/commands.njk`

**Interfaces:**
- Consumes: converted copy from Tasks 5–6.
- Produces: verified copy. `design-reference/` is never edited.

- [ ] **Step 1: Verify factual claims via read-only GitHub MCP against `Outland-Anglers/outland-anglers`**

Use `mcp__plugin_github_github__search_code` / `get_file_contents` on the private bot repo (per CLAUDE.md convention — read-only, no cloning). Check each claim:

| Claim on site | Where to look |
|---|---|
| Default tax 35%, range 0–100 | loot/admin cog: `set_default_tax` |
| Reminder default 24h, expiry 48h, range 1–168h, reminder < expiry | admin cog: `set_reminder`, `set_expiry` |
| 10 active parties/server, 10-day auto-expiry | party cog |
| 5 active regear timers per player | regear cog |
| Checklist responds for 1 hour | loot cog: view timeout |
| Player Override cap 40 users | loot cog |
| `/bank_view` is a separate top-level command (not `/bank view`) | bank cog command decorators |
| `/clock` subcommands: setup, add, replace, remove, list; admin-only | clock cog |
| Service account address & sheet template URL | party cog / config |
| Required permissions: Manage Channels, Manage Threads, Connect | bot invite scopes / README |

- [ ] **Step 2: Fix discrepancies (site side only) and rebuild**

For each mismatch, correct `src/index.njk` / `src/commands.njk`, then `npm run build`. If access to the private repo fails (no auth), record the unverified claims in the commit message and move on — do not block the release on this.

- [ ] **Step 3: Commit**

```bash
git add src/index.njk src/commands.njk
git commit -m "docs: verify command copy against bot repo"
```

(If nothing changed, skip the commit and note "all claims verified" in the task report.)

---

### Task 9: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build` (Task 1).
- Produces: automatic Pages deploy on push to `main`. Requires the one-time manual repo setting: Settings → Pages → Source = "GitHub Actions".

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify workflow syntax locally**

Run: `npm ci && npm run build && echo BUILD-OK` (proves the exact commands the workflow runs succeed from a clean install).
Expected: `BUILD-OK`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: build and deploy to GitHub Pages via Actions"
```

---

### Task 10: Docs, conventions, final verification

**Files:**
- Modify: `CLAUDE.md` (hosting bullet)
- Modify: `README.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: everything above.
- Produces: repo docs matching reality; browser-verified site.

- [ ] **Step 1: Update CLAUDE.md hosting convention**

Replace the first bullet's hosting text so it reads:

```markdown
- **Hosting**: GitHub Pages, built by 11ty and deployed via GitHub Actions
  (`.github/workflows/deploy.yml`) on push to `main`. Site source lives in `src/`;
  never edit `_site/` (build output, not committed). Default
  `outland-anglers.github.io/tacklebox` URL — no custom domain, no CNAME file.
  One-time setup: repo Settings → Pages → Source = "GitHub Actions".
```

- [ ] **Step 2: Update README.md**

Add a "Development" section after the intro:

```markdown
## Development

- `npm install` once, then `npm run serve` — local preview at
  `http://localhost:8080/tacklebox/`.
- `npm run build` — production build into `_site/` (not committed).
- Site source is in `src/` (11ty + Nunjucks). Styles: `src/css/site.css`.
  Interactivity: `src/js/site.js`. Deploys automatically from `main` via
  GitHub Actions.
```

And update the bullet list: `design-reference/` bullet stays; add `src/` bullet.

- [ ] **Step 3: Update HANDOFF.md**

Rewrite for the new state: rebuild decision resolved (11ty + Actions); remaining follow-ups = enable Pages in repo settings (manual), capture real Discord screenshots for the three placeholder slots, LICENSE still open, note any copy claims Task 8 couldn't verify.

- [ ] **Step 4: Full browser verification (Playwright MCP) against the built site**

Run `npx @11ty/eleventy --serve`, then with Playwright verify on `http://localhost:8080/tacklebox/`:
1. Landing renders; nav "Commands" link → `/tacklebox/commands/`; footer links present.
2. Feature card click → commands page `#party` anchor lands on the Party section.
3. Tab toggles switch content on both deep-dives.
4. Commands page: scroll-spy highlight follows scrolling; both `<details>` toggle.
5. `browser_network_requests`: every request URL starts with `http://localhost:8080/` — zero external hosts.
6. Screenshot both pages in default and dark mode (emulate `prefers-color-scheme: dark`) and compare against the prototypes for obvious regressions.

Expected: all pass. Fix anything that fails before proceeding.

- [ ] **Step 5: Update the knowledge graph**

Run: `graphify update .`
Expected: completes without error.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md README.md HANDOFF.md graphify-out
git commit -m "docs: update conventions and handoff for 11ty site"
```

(Note: `CLAUDE.md` and `graphify-out/` are in `.gitignore` — if `git add` skips them, that matches the repo's intent; commit whatever is tracked.)

- [ ] **Step 7: Report the manual step**

Final report to the user must include: push to `main`, then enable GitHub Pages (Settings → Pages → Source = "GitHub Actions") — the workflow's first deploy will fail until that's done.
