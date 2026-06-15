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
- **Moduł** — a quarter-circle arc module (sizes 1–7)
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

## Reference

- Source PDF: `../input/Bosacki_objasnienie-parkietazu.pdf`
- Original scripts: `../input/old-scripts-from-piotr/`
- Project note: `../Z-2605_Bosacki_Curves-Parkietaż.md`
