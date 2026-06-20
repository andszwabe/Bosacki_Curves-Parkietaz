# Bosacki Curves — Parkietaż App

App for artist Piotr Bosacki to generate "parkietaż" curve drawings by typing sequences like `1P2P3L4L` (size + chirality). Single user, must be drop-dead simple. Live at https://andszwabe.github.io/Bosacki_Curves-Parkietaz/.

## Hard conventions

- **L = Lewo, P = Prawo.** Never use `R` for right. Polish UI strings stay Polish.
- **Module sizes 1–32.** Engine clamps; UI says "1 do 32".
- **Module radius = φ^N** where φ = 1.61803… (golden ratio).
- **Case-insensitive notation** — `1p` and `1P` are the same.
- **localStorage keys are pinned forever.** `bosacki_saved_layouts` (Biblioteka) and `bosacki_saved_presets` (Tryb Absolutny presets) are user data that lives on each user's device. Renaming or restructuring either key without a migration step makes user data silently disappear. If a schema change is ever needed, write a backwards-compatible migration that runs on load.

## Project layout

```
parkietaz-app/          ← repo root, git-tracked
  index.html            ← THE app: HTML + CSS + UI JS, all inline. Edit directly.
  src/engine.ts         ← curve math (TypeScript) — parseNotation, generateArcs, applyTransformation
  scripts/inline.js     ← inlines dist/engine.js between // ENGINE_START / // ENGINE_END markers
  package.json          ← one devDep: typescript
  .nojekyll             ← required, do not remove
../Z-2605_Bosacki_Curves-Parkietaż.md  ← project note: open todos, Bosacki's notes, history (NOT in repo)
../input/               ← Bosacki source materials, PDF, old Python scripts (NOT in repo)
```

## Build

- **Edited only `index.html` (UI/CSS/JS):** no build needed, just commit.
- **Edited `src/engine.ts`:** run `npm run build` (it compiles TS and re-inlines into `index.html`); commit both `src/engine.ts` and the resulting `index.html` change in the same commit.

## Branches and release

- `main` — production. Push triggers GitHub Pages auto-deploy (~1 min). Tags live here. **Never commit directly.**
- `dev` — all work happens here. Default branch when starting.
- `recovery/*` — frozen artifacts. Read-only, never edit.

**Release flow** (only when user explicitly asks for a release):

```bash
# on dev
# bump version in package.json, commit "chore: bump version to X.Y.Z"
git checkout main && git pull --ff-only
git merge --no-ff dev -m "release: vX.Y — short summary"
git tag -a vX.Y -m "vX.Y — short summary"
git push && git push origin vX.Y
git checkout dev
```

## Commit discipline (read this — it's bitten us before)

- **Commit after every working change. Push every commit.** Do not accumulate uncommitted edits across more than ~30 minutes of active work. If you sense quota / time running low, commit and push *now*, even if the work is half-done — use a `wip:` prefix.
- One logical change per commit. Subject ≤ 72 chars, conventional prefix (`feat(scope):`, `fix(scope):`, `style(scope):`, `refactor(scope):`, `chore:`, `docs:`).
- Body explains *why* and lists user-visible behavior changes.
- **Never** `git push --force`, `git reset --hard` on a pushed branch, delete branches/tags, or edit/rebase the `recovery/*` branches.

## App architecture (cheat sheet)

- **`appState`** — global object in `index.html`. Holds `series[]`, `viewMode` (`'relative'` | `'absolute'`), `printSettings`, `ukladName`.
- **`appState.series[i]`** fields: `id`, `originalNotation`, `transformedNotation`, `transformation` (`'O'`|`'I'`|`'R'`|`'RI'`), `arcs`, `color`, `selected`, `visible`, `strokeWidth`.
- **Engine functions** (inlined): `parseNotation(str)`, `generateArcs(modules, scale?)`, `applyTransformation(modules, type)`.
- **Render entrypoint:** `renderCurves()`. Animation: `startAnimation()` / `stopAnimation()`. Absolutny field changes route through `handleManualChange()`.
- **Filenames:** `U_<name-or-timestamp>_S_<series>.ext`. Polish diacritics ASCII-transliterated. See `getSanitizedFilenamePrefix()`.

## Working with this codebase

- The committed root `index.html` is what gets served. No build artifact published.
- When making UI changes, the project note (`../Z-…parkietaż.md`) holds the current todo list and Bosacki's pending requests — check it before suggesting new work.
- Obsidian wiki-links (`[[NoteName]]`) in any file resolve to `<NoteName>.md` in master folder, app folder, or `../input/` (in that order).
- Do not reintroduce GitHub Actions for deployment — billing was locked on the free account; "Deploy from a branch" is the working setup.

## Update protocol

When you finish a task, update the project note (`../Z-…parkietaż.md`) — mark items done with date, add new items if discovered. Update this `AGENTS.md` only if a hard convention or workflow rule changed.
