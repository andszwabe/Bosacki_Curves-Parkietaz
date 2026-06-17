# Bosacki_Curves-Parkietaz

Parkietaż curve generator app for Piotr Bosacki.
Quarter-circle arc tiling system based on golden ratio proportions.

Live site: https://andszwabe.github.io/Bosacki_Curves-Parkietaz/

## Project structure

- `index.html` (repo root) — the actual app: HTML, CSS, and UI/rendering JavaScript
  all live here. **Edit this directly** for any UI, styling, or rendering change.
- `src/engine.ts` — TypeScript source for the curve math (parsing, arc generation,
  serial transformations). Compiled to `dist/engine.js` and inlined into `index.html`
  by the build script.
- `scripts/inline.js` — build script that inlines `dist/engine.js` between the
  `// ENGINE_START` and `// ENGINE_END` markers in `index.html`.
- `dist/` — TypeScript compiler output (gitignored).
- `.nojekyll` — tells GitHub Pages to skip Jekyll and serve files as-is.

## Local development

Install dependencies once:

```bash
npm install
```

When you change `src/engine.ts`, regenerate the inlined engine in `index.html`:

```bash
npm run build
```

When you change anything else (HTML, CSS, UI JS), just edit `index.html` directly —
**no build step needed**. Open `index.html` in a browser to test.

## Deployment

GitHub Pages is configured as **"Deploy from a branch"** — `main` branch, root folder.

Workflow:

1. Edit `index.html` (UI/CSS/UI JS) and/or `src/engine.ts` (curve math).
2. If you changed `src/engine.ts`, run `npm run build`.
3. Commit and push to `main`.
4. Pages picks up the new `index.html` within ~1 minute and serves it at
   https://andszwabe.github.io/Bosacki_Curves-Parkietaz/

`.nojekyll` at the repo root tells Pages to skip Jekyll processing and serve
files as-is. Do not remove it.

## Branching

- `main` — production. Pushes auto-deploy via GitHub Pages.
- `dev` — work-in-progress. Merge into `main` with `--no-ff` to release.
