## Demo  
https://musical-buttercream-abc06b.netlify.app/

# A Love Story 💕

Gift your soul-mate a game just for them!

A fully offline-capable infinite platformer built as a personal gift. Designed and engineered from scratch using Phaser 3, vanilla JavaScript, and the Web Audio API — no build tools, no bundler, no dependencies beyond the game engine itself.

## Personalize It!
1. Constants file is located at 'romantic-game/src/constants.js'
2. ```js
   export const HER_NAME = 'Their_Name'; // ← change this to his/her name before gifting
   ```
3. Messages file is located at 'romantic-game\src\config\messages.js'
4. 
  
> Installable directly from the browser as a PWA. No app store required.

---

## Features

- **Infinite procedural level generation** — every level is uniquely generated using a column-by-column chunk system. A BFS pathfinding pass validates every level is solvable before the player sees it
- **Progressive Web App (PWA)** — installable to the phone home screen directly from the browser; fully playable offline after first visit
- **7 hand-crafted biomes** — arctic, castle, city, desert, forest, loveland, mountains — each with a parallax background and skybox. A shuffle-bag rotation ensures every biome appears with equal frequency
- **Procedural audio** — all sound effects and background music are synthesized at runtime using the Web Audio API. Drop in a real MP3 and it overrides the synthesized version automatically
- **Mobile-first controls** — dedicated left/right touch zones, multi-touch jump support, landscape lock with portrait rotation prompt
- **Platform variety** — standard, blinking, conveyor, and tower chunk platforms; ladders with full up/down climbing; BFS validates all platform types for reachability
- **Love note cutscenes** — custom message shown between every level
- **Persistent high score** and music/SFX settings via `localStorage`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game engine | [Phaser 3.60](https://phaser.io/) — hosted locally for offline support |
| Language | Vanilla JavaScript (ES6 modules) |
| Audio | Web Audio API — fully procedural synthesis |
| Persistence | `localStorage` |
| Graphics | 100% procedurally generated — no sprite sheets or image assets for game objects |
| Deployment | [Netlify](https://netlify.com) (static, zero-config) |
| PWA | Service Worker + Web App Manifest |
| Build tooling | None — zero build step, zero bundler |

---

## Architecture

```
├── index.html                  # Entry point — manifest link, SW registration
├── manifest.json               # PWA config: name, icon, display mode, orientation
├── service-worker.js           # Offline caching — all assets cached after first visit
├── src/
│   ├── main.js                 # Phaser game config and scene registration
│   ├── constants.js            # Physics constants, player name, storage prefix
│   ├── config/
│   │   ├── levelGenerator.js   # Procedural generation + BFS solvability validation
│   │   ├── biomes.js           # Shuffle-bag biome rotation with localStorage persistence
│   │   └── messages.js         # Love note messages shown between levels
│   └── scenes/
│       ├── PreloaderScene.js   # Asset loading + procedural texture/sound generation
│       ├── MenuScene.js        # Main menu with PIN-locked dev access
│       ├── GameScene.js        # Core gameplay loop
│       ├── PauseScene.js       # Pause overlay with music/SFX toggles
│       ├── LoveNoteScene.js    # Between-level message cutscene
│       ├── EndingScene.js      # Final ending sequence
│       └── DevMenuScene.js     # Developer biome tester (PIN-locked)
├── assets/
│   ├── phaser.min.js           # Phaser 3.60 bundled locally for full offline support
│   ├── backgrounds/            # Biome background + skybox images (7 biomes)
│   ├── sounds/                 # bgm.mp3
│   └── icons/                  # PWA icon (SVG)
└── netlify.toml                # Netlify deployment config
```

---

## Level Generation

Levels are generated column-by-column with difficulty scaling linearly as the player progresses:

1. **Chunk selection** — each column selects from standard platforms, blinking platforms, conveyors, tower stacks, and ladder segments weighted by current difficulty
2. **BFS validation** — after generation, a breadth-first search simulates the full reachable area using exact physics constants (gravity, jump velocity, move speed). Levels that fail are discarded and regenerated — up to 15 attempts
3. **Phantom nodes** — moving platform BFS waypoints are flagged `phantom: true` and skipped at render time
4. **Vertical growth** — map width and height grow linearly with level number, so the game gets physically larger over time

Physics constants: `GRAVITY = 1000`, `JUMP_V = -460`, `MOVE_SPEED = 200`.

---

## Running Locally

No build step — just serve the folder over HTTP.

```bash
# Python
cd martha-game
python -m http.server 8080
# open http://localhost:8080

# Node
cd martha-game
npx serve .
```

Or use the [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension — right-click `index.html` → Open with Live Server.

> `file://` URLs will not work due to ES6 module CORS restrictions.

---

## Deployment

The game is a fully static site. Drag the project folder to [netlify.com/drop](https://app.netlify.com/drop) — a live HTTPS URL is generated instantly. A `netlify.toml` is already configured in the repo.

---

## Installing as a Phone App (PWA)

Once deployed to a live HTTPS URL, the game can be installed as a home screen app.

**iPhone — Safari only:**
1. Open the URL in Safari (not Chrome or any other browser)
2. Tap the **Share** button (box with arrow, bottom of screen)
3. Scroll down → **Add to Home Screen** → **Add**

**Android — Chrome:**
Chrome shows an automatic **"Add to Home Screen"** banner after a few seconds.

Once installed and opened once with wifi, all assets are cached by the service worker and the game runs fully offline.

---

## Controls

| Input | Action |
|-------|--------|
| `←` / `A` | Move left |
| `→` / `D` | Move right |
| `↑` / `W` / `Space` | Jump |
| `↑` while on ladder | Climb up |
| `↓` while on ladder | Climb down |

**Mobile:** Left/right touch zones on screen edges. Tap anywhere else to jump. Multi-touch is supported for simultaneous move + jump.

---

## Design Decisions

**No bundler** — Phaser loads as a single script tag; all game code uses native ES6 `import/export`. Zero config, immediately deployable to any static host.

**No sprite assets** — every texture (player, platforms, collectibles, enemies, UI elements) is drawn programmatically in `PreloaderScene._createTextures()` using Phaser's Graphics API. No asset pipeline, no file management — the game is self-contained in source code.

**Procedural audio** — sound effects and BGM are synthesized via `AudioContext.createBuffer()`. A real audio file dropped into `assets/sounds/` overrides the synthesized version automatically, with zero code changes.

**BFS-validated generation** — rather than hoping a generated level is playable, every level is proven solvable before the player sees it. The BFS uses the exact same physics constants as the Phaser arcade physics engine.

**Offline-first** — Phaser itself is hosted locally rather than from CDN, so the service worker can cache the entire game. After one visit with wifi, the game runs with no internet connection.

---

## Extend the Project!

A PIN-locked developer panel is built into the main menu. It gives access to level-skip shortcuts and a biome tester scene.

**To open the dev panel:**
1. On the main menu, click the small 🔒 icon in the **bottom-left corner** (it's intentionally subtle)
2. A PIN pad will appear — enter your 4-digit PIN and press **✓** to confirm
3. Two dev buttons will appear at the bottom of the screen:
   - **Jump to Level 15** — skips directly to a later level for testing difficulty scaling
   - **Biome Tester** — opens `DevMenuScene`, letting you preview each biome individually

**Changing the PIN:**

The PIN is defined at the top of `src/scenes/MenuScene.js`:

```js
const DEV_PIN = '1234'; // ← change this to your preferred PIN
```

**Disabling dev mode before gifting:**

Set `DEV_MODE = false` in `src/constants.js` to hide developer UI and disable shortcuts:

```js
export const DEV_MODE = false; // ← set to false before gifting
```

 
 
