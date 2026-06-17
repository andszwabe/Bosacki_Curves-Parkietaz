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

GitHub Pages is configured as **"Deploy from a branch"** — `main` branch, root folder.

Workflow:

1. Edit source files in `src/`.
2. Run `npm run build` to regenerate the root `index.html` from sources.
3. Commit and push to `main`.
4. Pages picks up the new `index.html` within ~1 minute and serves it at
   https://andszwabe.github.io/Bosacki_Curves-Parkietaz/

`.nojekyll` at the repo root tells Pages to skip Jekyll processing and serve
files as-is. Do not remove it.

> **Important:** If you forget to run `npm run build` before pushing, the live
> site will not reflect your `src/` changes. The deployed file is the committed
> root `index.html`, not the source TypeScript / src HTML.

## Branching

- `main` — production. Pushes auto-deploy via GitHub Pages.
- `dev` — work-in-progress. Merge into `main` with `--no-ff` to release.
