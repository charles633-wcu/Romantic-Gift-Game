# Romantic 2D Platformer Game — Design Spec

**Date:** 2026-03-17
**Project:** Martha_Project
**Purpose:** A personalized romantic gift — a 2D platformer game for the developer's girlfriend.

---

## Overview

A browser-based 2D platformer game built with Phaser 3 (v3.60+), deployed as a static site on Netlify. The player controls a cute heart-with-legs character through 10 kawaii-themed levels, collecting floating hearts and avoiding obstacles. At the end of each level, a personalized love note is revealed. After completing all 10 levels, a special final message is displayed.

---

## Visual Style

- **Aesthetic:** Cute / Kawaii — soft pastel colors, rounded shapes, adorable characters
- **Color palette:** Pinks, purples, light blues, soft greens, warm yellows
- **Character:** A small heart with legs as the player avatar (32×32px sprite, 4-frame walk animation, 1-frame jump)
- **Obstacles:** Soft, non-threatening enemies (butterflies patrolling left/right)
- **Backgrounds:** Unique kawaii-themed background image per level (800×450px)
- **Target resolution:** 800×450px canvas, scaled to fill viewport with letterboxing

### Asset Sources

All assets are sourced from free/open-license kawaii sprite packs (e.g. itch.io free assets) or created as simple colored shapes in code as placeholders. The spec does not require custom art — placeholder colored rectangles and emoji-style sprites are acceptable for v1.

**Minimum required assets:**
- `assets/sprites/heart-player.png` — spritesheet: 4 walk frames + 1 jump frame (32×32px each)
- `assets/sprites/heart-collect.png` — small collectible heart (16×16px)
- `assets/sprites/heart-goal.png` — large goal portal heart (48×48px), animated pulse
- `assets/sprites/butterfly.png` — obstacle enemy (32×32px), 2-frame flap
- `assets/backgrounds/level-{1..10}.png` — one background per level (800×450px)
- `assets/sounds/bgm.mp3` — looping background music
- `assets/sounds/collect.wav` — short collect sound
- `assets/sounds/jump.wav` — jump sound
- `assets/sounds/level-complete.wav` — level complete jingle

---

## Game Flow

```
Title Screen → Level 1 → Love Note → Level 2 → Love Note → ... → Level 10 → Love Note → Special Ending
```

### Screens

1. **MenuScene** — Title, her name, Play button, music toggle button
2. **GameScene** — Platformer level, reused for all 10 levels, loads config from `levels.json`
3. **LoveNoteScene** — Love note reveal between levels
4. **EndingScene** — Final screen after level 10

---

## Gameplay Mechanics

### Physics (Phaser 3 Arcade Physics)

| Setting | Value |
|---|---|
| Gravity Y | 800 |
| Player move speed | 200 px/s |
| Jump velocity Y | -500 |
| Max fall speed | 600 px/s |

### Player Character

- Move left/right: Arrow keys or A/D
- Jump: Space or Up arrow (single jump only, no double jump)
- **Desktop:** keyboard only
- **Mobile:** two on-screen touch zones at the bottom of the screen (80px tall, full width, split at center):
  - Left half bottom → move left
  - Right half bottom → move right
  - Tap anywhere on screen above the 80px zone → jump
  - Rendered as semi-transparent pink overlays with `←` and `→` labels

### Level Elements

| Element | Behavior |
|---|---|
| 💕 Collectible hearts | Static floating pickups. Collected on overlap. Count tracked in HUD. |
| 💝 Goal portal | Reached at the end of the level. Triggers LoveNoteScene on player overlap. |
| 🦋 Butterfly obstacle | Patrols left/right: starts at defined `x` position, moves `range` pixels in each direction at 80 px/s, reverses on reaching patrol boundary. Does not fall off platforms. On player contact: subtract 1 life, 1.5s invincibility window (player flashes), respawn player at level start position. |
| Platforms | Static rectangles defined in `levels.json`. Pink/purple colored tiles. |

### Lives & Restart

- Player starts each level with 3 lives; lives reset to 3 at the start of every new level
- Losing all 3 lives restarts the current level from the beginning (no game-over screen — just a brief "Try again! 💕" overlay and level reload)
- Hearts collected count **resets** on level restart
- Falling off the bottom of the screen counts as losing a life
- There is no global game-over state; the player can retry any level indefinitely

### HUD

Displayed at top of screen:
- Left: `💗 x [lives]`
- Center: `Level [n] / 10`
- Right: `💕 [collected] / [total]`

Hearts collected is cosmetic — displayed for fun, not required to complete the level. The count is not shown on the LoveNoteScene or EndingScene. Collecting all hearts in a level has no special effect in v1.

---

## Level Layout

Platform layouts are defined per-level in `levels.json` as arrays of platform objects. Each platform has x, y, width, height. The goal portal position is also defined per level.

Butterfly obstacles are defined as arrays with a start position and patrol range.

