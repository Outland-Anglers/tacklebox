# Tacklebox

Landing page and docs site for the Tacklebox Discord bot, published via GitHub Pages,
built by 11ty and deployed via GitHub Actions on push to `main`.

## Development

- `npm install` once, then `npm run serve` — local preview at
  `http://localhost:8080/tacklebox/`.
- `npm run build` — production build into `_site/` (not committed).
- Site source is in `src/` (11ty + Nunjucks). Styles: `src/css/site.css`.
  Interactivity: `src/js/site.js`. Deploys automatically from `main` via
  GitHub Actions.

- **`src/`** — the production site source (11ty + Nunjucks templates, CSS, JS).
  Built into `_site/` by `npm run build`; that's what actually ships.
- **`design-reference/`** — the original Claude-design prototype (Landing + Commands
  pages, logos, mockup runtime). Source of truth for the site's visual design and
  copy; not the production site itself.
