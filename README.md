# Bosacki_Curves-Parkietaz

Parkietaż curve generator for the artist Piotr Bosacki — a web app that builds
quarter-circle arc tilings from typed sequences like `1P2P3L4L` (digit = module
size 1–32, `L` = lewo / left, `P` = prawo / right). Module radii follow the
golden ratio: r(N) = φ^N.

**Live:** https://andszwabe.github.io/Bosacki_Curves-Parkietaz/
**Single user:** Bosacki himself; designed for simplicity over flexibility.

## Features (current — v1.5.5)

- **Notation editor** — single textarea, multi-line = multiple Series overlaid.
  Dashed `1P-2P-3L` and concatenated `1P2P3L` both accepted, case-insensitive.
- **Multi-series overlay** with per-series color (HSL wheel), visibility,
  thickness, and transformation (`O` original / `I` inverted / `R` rotated /
  `IR` both). Click a legend row or press `1`–`9` to focus a Series.
- **Tryb Relatywny / Absolutny** — preview-fit vs physical sheet dimensions
  (mm/cm/in/px with live unit conversion; format presets including 4K UHD,
  Full HD, A4, A3, custom).
- **Biblioteka** — saved layouts in `localStorage`, with library name,
  search, batch download / load / delete, and JSON export/import backup.
- **Presety** — saved Absolute-mode sheet configurations.
- **Export** — per-Series or combined; SVG, PNG, PDF; configurable stroke
  thickness; "Osobno" mode = one file per Series.
- **Eksport klatek animacji** — ZIP of per-arc animation frames (one frame
  per arc, cumulative); pairs with `Smooth` / `Step` preview toggle.
- **Keyboard shortcuts** — `1`–`9` (select Series, chordable), `0` (deselect
  all), `O` / `I` / `R` (transform), `B` (Biblioteka), `K` / `M` (color /
  mono), `A` (toggle Absolutny), `S` (Smooth / Step), `H` (show/hide all),
  `D` (Pobierz), `C` (Kopiuj), `P` (Presety — Absolutny only), `-` / `+`
  (thickness; together = reset to 1.0), `Esc`, `Enter`, `Space` (animate).
  All pass through `Ctrl` / `Meta` / `Alt` to the browser.
- **Polish UI**, ASCII-transliterated filenames in the
  `U_<name-or-timestamp>_S_<series>.<ext>` scheme.

## Project structure

```
index.html            ← THE app — HTML + CSS + UI JS all inline. Edit directly.
src/engine.ts         ← TypeScript curve math (parseNotation, generateArcs,
                        applyTransformation). Compiled and inlined.
scripts/inline.js     ← Build helper: inlines dist/engine.js between
                        // ENGINE_START / // ENGINE_END markers in index.html.
package.json          ← One devDep: typescript.
tsconfig.json         ← TS compiler config (target ES2020, outDir dist/).
.nojekyll             ← Required for GitHub Pages. Do not remove.
AGENTS.md             ← Hard conventions, build/release flow, architecture
                        cheat sheet. Read before making non-trivial changes.
```

JSZip 3.10.1 is inlined into `index.html` between `// JSZIP_START` /
`// JSZIP_END` markers (used by the animation-frames ZIP export).

## Local development

Install once:

```bash
npm install
```

Day-to-day:

- **Edited only `index.html` (UI/CSS/UI JS)** — no build needed. Open the file
  in a browser to test.
- **Edited `src/engine.ts`** — run `npm run build` (compiles TS, then re-inlines
  `dist/engine.js` between the markers in `index.html`). Commit both
  `src/engine.ts` and the resulting `index.html` change in the same commit.

```bash
npm run build    # one-shot build
npm run watch    # tsc --watch (still need to re-run inline.js manually)
```

## Deployment

GitHub Pages is configured as **"Deploy from a branch"** — `main` → `/` (root).
Pushes to `main` deploy automatically in ~1 minute.

The auto-trigger occasionally stalls on free-tier repos (the webhook gets
dropped). If a push to `main` is not live within ~5 min, push an empty kick
commit:

```bash
git commit --allow-empty -m "chore: kick GitHub Pages rebuild"
git push
```

`.nojekyll` at the repo root tells Pages to skip Jekyll processing. Do not
remove it. GitHub Actions are **not** used for deploy (billing was locked on
the free account); "Deploy from a branch" is the working setup.

## Branching and releases

- `main` — production. Tags live here. Never commit directly.
- `dev` — all work happens here. Default branch when starting.
- `recovery/*` — frozen artifacts from past recovery sessions. Read-only.

Release flow (only when explicitly requested):

```bash
# on dev: bump version in package.json, commit, push
git checkout main && git pull --ff-only
git merge --no-ff dev -m "release: vX.Y.Z — short summary"
git tag -a vX.Y.Z -m "vX.Y.Z — short summary"
git push && git push origin vX.Y.Z
git checkout dev
```

## Hard conventions

These are non-negotiable; see `AGENTS.md` for the full list.

- **`L` = Lewo, `P` = Prawo.** Never `R` for right. Polish UI strings stay Polish.
- **Module sizes 1–32.** Engine clamps; UI says "1 do 32".
- **Case-insensitive notation** — `1p` and `1P` are the same.
- **`localStorage` keys are pinned forever:** `bosacki_saved_layouts`
  (Biblioteka), `bosacki_saved_presets` (Absolute-mode presets),
  `bosacki_library_name` (Biblioteka display name). Renaming any of these
  without a backwards-compatible migration silently destroys user data.

## License

Private project for a specific commission — no public license granted.