```json
{
  "levels": [
    {
      "id": 1,
      "background": "level-1",
      "note": "Your love note text here...",
      "platforms": [
        { "x": 0, "y": 400, "w": 800, "h": 20 },
        { "x": 150, "y": 300, "w": 120, "h": 20 },
        { "x": 350, "y": 220, "w": 120, "h": 20 },
        { "x": 580, "y": 160, "w": 120, "h": 20 }
      ],
      "hearts": [
        { "x": 180, "y": 270 },
        { "x": 390, "y": 190 }
      ],
      "butterflies": [
        { "x": 350, "y": 185, "range": 100 }
      ],
      "goal": { "x": 650, "y": 110 }
    }
  ]
}
```

---

## Scene Details

### MenuScene
- Kawaii title text (e.g. "A Love Story 💕")
- Subtitle with her name (hardcoded string constant defined at the top of `MenuScene.js`)
- "▶ Play" button — starts Level 1
- "♪ / 🔇" toggle — mutes/unmutes background music
- Soft animated floating hearts in background

### GameScene
- Loads level data from `levels.json` by current level index
- Builds platforms, hearts, butterflies, goal portal from level data
- Runs Arcade Physics game loop
- On goal portal overlap → stops music briefly, plays level-complete jingle → transitions to LoveNoteScene passing level index

### LoveNoteScene
- Background: warm cream/yellow gradient
- Animated envelope icon opens to reveal note (simple tween: scale from 0 to 1)
- "Level [n] Complete! 💌" heading
- Note text (loaded from levels.json, centered, italic font, max 3 lines)
- "Next Level →" button (or "See Ending 💕" on level 10)
- No replay or menu button on this screen

### GoalPortal
- `heart-goal.png` spritesheet (4 frames, 48×48px each) plays as a looping pulse animation at 8 fps
- Slight scale tween (1.0 → 1.1 → 1.0) layered on top for extra visual pop

### EndingScene
- Full-screen pink/purple gradient background
- Confetti particle effect (hearts raining down)
- Large "You did it! 🎉💕" heading
- Final romantic message (hardcoded, not from levels.json — the developer writes this directly in EndingScene.js)
- "Play Again" button that returns to MenuScene
- Background music resumes or switches to a softer track

---

## Architecture

### Tech Stack

- **Game Engine:** Phaser 3 v3.60+ (loaded from CDN: `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`)
- **Language:** JavaScript (ES6 modules)
- **Module bundler:** None — plain `<script type="module">` tags, loaded via a dev server
- **Data:** Static `levels.json` loaded via `fetch()` — **requires a local dev server** (`npx serve .` or `python -m http.server`); opening `index.html` directly as a file will fail due to CORS
- **Deployment:** Netlify (static site, no build step)

### index.html Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>A Love Story 💕</title>
    <style>body { margin: 0; background: #1a1a2e; }</style>
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
    <script type="module" src="src/main.js"></script>
  </body>
</html>
```

`main.js` imports all scenes, creates the Phaser Game config, and fetches `levels.json` before booting. The game canvas is auto-centered via Phaser's `CENTER_BOTH` scale mode.

### Project Structure

```
martha-game/
├── index.html
├── src/
│   ├── main.js
│   ├── scenes/
│   │   ├── PreloaderScene.js    ← loads all assets, then starts MenuScene
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   ├── LoveNoteScene.js
│   │   └── EndingScene.js
│   └── config/
│       └── levels.json
├── assets/
│   ├── sprites/
│   │   ├── heart-player.png     ← spritesheet: 5 frames, each 32×32px (frames 0-3 = walk, frame 4 = jump)
│   │   ├── heart-collect.png    ← single frame, 16×16px
│   │   ├── heart-goal.png       ← spritesheet: 4 frames for pulse animation, 48×48px each
│   │   └── butterfly.png        ← spritesheet: 2 frames (wing up/down), 32×32px each
│   ├── backgrounds/
│   │   ├── level-1.png          ← 800×450px, one per level
│   │   └── ... (level-2 through level-10)
│   └── sounds/
│       ├── bgm.mp3
│       ├── collect.wav
│       ├── jump.wav
│       └── level-complete.wav
└── netlify.toml
```

### Browser Support

Modern evergreen browsers only: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. No IE11 support required.

---

## Deployment

1. Develop locally: `npx serve .` from project root
2. No build step — all files are static
3. Zip the project folder (excluding `.venv` and any dev files)
4. Drag and drop to [Netlify](https://netlify.com)
5. Share the generated URL (e.g. `your-love-game.netlify.app`)

`netlify.toml` full content:
```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

---

## Out of Scope

- Save state / progress persistence across sessions
- Level editor UI
- Multiplayer
- Dynamic content updates after deploy
- Custom domain (user can configure separately on Netlify)
- Double jump, wall jump, or advanced movement
- Enemy AI beyond simple left/right patrol

---

## Success Criteria

- Game loads in browser with no errors on Chrome/Firefox/Safari
- All 10 levels are playable from start to finish
- Love notes display correctly after each level, loaded from `levels.json`
- Final EndingScene plays after level 10
- Deployed Netlify URL is shareable and works on mobile
- `levels.json` is editable without touching any other code file
