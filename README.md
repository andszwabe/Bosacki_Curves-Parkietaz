# Bosacki_Curves-Parkietaz

Parkietaż curve generator app for Piotr Bosacki.
Quarter-circle arc tiling system based on golden ratio proportions.

Live site: https://andszwabe.github.io/Bosacki_Curves-Parkietaz/

## Project structure

- `src/index.html`, `style.css`, `src/engine.ts`, `src/renderer.ts` — **source files** (edit these)
- `scripts/inline.js` — build script that inlines the compiled JS and CSS into a single `index.html`
- `index.html` (repo root) — **generated**, self-contained file served by GitHub Pages
- `dist/` — TypeScript compiler output (gitignored)
- `.nojekyll` — tells GitHub Pages to skip Jekyll and serve files as-is

## Local development

Install dependencies once:

```bash
npm install
```

Build the self-contained `index.html` from sources:

```bash
npm run build
```

Then open `index.html` in a browser. Or watch and rebuild on changes:

```bash
npm run watch    # tsc only — re-run `npm run build` to regenerate index.html
```

## Deployment

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`):

1. Push to `main` → workflow runs `npm ci` and `npm run build` on a fresh runner
2. The whole repo (with the freshly built `index.html`) is uploaded as a Pages artifact
3. GitHub Pages publishes it to https://andszwabe.github.io/Bosacki_Curves-Parkietaz/

You no longer need to commit a freshly built `index.html` yourself — just edit
sources, push, and the Action rebuilds and redeploys.

The committed `index.html` at the repo root remains useful for opening the app
directly from the filesystem without a build step. Run `npm run build` before
committing if you want it to reflect your latest source changes.

## Branching

- `main` — production. Auto-deploys to GitHub Pages on push.
- `dev` — work-in-progress. Merge into `main` with `--no-ff` to release.
