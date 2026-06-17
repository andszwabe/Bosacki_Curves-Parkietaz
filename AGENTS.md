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

### Deployment (GitHub Actions, automatic)

- Pages source is configured to **"GitHub Actions"** (NOT "Deploy from a branch").
- Workflow: `.github/workflows/deploy.yml`
- On every push to `main`, the workflow:
  1. Checks out the repo
  2. Runs `npm ci` and `npm run build`
  3. Uploads the whole repo as a Pages artifact
  4. Deploys to https://andszwabe.github.io/Bosacki_Curves-Parkietaz/
- `.nojekyll` is present at the repo root so Pages skips Jekyll. Do not remove it.

### Implications for agents

- You can edit only `src/` files and push — the live site rebuilds automatically. No need to run `npm run build` before pushing.
- The committed root `index.html` is still useful for opening locally without a build step. Run `npm run build` before committing if you want it to reflect current sources, but the deployed version always comes from a fresh CI build, not from whatever `index.html` happens to be committed.
- If a Pages deployment fails, check https://github.com/andszwabe/Bosacki_Curves-Parkietaz/actions for the error.

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

