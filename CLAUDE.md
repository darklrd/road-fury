# CLAUDE.md

High-speed browser racing game built with Three.js, TypeScript, and Vite.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Typecheck + production build
pnpm test       # Run all tests (vitest)
pnpm preview    # Preview production build
```

## Project Structure

```
src/
  main.ts              # Entry point — creates Game and calls start()
  game/
    Game.ts            # Game loop, scene setup, orchestrates all modules
    PlayerCar.ts       # Car physics (speed, steering, drift) and 3D model
    Road.ts            # Procedural road generation with sine-wave curves
    Camera.ts          # Chase camera with speed-based FOV and shake
    Input.ts           # Keyboard state tracker (WASD / arrows)
    HUD.ts             # Speed, gear, off-road warning display
    Environment.ts     # Sky, ground, trees, poles, mountains
tests/
    *.test.ts          # Vitest unit tests with pure simulation helpers
```

## Architecture

Game loop runs via `requestAnimationFrame`. Each frame updates in order:
`PlayerCar` -> `Road` -> `Environment` -> `Camera` -> `HUD` -> `render`

- `PlayerCar` reads `Input` for controls, queries `Road` for curve data
- `Road` recycles segments and computes curves via layered sine waves (`computeCurve`, `computeCurveSlope`)
- `Camera` lerps toward car position; FOV widens and shake increases with speed
- `HUD` is pure DOM — no canvas overlay

## Code Conventions

- **Files/classes**: PascalCase (`PlayerCar.ts`, `class Road`)
- **Variables/functions**: camelCase (`laneOffset`, `getCurveAt`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SPEED`, `DRIFT_FACTOR`)
- **Exports**: Named exports only, no default exports
- **TypeScript**: Strict mode, `noUnusedLocals`, `noUnusedParameters`
- No ESLint or Prettier configured

## Testing

- Framework: Vitest (`tests/**/*.test.ts`)
- Tests use pure simulation helper functions to test physics logic without Three.js mocks
- 3 test files: `player-car.test.ts` (14 tests), `road.test.ts` (9 tests), `camera.test.ts` (8 tests)

## Git Conventions

Conventional commits with scope:
```
type(scope): short summary

Optional body explaining why.
```
Types: `feat`, `fix`. Scopes: `gameplay`, `road`, `camera-and-steering`, etc.

## Deployment

GitHub Pages via GitHub Actions on push to `main`. Vite base path is `/road-fury/`.
