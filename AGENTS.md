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
  index.html            ← THE app: HTML + CSS + UI JS all inline here (edit directly)
  src/engine.ts         ← curve math only (TypeScript); compiled → dist/engine.js → inlined
  scripts/inline.js     ← inlines dist/engine.js between ENGINE_START/ENGINE_END markers
  tsconfig.json         ← compiles src/engine.ts only (outFile: dist/engine.js)
  package.json          ← version 1.3.0, one devDep: typescript
  .nojekyll             ← keeps GitHub Pages from running Jekyll
../input/               ← source materials from Bosacki (NOT in repo)
../Z-2605_Bosacki_Curves-Parkietaż.md  ← project note (NOT in repo)
```

**Removed in v1.3 arch refactor:** `src/index.html`, `src/renderer.ts`, `style.css` — their content now lives directly in `index.html`.

## Constraints

- **Machine:** P1 laptop only. All development happens on P1.
- **Hermes Agent** accesses this project via SSH from aspc → p1.
- **Antigravity IDE** runs locally on P1.
- **GitHub:** andszwabe/Bosacki_Curves-Parkietaz (public)

## Build & Deployment (IMPORTANT)

### Hybrid architecture (since v1.3 prep, 2026-06-17)

The project uses a **hybrid** model:

- `index.html` (repo root) is the **single source of truth for UI**: HTML, CSS,
  and all UI/rendering JavaScript live inline in this one file. Edit it directly.
- `src/engine.ts` is the **TypeScript source** for the curve math: `parseNotation`,
  `generateArcs`, `applyTransformation`, and supporting types. It is compiled by
  `tsc` into `dist/engine.js` and inlined into `index.html` between the markers
  `// ENGINE_START` and `// ENGINE_END` by `scripts/inline.js`.
- `dist/` and `node_modules/` are gitignored.

### When to run `npm run build`

- **Only if you changed `src/engine.ts`.** The build step compiles TS → JS and
  re-inlines it into `index.html`. The script is idempotent — running it multiple
  times gives the same result.
- For any other change (HTML structure, CSS, UI JavaScript, modal logic, event
  handlers, etc.), edit `index.html` directly. **Do NOT run `npm run build` if
  you only changed `index.html`** — it will overwrite the engine block but is
  otherwise a no-op; you don't need to.

### Deployment (GitHub Pages, "Deploy from a branch")

- Pages source is configured to **"Deploy from a branch"** → `main` → `/` (root).
- There is **no GitHub Actions workflow**. Deployment is just GitHub serving the
  committed root `index.html` directly.
- `.nojekyll` is present at the repo root so Pages skips Jekyll. Do not remove it.

### Implications for agents (READ THIS)

- The committed root `index.html` IS what gets deployed. There is no other
  build artifact published.
- Working flow on `dev`:
  1. Edit `index.html` (UI/CSS/UI JS) and/or `src/engine.ts` (curve math).
  2. If you changed `src/engine.ts`, run `npm run build`.
  3. Commit (including the updated `index.html` produced by the build).
  4. When ready to release, merge `dev` into `main` with `--no-ff` and push.
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
- `dev` — work-in-progress. Merge into `main` with `--no-ff` to release. Tag releases as `vX.Y` (e.g. `v1.2`, `v1.2.1`).

## Reference

- Source PDF: `../input/Bosacki_objasnienie-parkietazu.pdf`
- Reference SVG (Seria A): `../input/seria-a.svg` — 24 named segments, exported from Inkscape
- Original scripts: `../input/old-scripts-from-piotr/`
- Project note: `../Z-2605_Bosacki_Curves-Parkietaż.md`
- Research note: `../res_Bosacki_Curves_SVG_Arc_Generation_Solutions.md`

## Current Feature Set (v1.3, 2026-06-17)

### Tryb Relatywny (default)
- Textarea input: one or more notations, one per line (e.g. `1p2p3p4p5l6l7l6l5p4p3p2p`)
- Each line = one Seria with its own colour and legend row
- Buttons per Seria: O (Oryginał) / I (Inwersja, swap L↔P) / R (Rak, reverse) / IR (Inwersja Raka)
- Visibility toggle, focus mode, Kolor/Mono toggle
- Odbicie lustrzane button (mirrors whole textarea L↔P)
- Biblioteka modal (save/load named notation sets, localStorage: `bosacki_saved_layouts`)
- Animation: arcs draw on load and on canvas click or Space key
- Export: SVG only, no background, filename `parkiet_S-1-3-7.svg` (combined) or `parkiet_<notation>.svg` (Osobno)
- "Osobno" checkbox next to download button — one file per Seria

### Tryb Absolutny
- Toggle button beneath the canvas: **Tryb Relatywny ↔ Tryb Absolutny**
- Settings panel (visible only in Absolutny): Format (Preset) dropdown, Jednostka (px/cm/mm/in), Szerokość, Wysokość, Margines, Wielkość łuku o wartości 1, Przesunięcie X/Y (%), Autocentrowanie
- Switching Jednostka **converts all numeric fields live** (300 DPI for px↔physical)
- Built-in presets: 4K UHD, Full HD, A4/A3 horizontal/vertical, Custom
- **Presety modal** ("Zapisz / Załaduj" button at bottom-right of settings): save/load named full-settings snapshots, localStorage: `bosacki_saved_presets`
- Export card (Format pliku) visible only in Absolutny: SVG / PDF / PNG / JPEG, DPI selector, Białe tło checkbox
- Scale parameter flows into `generateArcs(modules, scale)` — arc radii scale proportionally

### Keyboard shortcuts
- **Space** — toggle animation (ignored when textarea/input focused or modal open)
- **Esc** — close topmost open modal (generic; works for any `.modal-overlay`)
- **Enter** in Biblioteka / Presety name inputs — saves immediately

### Export filename convention
- Prefix: `parkiet_`
- Combined (no Osobno): `parkiet_S-<n1>-<n2>-….ext` (series numbers from `appState.series`)
- Split (Osobno): `parkiet_<notacja>.ext` (per-Seria notation string)
- Future (not yet implemented): when Układ name field is added → `parkiet_U-<name>_S-<n>.ext`

### Architecture notes for the next agent
- `appState` (global object in `index.html`) holds all runtime state: `series[]`, `viewMode`, `printSettings`
- `appState.series[i]` fields: `id`, `originalNotation`, `transformedNotation`, `transformation` ('O'|'I'|'R'|'RI'), `arcs`, `color`, `selected`, `visible`
- Engine functions (inlined from `src/engine.ts`): `parseNotation(str)`, `generateArcs(modules, scale?)`, `applyTransformation(modules, type)`
- `handleManualChange()` is the central re-render trigger for Absolutny settings changes
- `renderCurves()` / `startAnimation()` / `stopAnimation()` — main draw cycle

## Planned / Future Work

- [ ] **Układ naming before export** — a text input below the Tryb toggle button where user can name the current układ. When set, filenames become `parkiet_U-<name>_S-1-3.svg` (combined) or `parkiet_U-<name>_<notation>.svg` (split).
- [ ] **Line thickness per Seria** — noted by Bosacki ("grubość kreski - per seria")
- [ ] **Phase 3** — TBD

## Rules for Agents

- Every time you make changes to the codebase, review this `AGENTS.md` file and keep the project note `../Z-2605_Bosacki_Curves-Parkietaż.md` up to date with task progress, milestones, and completed features.

