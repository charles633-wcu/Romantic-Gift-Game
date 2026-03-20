# Martha Project — Claude Instructions

**ALWAYS READ FIRST:** `martha-game/_PROJECT_DOCS/progress.md`

This is a romantic gift platformer game for Martha. Handle with care — the recipient will play this.

## Project Structure

```
Martha_Project/
└── martha-game/          ← all game code lives here
    ├── index.html
    ├── src/
    │   ├── main.js
    │   ├── constants.js  ← DEV_MODE flag here
    │   ├── config/       ← levelGenerator.js, messages.js
    │   └── scenes/       ← all Phaser scenes
    ├── assets/sounds/
    ├── docs/superpowers/ ← specs and plans
    └── _PROJECT_DOCS/    ← CLAUDE.md, goals.md, progress.md
```

## Tech Stack

- Phaser 3.60 (CDN, no bundler)
- ES6 modules, no build step
- Static HTML — serve any folder, no server needed
- localStorage for persistence

## Critical Rules

1. **DEV_MODE** — `src/constants.js` has `DEV_MODE = true`. Set to `false` before gifting.
2. **No external assets** — all graphics are procedurally generated in `PreloaderScene._createTextures()`
3. **Physics constants** — GRAVITY=1000, JUMP_V=-460, MOVE_SPEED=200. Generator uses these exact values for reachability math. Don't change without updating the generator.
4. **BFS validation** — `levelGenerator.js` validates every generated level is solvable. Phantom platforms (windmill BFS nodes) have `phantom:true` and must not be rendered.
5. **Netlify ready** — `netlify.toml` configured. Drag `martha-game/` to netlify.com to deploy.

## Where to Find Things

- Current task / next steps → `_PROJECT_DOCS/progress.md`
- Project goals → `_PROJECT_DOCS/goals.md`
- Implementation plans → `docs/superpowers/plans/`
- Design specs → `docs/superpowers/specs/`
