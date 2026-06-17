# Bosacki Curves — Parkietaż App

## Project Overview

App for generating "parkietaż" curve drawings for artist Piotr Bosacki.
Core idea: user inputs a sequence of L/P letters with size parameters, app renders the curve.

## Critical Conventions

### L/P NOT L/R

This project uses **Polish** direction naming:
- **L** = Lewo (Left)
- **P** = Prawo (Right)

NEVER use "R" for right. The original Bosacki Python code uses "L"/"R" — we translate to "L"/"P" in our implementation. All UI, variable names, comments, and documentation must use L/P.

### Terminology (Polish originals — do not translate)

- **Parkietaż** — the tiling/parquetry system
- **Moduł** — a quarter-circle arc module (sizes 1–32; original Bosacki spec used 1–7, app extended in v1.1.1)
- **Skrętność** — chirality/direction of the arc (L or P)
- **Wąż** — "snake" = a sequence of connected modules
- **Seria** — a specific snake built from rules (A through G)
- **Przesunięcie fazowe** — phase shift between sister series
- **Złota proporcja** — golden ratio (φ = 1.61803...)
- **Odbicie lustrzane** — mirror reflection (swap L↔P)

### Mathematical Constants

- Module size N has radius = φ^N (golden ratio to the power N)
- Size cycle (12 elements): 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2
- Chirality cycle (8 elements): P P P P L L L L

### Obsidian Link Resolution

When you encounter a reference in Obsidian wiki-link format `[[NoteName]]` in any project file, **search for the file by its name** in the following directories (in order):
1. `/home/and/Drive/02_Zlecenia/2605_Bosacki_Curves/` (master folder)
2. `/home/and/Drive/02_Zlecenia/2605_Bosacki_Curves/parkietaz-app/` (app folder)
3. `/home/and/Drive/02_Zlecenia/2605_Bosacki_Curves/input/` (input materials)

The file will have the same name as the link text, with `.md` extension. For example:
`[[res_Bosacki_Curves_SVG_Arc_Generation_Solutions]]` → find `res_Bosacki_Curves_SVG_Arc_Generation_Solutions.md`

## Project Structure

```
parkietaz-app/          ← this repo (git-tracked)
../input/               ← source materials from Bosacki (NOT in repo)
../Z-2605_Bosacki_Curves-Parkietaż.md  ← project note (NOT in repo)
```

## Constraints

- **Machine:** P1 laptop only. All development happens on P1.
- **Hermes Agent** accesses this project via SSH from aspc → p1.
- **Antigravity IDE** runs locally on P1.
- **GitHub:** andszwabe/Bosacki_Curves-Parkietaz (private)

## Build & Deployment (IMPORTANT)

### Source vs. generated files

- **Sources to edit:** `src/index.html`, `style.css`, `src/engine.ts`, `src/renderer.ts`
- **Generated (do not hand-edit):** `index.html` at the repo root — produced by `scripts/inline.js` from the sources above. It's the self-contained file served to users.
- `dist/` (TypeScript output) and `node_modules/` are gitignored.

### Build command

```bash
npm install   # once
npm run build # runs `tsc` then inlines into root index.html
```

### Deployment (GitHub Pages, "Deploy from a branch")

- Pages source is configured to **"Deploy from a branch"** → `main` → `/` (root).
- There is **no GitHub Actions workflow**. Deployment is just GitHub serving the
  committed root `index.html` directly.
- `.nojekyll` is present at the repo root so Pages skips Jekyll. Do not remove it.

### Implications for agents (READ THIS)

- **You MUST run `npm run build` before pushing to `main`** if you changed any
  source file (`src/index.html`, `src/engine.ts`, `src/renderer.ts`, `style.css`).
  Otherwise the deployed site will not reflect your changes — only the committed
  root `index.html` is served.
- Working flow on `dev`:
  1. Edit `src/` files
  2. `npm run build` — regenerates root `index.html`
  3. Commit including the regenerated `index.html`
  4. When ready to release, merge `dev` into `main` with `--no-ff` and push
- If a deployment doesn't appear after ~2 minutes, check
  https://github.com/andszwabe/Bosacki_Curves-Parkietaz/actions for any
  `pages build and deployment` failures.

### Note on Actions / auto-build

A previous attempt (Jun 17, 2026) added a GitHub Actions workflow to auto-build
on push, but the account billing system kept the workflow locked even though
the repo is public and free. We reverted to plain "Deploy from a branch" which
worked reliably for v1.0–v1.1.1. Do not reintroduce Actions without first
confirming billing is unlocked.

### Branching workflow

- `main` — production branch. Pushes auto-deploy.
- `dev` — work-in-progress. Merge into `main` with `--no-ff` to release. Tag releases as `vX.Y` (e.g. `v1.2`).

## Reference

- Source PDF: `../input/Bosacki_objasnienie-parkietazu.pdf`
- Reference SVG (Seria A): `../input/seria-a.svg` — 24 named segments, exported from Inkscape
- Original scripts: `../input/old-scripts-from-piotr/`
- Project note: `../Z-2605_Bosacki_Curves-Parkietaż.md`
- Research note: `../res_Bosacki_Curves_SVG_Arc_Generation_Solutions.md`

## Rules for Agents

- Every time you make changes to the codebase, review this `AGENTS.md` file and keep the project note `../Z-2605_Bosacki_Curves-Parkietaż.md` up to date with task progress, milestones, and completed features.

