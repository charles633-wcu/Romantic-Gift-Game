# Romantic Platformer Game Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based kawaii 2D platformer game as a romantic gift, with 10 levels, collectible hearts, butterfly obstacles, and a personalized love note revealed at the end of each level.

**Architecture:** Static Phaser 3 web app with no bundler or backend. All assets loaded in a PreloaderScene. Level layout and love notes driven by a single `levels.json` config file. Five scenes handle the full game flow: Preloader → Menu → Game → LoveNote → Ending.

**Tech Stack:** Phaser 3 v3.60.0 (CDN), JavaScript ES6 modules, Netlify static deploy.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | Entry point, loads Phaser CDN, boots `main.js` |
| `src/main.js` | Phaser Game config, registers all scenes |
| `src/constants.js` | HER_NAME, game dimensions, physics values |
| `src/scenes/PreloaderScene.js` | Creates placeholder textures, fetches `levels.json`, starts MenuScene |
| `src/scenes/MenuScene.js` | Title screen with play button and music toggle |
| `src/scenes/GameScene.js` | Core platformer: platforms, player, hearts, butterflies, goal portal, HUD |
| `src/scenes/LoveNoteScene.js` | Love note reveal with envelope animation and next-level button |
| `src/scenes/EndingScene.js` | Final ending with heart confetti and play-again button |
| `src/config/levels.json` | All 10 level layouts + love notes (developer edits this) |
| `netlify.toml` | Netlify deploy config |

---

## Task 1: Project Scaffold

**Files:**
- Create: `martha-game/index.html`
- Create: `martha-game/netlify.toml`
- Create: `martha-game/src/constants.js`
- Create: `martha-game/src/main.js`
- Create: `martha-game/src/config/levels.json` (stub, 1 level)
- Create dirs: `martha-game/src/scenes/`, `martha-game/assets/sprites/`, `martha-game/assets/backgrounds/`, `martha-game/assets/sounds/`

- [ ] **Step 1: Create project directories**

```bash
mkdir -p martha-game/src/scenes
mkdir -p martha-game/src/config
mkdir -p martha-game/assets/sprites
mkdir -p martha-game/assets/backgrounds
mkdir -p martha-game/assets/sounds
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A Love Story 💕</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `src/constants.js`**

```js
export const HER_NAME = 'Martha'; // ← change this to her name

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;

export const PHYSICS = {
  gravityY: 800,
  playerSpeed: 200,
  jumpVelocity: -500,
};

export const COLORS = {
  platform: 0xffb3d9,
  platformEdge: 0xff80bb,
  heartCollect: 0xff69b4,
  heartGoal: 0xff1493,
  butterfly: 0xc084fc,
  ground: 0x86efac,
  sky: 0xbfdbfe,
};
```

- [ ] **Step 4: Create stub `src/config/levels.json`** (1 level to start)

```json
{
  "levels": [
    {
      "id": 1,
      "background": "level-1",
      "note": "Every love story is beautiful, but ours is my favourite. 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 800, "h": 30 },
        { "x": 150, "y": 330, "w": 120, "h": 20 },
        { "x": 350, "y": 260, "w": 120, "h": 20 },
        { "x": 550, "y": 190, "w": 140, "h": 20 }
      ],
      "hearts": [
        { "x": 190, "y": 300 },
        { "x": 390, "y": 230 },
        { "x": 570, "y": 160 }
      ],
      "butterflies": [
        { "x": 350, "y": 235, "range": 100 }
      ],
      "goal": { "x": 660, "y": 145 }
    }
  ]
}
```

- [ ] **Step 5: Create `src/main.js`** (scene stubs, will fill in later)

```js
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

// Import scenes (will add as we build them)
import PreloaderScene from './scenes/PreloaderScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import LoveNoteScene from './scenes/LoveNoteScene.js';
import EndingScene from './scenes/EndingScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false },
  },
  scene: [PreloaderScene, MenuScene, GameScene, LoveNoteScene, EndingScene],
};

new Phaser.Game(config);
```

- [ ] **Step 6: Create scene stubs** so `main.js` doesn't crash on import

Create each of these with minimal content:

`src/scenes/PreloaderScene.js`:
```js
export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('PreloaderScene'); }
  preload() {}
  create() { this.scene.start('MenuScene', { levels: [] }); }
}
```

`src/scenes/MenuScene.js`:
```js
export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() { this.add.text(400, 225, 'Menu - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
```

`src/scenes/GameScene.js`:
```js
export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() { this.add.text(400, 225, 'Game - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
```

`src/scenes/LoveNoteScene.js`:
```js
export default class LoveNoteScene extends Phaser.Scene {
  constructor() { super('LoveNoteScene'); }
  create() { this.add.text(400, 225, 'LoveNote - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
```

`src/scenes/EndingScene.js`:
```js
export default class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }
  create() { this.add.text(400, 225, 'Ending - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
```

- [ ] **Step 7: Create `netlify.toml`**

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"
```

- [ ] **Step 8: Start local server and verify**

```bash
cd martha-game
npx serve .
```

Open `http://localhost:3000`. Expected: black screen with "Menu - Coming Soon" text, no console errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: project scaffold with scene stubs"
```

---

## Task 2: PreloaderScene — Textures and Level Data

**Files:**
- Modify: `src/scenes/PreloaderScene.js`

No image files needed — all sprites are created programmatically using Phaser's `Graphics` API and converted to textures. This means the game works immediately without any art assets.

- [ ] **Step 1: Replace PreloaderScene with full implementation**

```js
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('PreloaderScene'); }

  preload() {
    // Loading bar background
    const barBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 20, 0x333333);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2, 0, 20, 0xff69b4);
    bar.setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Loading... 💕', {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => { bar.width = 400 * value; });

    // Load sounds if available (fail silently if missing)
    this.load.audio('bgm', 'assets/sounds/bgm.mp3');
    this.load.audio('collect', 'assets/sounds/collect.wav');
    this.load.audio('jump', 'assets/sounds/jump.wav');
    this.load.audio('levelComplete', 'assets/sounds/level-complete.wav');
  }

  create() {
    this._createTextures();

    fetch('src/config/levels.json')
      .then(r => r.json())
      .then(data => {
        this.scene.start('MenuScene', { levels: data.levels });
      })
      .catch(() => {
        // Fallback: start with empty levels so game doesn't crash
        this.scene.start('MenuScene', { levels: [] });
      });
  }

  _createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Platform tile (32×20)
    g.clear();
    g.fillStyle(COLORS.platform);
    g.fillRect(0, 0, 32, 16);
    g.fillStyle(COLORS.platformEdge);
    g.fillRect(0, 16, 32, 4);
    g.generateTexture('platform', 32, 20);

    // Player heart body (32×32) — simple heart shape using circles + triangle
    g.clear();
    g.fillStyle(0xff4d79);
    g.fillCircle(10, 10, 10);
    g.fillCircle(22, 10, 10);
    g.fillTriangle(2, 14, 30, 14, 16, 28);
    // Legs (2 small rectangles)
    g.fillStyle(0xff4d79);
    g.fillRect(10, 27, 5, 7);
    g.fillRect(17, 27, 5, 7);
    g.generateTexture('player', 32, 34);

    // Collectible heart (16×16)
    g.clear();
    g.fillStyle(COLORS.heartCollect);
    g.fillCircle(5, 5, 5);
    g.fillCircle(11, 5, 5);
    g.fillTriangle(1, 7, 15, 7, 8, 14);
    g.generateTexture('heart-collect', 16, 16);

    // Goal portal heart (48×48)
    g.clear();
    g.fillStyle(COLORS.heartGoal);
    g.fillCircle(15, 15, 15);
    g.fillCircle(33, 15, 15);
    g.fillTriangle(2, 22, 46, 22, 24, 44);
    g.generateTexture('heart-goal', 48, 48);

    // Butterfly (32×32)
    g.clear();
    g.fillStyle(COLORS.butterfly);
    g.fillEllipse(8, 14, 14, 20);   // left wing
    g.fillEllipse(24, 14, 14, 20);  // right wing
    g.fillStyle(0x7c3aed);
    g.fillRect(14, 8, 4, 18);        // body
    g.generateTexture('butterfly', 32, 32);

    // Background gradient rectangle (800×450) — one per level, different hues
    const bgColors = [
      [0xffe4f0, 0xffd6f6], // 1 pink
      [0xe0f2fe, 0xbae6fd], // 2 sky blue
      [0xfef9c3, 0xfde68a], // 3 yellow
      [0xdcfce7, 0xbbf7d0], // 4 mint
      [0xf3e8ff, 0xe9d5ff], // 5 lavender
      [0xffe4e6, 0xfecdd3], // 6 rose
      [0xfff7ed, 0xfed7aa], // 7 peach
      [0xf0fdf4, 0xd1fae5], // 8 sage
      [0xfdf4ff, 0xf5d0fe], // 9 lilac
      [0xfff1f2, 0xffe4e6], // 10 blush
    ];

    bgColors.forEach(([top, bottom], i) => {
      g.clear();
      // Simple 2-stop gradient using fillRect with opacity layers
      g.fillStyle(top);
      g.fillRect(0, 0, 800, 225);
      g.fillStyle(bottom);
      g.fillRect(0, 225, 800, 225);
      g.generateTexture(`bg-${i + 1}`, 800, 450);
    });

    // Ground (800×30)
    g.clear();
    g.fillStyle(0x86efac);
    g.fillRect(0, 0, 800, 30);
    g.generateTexture('ground', 800, 30);

    g.destroy();
  }
}
```

- [ ] **Step 2: Verify in browser**

Reload `http://localhost:3000`. Expected: brief loading bar → "Menu - Coming Soon" text. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/PreloaderScene.js
git commit -m "feat: preloader with procedural textures and level data fetch"
```

---

## Task 3: MenuScene

**Files:**
- Modify: `src/scenes/MenuScene.js`

- [ ] **Step 1: Replace MenuScene with full implementation**

```js
import { HER_NAME, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  init(data) {
    this.levels = data.levels || [];
  }

  create() {
    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-1');

    // Floating hearts (decorative)
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 380);
      const heart = this.add.image(x, y, 'heart-collect').setAlpha(0.4);
      this.tweens.add({
        targets: heart,
        y: y - 20,
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000),
      });
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 130, 'A Love Story 💕', {
      fontSize: '42px',
      color: '#be185d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 185, `for ${HER_NAME}`, {
      fontSize: '22px',
      color: '#9d174d',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.text(GAME_WIDTH / 2, 270, '▶  Play', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#ec4899',
      padding: { x: 30, y: 12 },
      borderRadius: 20,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#db2777' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#ec4899' }));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levels: this.levels, levelIndex: 0 });
    });

    // Music toggle
    this._musicOn = true;
    const musicBtn = this.add.text(GAME_WIDTH - 20, 20, '♪', {
      fontSize: '24px',
      color: '#be185d',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    musicBtn.on('pointerdown', () => {
      this._musicOn = !this._musicOn;
      musicBtn.setText(this._musicOn ? '♪' : '🔇');
    });

    // Start BGM on Play button press (not on scene create — avoids autoplay block)
    playBtn.on('pointerdown', () => {
      // Start music on first user interaction if not already playing
      try {
        if (!this.sound.get('bgm')) {
          this._bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
          this._bgm.play();
        }
      } catch (_) {}
      this.scene.start('GameScene', { levels: this.levels, levelIndex: 0 });
    });

    // Wire music toggle to actual sound object
    musicBtn.on('pointerdown', () => {
      this._musicOn = !this._musicOn;
      musicBtn.setText(this._musicOn ? '♪' : '🔇');
      try {
        const bgm = this.sound.get('bgm');
        if (bgm) {
          if (this._musicOn) bgm.resume();
          else bgm.pause();
        }
      } catch (_) {}
    });
  }
}
```

- [ ] **Step 2: Verify in browser**

Expected: pink gradient background, title "A Love Story 💕", "for Martha" subtitle, pink Play button, floating hearts. Click Play — should navigate to "Game - Coming Soon" text.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/MenuScene.js
git commit -m "feat: menu scene with title, play button, and floating hearts"
```

---

## Task 4: GameScene — Platforms and Player Movement

**Files:**
- Modify: `src/scenes/GameScene.js`

Build the platformer core: background, platforms, player spawn, physics, keyboard controls.

- [ ] **Step 1: Replace GameScene with platform + player implementation**

```js
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.levels = data.levels || [];
    this.levelIndex = data.levelIndex || 0;
    this.lives = 3;
    this.heartsCollected = 0;
  }

  create() {
    const level = this.levels[this.levelIndex];
    if (!level) {
      this.scene.start('EndingScene');
      return;
    }

    this._buildBackground(level);
    this._buildPlatforms(level);
    this._buildPlayer(level);
    this._buildHUD(level);
    this._setupControls();
    this._setupMobileControls();
  }

  _buildBackground(level) {
    const bgKey = `bg-${level.id}`;
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bgKey);
  }

  _buildPlatforms(level) {
    this.platforms = this.physics.add.staticGroup();

    level.platforms.forEach(p => {
      // Build platform from tiles
      const tilesNeeded = Math.ceil(p.w / 32);
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.platforms.create(p.x + i * 32 + 16, p.y + p.h / 2, 'platform');
        tile.setDisplaySize(32, p.h);
        tile.refreshBody();
      }
    });
  }

  _buildPlayer(level) {
    // Spawn above first platform
    const spawnX = (level.platforms[0]?.x || 0) + 40;
    const spawnY = (level.platforms[0]?.y || GAME_HEIGHT - 60) - 40;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(PHYSICS.playerSpeed * 2, 600);
    this.spawnX = spawnX;
    this.spawnY = spawnY;

    this.physics.add.collider(this.player, this.platforms);

    // Track invincibility
    this.isInvincible = false;
  }

  _buildHUD(level) {
    // Semi-transparent HUD bar
    this.add.rectangle(GAME_WIDTH / 2, 18, GAME_WIDTH, 36, 0x000000, 0.3);

    this.livesText = this.add.text(12, 18, `💗 x ${this.lives}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(10);

    this.levelText = this.add.text(GAME_WIDTH / 2, 18, `Level ${level.id} / ${this.levels.length}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(10);

    this.heartsText = this.add.text(GAME_WIDTH - 12, 18, `💕 0 / ${level.hearts?.length || 0}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(10);
  }

  _setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  _setupMobileControls() {
    // Touch zones: bottom 80px strip, split at center
    this._touchLeft = false;
    this._touchRight = false;
    this._touchJump = false;

    this.input.on('pointerdown', (ptr) => {
      if (ptr.y > GAME_HEIGHT - 80) {
        if (ptr.x < GAME_WIDTH / 2) this._touchLeft = true;
        else this._touchRight = true;
      } else {
        this._touchJump = true;
      }
    });

    this.input.on('pointerup', (ptr) => {
      this._touchLeft = false;
      this._touchRight = false;
      this._touchJump = false;
    });

    // Draw mobile control overlays
    const isMobile = this.sys.game.device.input.touch;
    if (isMobile) {
      const leftZone = this.add.rectangle(GAME_WIDTH / 4, GAME_HEIGHT - 40, GAME_WIDTH / 2, 80, 0xffffff, 0.15).setDepth(20);
      const rightZone = this.add.rectangle(3 * GAME_WIDTH / 4, GAME_HEIGHT - 40, GAME_WIDTH / 2, 80, 0xffffff, 0.15).setDepth(20);
      this.add.text(GAME_WIDTH / 4, GAME_HEIGHT - 40, '←', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
      this.add.text(3 * GAME_WIDTH / 4, GAME_HEIGHT - 40, '→', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
    }
  }

  update() {
    const onGround = this.player.body.touching.down || this.player.body.blocked.down;
    const goLeft = this.cursors.left.isDown || this.wasd.left.isDown || this._touchLeft;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || this._touchRight;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.space)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || this._touchJump;

    if (goLeft) {
      this.player.setVelocityX(-PHYSICS.playerSpeed);
      this.player.setFlipX(true);
    } else if (goRight) {
      this.player.setVelocityX(PHYSICS.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jumpPressed && onGround) {
      this.player.setVelocityY(PHYSICS.jumpVelocity);
      try { this.sound.play('jump', { volume: 0.5 }); } catch (_) {}
    }

    // Reset touch jump each frame
    this._touchJump = false;

    // Fall off bottom = lose a life
    if (this.player.y > GAME_HEIGHT + 50) {
      this._loseLife();
    }
  }

  _loseLife() {
    if (this.isInvincible) return;
    this.lives--;
    this.livesText.setText(`💗 x ${this.lives}`);
    if (this.lives <= 0) {
      this._restartLevel();
    } else {
      this._respawnPlayer();
    }
  }

  _respawnPlayer() {
    this.isInvincible = true;
    this.player.setPosition(this.spawnX, this.spawnY);
    this.player.setVelocity(0, 0);

    // Flash effect
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvincible = false;
      },
    });
  }

  _restartLevel() {
    this.time.delayedCall(500, () => {
      // Brief overlay
      const overlay = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Try again! 💕', {
        fontSize: '36px', color: '#ffffff', backgroundColor: '#be185d', padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(50);

      this.time.delayedCall(1200, () => {
        this.scene.start('GameScene', {
          levels: this.levels,
          levelIndex: this.levelIndex,
        });
      });
    });
  }
}
```

- [ ] **Step 2: Verify in browser**

Click Play from menu. Expected: pink background, pink platform tiles, heart character on platform. Arrow keys move left/right. Space/Up jumps. Fall off bottom respawns.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: game scene with platforms, player physics, and controls"
```

---

## Task 5: GameScene — Collectible Hearts and HUD

**Files:**
- Modify: `src/scenes/GameScene.js`

Add heart spawning, overlap collection, and HUD update.

- [ ] **Step 1: Add `_buildHearts` method to GameScene**

Add this method to the GameScene class:

```js
_buildHearts(level) {
  this.heartGroup = this.physics.add.staticGroup();
  (level.hearts || []).forEach(h => {
    const heart = this.heartGroup.create(h.x, h.y, 'heart-collect');
    // Gentle float animation
    this.tweens.add({
      targets: heart,
      y: h.y - 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 500),
    });
  });

  this.physics.add.overlap(this.player, this.heartGroup, (player, heart) => {
    heart.destroy();
    this.heartsCollected++;
    this.heartsText.setText(`💕 ${this.heartsCollected} / ${level.hearts.length}`);
    try { this.sound.play('collect', { volume: 0.6 }); } catch (_) {}
  });
}
```

- [ ] **Step 2: Call `_buildHearts` from `create()`**

In `create()`, add after `_buildPlayer(level)`:

```js
this._buildHearts(level);
```

- [ ] **Step 3: Verify in browser**

Expected: small pink hearts floating above platforms. Walk into one — it disappears and HUD count updates (e.g., "💕 1 / 3").

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: collectible hearts with HUD tracking"
```

---

## Task 6: GameScene — Butterfly Obstacles and Lives

**Files:**
- Modify: `src/scenes/GameScene.js`

Add butterfly patrol behavior and contact/life-loss logic.

- [ ] **Step 1: Add `_buildButterflies` method to GameScene**

```js
_buildButterflies(level) {
  this.butterflies = this.physics.add.group();

  (level.butterflies || []).forEach(b => {
    const bf = this.butterflies.create(b.x, b.y, 'butterfly');
    bf.setVelocityX(80);
    bf.patrolStartX = b.x - b.range;
    bf.patrolEndX = b.x + b.range;
    bf.body.allowGravity = false;
    bf.body.immovable = true;
  });

  this.physics.add.overlap(this.player, this.butterflies, () => {
    this._loseLife();
  });
}
```

- [ ] **Step 2: Update butterfly patrol in `update()`**

Add this block to the `update()` method:

```js
// Butterfly patrol
this.butterflies?.getChildren().forEach(bf => {
  if (bf.x >= bf.patrolEndX) {
    bf.setVelocityX(-80);
    bf.setFlipX(true);
  } else if (bf.x <= bf.patrolStartX) {
    bf.setVelocityX(80);
    bf.setFlipX(false);
  }
});
```

- [ ] **Step 3: Call `_buildButterflies` from `create()`**

In `create()`, add after `_buildHearts(level)`:

```js
this._buildButterflies(level);
```

- [ ] **Step 4: Verify in browser**

Expected: purple butterfly patrols back and forth. Walking into it: player flashes (invincibility), life count decreases. Losing all 3 lives: "Try again! 💕" overlay, level restarts.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: butterfly obstacles with patrol and life-loss logic"
```

---

## Task 7: GameScene — Goal Portal and Level Transition

**Files:**
- Modify: `src/scenes/GameScene.js`

Add the goal portal and transition to LoveNoteScene on overlap.

- [ ] **Step 1: Add `_buildGoalPortal` method to GameScene**

```js
_buildGoalPortal(level) {
  const goal = this.physics.add.staticImage(level.goal.x, level.goal.y, 'heart-goal');
  goal.body.setSize(40, 40); // slightly smaller hitbox than visual

  // Pulse animation
  this.tweens.add({
    targets: goal,
    scaleX: 1.1,
    scaleY: 1.1,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  this.physics.add.overlap(this.player, goal, () => {
    if (this._levelComplete) return;
    this._levelComplete = true;

    try { this.sound.play('levelComplete', { volume: 0.7 }); } catch (_) {}

    // Brief pause then transition
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;

    this.time.delayedCall(800, () => {
      this.scene.start('LoveNoteScene', {
        levels: this.levels,
        levelIndex: this.levelIndex,
      });
    });
  });

  this._levelComplete = false;
}
```

- [ ] **Step 2: Call `_buildGoalPortal` from `create()`**

In `create()`, add after `_buildButterflies(level)`:

```js
this._buildGoalPortal(level);
```

- [ ] **Step 3: Verify in browser**

Expected: large pulsing pink heart at goal position. Reaching it pauses the player and transitions to "LoveNote - Coming Soon".

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: goal portal with pulse animation and level-complete transition"
```

---

## Task 8: LoveNoteScene

**Files:**
- Modify: `src/scenes/LoveNoteScene.js`

- [ ] **Step 1: Replace LoveNoteScene with full implementation**

```js
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class LoveNoteScene extends Phaser.Scene {
  constructor() { super('LoveNoteScene'); }

  init(data) {
    this.levels = data.levels || [];
    this.levelIndex = data.levelIndex || 0;
  }

  create() {
    const level = this.levels[this.levelIndex];
    const isLastLevel = this.levelIndex >= this.levels.length - 1;

    // Warm cream background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfff8e7);

    // Decorative border
    const border = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40);
    border.setStrokeStyle(3, 0xfcd34d);

    // Envelope icon (starts small, tweens to full size)
    const envelope = this.add.text(GAME_WIDTH / 2, 110, '💌', {
      fontSize: '64px',
    }).setOrigin(0.5).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: envelope,
      scale: 1,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Level complete heading (fades in after envelope)
    const heading = this.add.text(GAME_WIDTH / 2, 185, `Level ${level?.id} Complete! 💕`, {
      fontSize: '26px',
      color: '#92400e',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: heading, alpha: 1, duration: 400, delay: 500 });

    // Divider line
    const line = this.add.rectangle(GAME_WIDTH / 2, 215, 400, 2, 0xfcd34d).setAlpha(0);
    this.tweens.add({ targets: line, alpha: 1, duration: 400, delay: 700 });

    // Love note text
    const noteText = level?.note || '💕';
    const note = this.add.text(GAME_WIDTH / 2, 290, noteText, {
      fontSize: '18px',
      color: '#78350f',
      fontStyle: 'italic',
      wordWrap: { width: 580 },
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: note, alpha: 1, duration: 400, delay: 900 });

    // Next level button
    const btnLabel = isLastLevel ? 'See Ending 💕' : 'Next Level →';
    const nextBtn = this.add.text(GAME_WIDTH / 2, 400, btnLabel, {
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#f59e0b',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: nextBtn, alpha: 1, duration: 400, delay: 1200 });

    nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: '#d97706' }));
    nextBtn.on('pointerout', () => nextBtn.setStyle({ backgroundColor: '#f59e0b' }));
    nextBtn.on('pointerdown', () => {
      if (isLastLevel) {
        this.scene.start('EndingScene', { levels: this.levels });
      } else {
        this.scene.start('GameScene', {
          levels: this.levels,
          levelIndex: this.levelIndex + 1,
        });
      }
    });
  }
}
```

- [ ] **Step 2: Verify in browser**

Reach goal portal in Level 1. Expected: cream background, 💌 icon bounces in, "Level 1 Complete! 💕" heading, love note text, "Next Level →" button. Clicking it starts Level 2 (currently blank).

- [ ] **Step 3: Commit**

```bash
git add src/scenes/LoveNoteScene.js
git commit -m "feat: love note scene with envelope animation and note text"
```

---

## Task 9: EndingScene

**Files:**
- Modify: `src/scenes/EndingScene.js`

- [ ] **Step 1: Replace EndingScene with full implementation**

```js
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

// ↓ Write your final romantic message here
const FINAL_MESSAGE = "Thank you for being the best part of my every day.\nI love you more than words can say. 💕";

export default class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }

  init(data) {
    this.levels = data.levels || [];
  }

  create() {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xfce7f3, 0xfce7f3, 0xf3e8ff, 0xf3e8ff, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Heart confetti emitter
    const particles = this.add.particles(0, 0, 'heart-collect', {
      x: { min: 0, max: GAME_WIDTH },
      y: -10,
      quantity: 2,
      frequency: 200,
      speedY: { min: 80, max: 160 },
      speedX: { min: -30, max: 30 },
      scale: { min: 0.5, max: 1.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 4000,
      rotate: { min: 0, max: 360 },
      gravityY: 60,
    });

    // Main heading
    const heading = this.add.text(GAME_WIDTH / 2, 130, 'You did it! 🎉💕', {
      fontSize: '40px',
      color: '#9d174d',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: heading,
      scale: 1,
      duration: 700,
      ease: 'Back.easeOut',
    });

    // Final message
    const msg = this.add.text(GAME_WIDTH / 2, 255, FINAL_MESSAGE, {
      fontSize: '20px',
      color: '#7e1d4d',
      fontStyle: 'italic',
      wordWrap: { width: 600 },
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: msg, alpha: 1, duration: 800, delay: 600 });

    // Heart row decoration
    const hearts = this.add.text(GAME_WIDTH / 2, 350, '💗 💕 💖 💗 💕 💖 💗', {
      fontSize: '24px',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: hearts, alpha: 1, duration: 600, delay: 1000 });

    // Play Again button
    const playAgainBtn = this.add.text(GAME_WIDTH / 2, 415, 'Play Again ↺', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#ec4899',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: playAgainBtn, alpha: 1, duration: 400, delay: 1400 });

    playAgainBtn.on('pointerover', () => playAgainBtn.setStyle({ backgroundColor: '#db2777' }));
    playAgainBtn.on('pointerout', () => playAgainBtn.setStyle({ backgroundColor: '#ec4899' }));
    playAgainBtn.on('pointerdown', () => {
      this.scene.start('MenuScene', { levels: this.levels });
    });
  }
}
```

- [ ] **Step 2: Write your final message**

Open `src/scenes/EndingScene.js` and update `FINAL_MESSAGE` at the top with your personal words.

- [ ] **Step 3: Verify in browser**

Navigate to EndingScene by completing Level 1 → Love Note → click "See Ending 💕" (temporarily change LoveNoteScene to `isLastLevel = true` for testing, revert after). Expected: gradient background, heading bounces in, hearts rain down, message fades in, Play Again button works.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/EndingScene.js
git commit -m "feat: ending scene with confetti hearts and final message"
```

---

## Task 10: All 10 Levels in levels.json

**Files:**
- Modify: `src/config/levels.json`

Define all 10 levels with increasing difficulty. Each platform layout is designed so that the jump arc (velocity -500, gravity 800) can reach all platforms. Max safe jump height ≈ 156px.

- [ ] **Step 1: Replace levels.json with all 10 levels**

```json
{
  "levels": [
    {
      "id": 1,
      "background": "level-1",
      "note": "WRITE YOUR NOTE FOR LEVEL 1 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 800, "h": 30 },
        { "x": 120, "y": 330, "w": 130, "h": 20 },
        { "x": 320, "y": 260, "w": 130, "h": 20 },
        { "x": 540, "y": 190, "w": 150, "h": 20 }
      ],
      "hearts": [
        { "x": 160, "y": 300 }, { "x": 370, "y": 230 }, { "x": 580, "y": 160 }
      ],
      "butterflies": [],
      "goal": { "x": 650, "y": 145 }
    },
    {
      "id": 2,
      "background": "level-2",
      "note": "WRITE YOUR NOTE FOR LEVEL 2 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 200, "h": 30 },
        { "x": 250, "y": 350, "w": 120, "h": 20 },
        { "x": 420, "y": 280, "w": 120, "h": 20 },
        { "x": 600, "y": 420, "w": 200, "h": 30 },
        { "x": 580, "y": 330, "w": 120, "h": 20 },
        { "x": 400, "y": 200, "w": 180, "h": 20 }
      ],
      "hearts": [
        { "x": 100, "y": 390 }, { "x": 300, "y": 320 }, { "x": 460, "y": 250 }, { "x": 470, "y": 170 }
      ],
      "butterflies": [
        { "x": 460, "y": 255, "range": 80 }
      ],
      "goal": { "x": 510, "y": 155 }
    },
    {
      "id": 3,
      "background": "level-3",
      "note": "WRITE YOUR NOTE FOR LEVEL 3 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 150, "h": 30 },
        { "x": 180, "y": 340, "w": 100, "h": 20 },
        { "x": 330, "y": 420, "w": 100, "h": 30 },
        { "x": 480, "y": 340, "w": 100, "h": 20 },
        { "x": 620, "y": 260, "w": 180, "h": 20 }
      ],
      "hearts": [
        { "x": 60, "y": 390 }, { "x": 220, "y": 310 }, { "x": 375, "y": 390 }, { "x": 680, "y": 230 }
      ],
      "butterflies": [
        { "x": 480, "y": 315, "range": 70 }
      ],
      "goal": { "x": 720, "y": 215 }
    },
    {
      "id": 4,
      "background": "level-4",
      "note": "WRITE YOUR NOTE FOR LEVEL 4 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 120, "h": 30 },
        { "x": 160, "y": 300, "w": 100, "h": 20 },
        { "x": 300, "y": 200, "w": 100, "h": 20 },
        { "x": 440, "y": 300, "w": 100, "h": 20 },
        { "x": 580, "y": 200, "w": 100, "h": 20 },
        { "x": 680, "y": 300, "w": 120, "h": 20 }
      ],
      "hearts": [
        { "x": 50, "y": 390 }, { "x": 200, "y": 270 }, { "x": 340, "y": 170 }, { "x": 620, "y": 170 }
      ],
      "butterflies": [
        { "x": 440, "y": 275, "range": 70 },
        { "x": 580, "y": 175, "range": 60 }
      ],
      "goal": { "x": 740, "y": 255 }
    },
    {
      "id": 5,
      "background": "level-5",
      "note": "WRITE YOUR NOTE FOR LEVEL 5 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 100, "h": 30 },
        { "x": 140, "y": 350, "w": 80, "h": 20 },
        { "x": 260, "y": 280, "w": 80, "h": 20 },
        { "x": 380, "y": 200, "w": 80, "h": 20 },
        { "x": 500, "y": 280, "w": 80, "h": 20 },
        { "x": 620, "y": 200, "w": 80, "h": 20 },
        { "x": 680, "y": 120, "w": 120, "h": 20 }
      ],
      "hearts": [
        { "x": 50, "y": 390 }, { "x": 175, "y": 320 }, { "x": 295, "y": 250 }, { "x": 415, "y": 170 }, { "x": 730, "y": 90 }
      ],
      "butterflies": [
        { "x": 500, "y": 255, "range": 60 },
        { "x": 620, "y": 175, "range": 50 }
      ],
      "goal": { "x": 750, "y": 75 }
    },
    {
      "id": 6,
      "background": "level-6",
      "note": "WRITE YOUR NOTE FOR LEVEL 6 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 100, "h": 30 },
        { "x": 150, "y": 320, "w": 80, "h": 20 },
        { "x": 50, "y": 220, "w": 80, "h": 20 },
        { "x": 200, "y": 160, "w": 80, "h": 20 },
        { "x": 350, "y": 260, "w": 100, "h": 20 },
        { "x": 500, "y": 180, "w": 100, "h": 20 },
        { "x": 650, "y": 100, "w": 150, "h": 20 }
      ],
      "hearts": [
        { "x": 50, "y": 390 }, { "x": 185, "y": 290 }, { "x": 85, "y": 190 }, { "x": 550, "y": 150 }, { "x": 720, "y": 70 }
      ],
      "butterflies": [
        { "x": 350, "y": 235, "range": 70 },
        { "x": 500, "y": 155, "range": 70 }
      ],
      "goal": { "x": 750, "y": 75 }
    },
    {
      "id": 7,
      "background": "level-7",
      "note": "WRITE YOUR NOTE FOR LEVEL 7 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 80, "h": 30 },
        { "x": 120, "y": 340, "w": 80, "h": 20 },
        { "x": 250, "y": 260, "w": 80, "h": 20 },
        { "x": 380, "y": 340, "w": 80, "h": 20 },
        { "x": 510, "y": 260, "w": 80, "h": 20 },
        { "x": 640, "y": 180, "w": 80, "h": 20 },
        { "x": 700, "y": 100, "w": 100, "h": 20 }
      ],
      "hearts": [
        { "x": 40, "y": 390 }, { "x": 160, "y": 310 }, { "x": 290, "y": 230 }, { "x": 420, "y": 310 }, { "x": 740, "y": 70 }
      ],
      "butterflies": [
        { "x": 250, "y": 235, "range": 60 },
        { "x": 510, "y": 235, "range": 60 },
        { "x": 640, "y": 155, "range": 50 }
      ],
      "goal": { "x": 750, "y": 55 }
    },
    {
      "id": 8,
      "background": "level-8",
      "note": "WRITE YOUR NOTE FOR LEVEL 8 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 80, "h": 30 },
        { "x": 110, "y": 310, "w": 70, "h": 20 },
        { "x": 230, "y": 220, "w": 70, "h": 20 },
        { "x": 350, "y": 310, "w": 70, "h": 20 },
        { "x": 470, "y": 220, "w": 70, "h": 20 },
        { "x": 590, "y": 310, "w": 70, "h": 20 },
        { "x": 680, "y": 200, "w": 120, "h": 20 }
      ],
      "hearts": [
        { "x": 40, "y": 390 }, { "x": 145, "y": 280 }, { "x": 265, "y": 190 }, { "x": 505, "y": 190 }, { "x": 740, "y": 170 }
      ],
      "butterflies": [
        { "x": 350, "y": 285, "range": 55 },
        { "x": 470, "y": 195, "range": 55 },
        { "x": 590, "y": 285, "range": 55 }
      ],
      "goal": { "x": 750, "y": 155 }
    },
    {
      "id": 9,
      "background": "level-9",
      "note": "WRITE YOUR NOTE FOR LEVEL 9 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 80, "h": 30 },
        { "x": 100, "y": 330, "w": 70, "h": 20 },
        { "x": 210, "y": 240, "w": 70, "h": 20 },
        { "x": 320, "y": 160, "w": 70, "h": 20 },
        { "x": 430, "y": 240, "w": 70, "h": 20 },
        { "x": 540, "y": 160, "w": 70, "h": 20 },
        { "x": 650, "y": 80, "w": 150, "h": 20 }
      ],
      "hearts": [
        { "x": 40, "y": 390 }, { "x": 135, "y": 300 }, { "x": 245, "y": 210 }, { "x": 355, "y": 130 }, { "x": 720, "y": 50 }
      ],
      "butterflies": [
        { "x": 210, "y": 215, "range": 55 },
        { "x": 430, "y": 215, "range": 55 },
        { "x": 540, "y": 135, "range": 55 }
      ],
      "goal": { "x": 755, "y": 55 }
    },
    {
      "id": 10,
      "background": "level-10",
      "note": "WRITE YOUR NOTE FOR LEVEL 10 HERE 💕",
      "platforms": [
        { "x": 0, "y": 420, "w": 80, "h": 30 },
        { "x": 110, "y": 330, "w": 65, "h": 20 },
        { "x": 220, "y": 250, "w": 65, "h": 20 },
        { "x": 330, "y": 170, "w": 65, "h": 20 },
        { "x": 440, "y": 90, "w": 65, "h": 20 },
        { "x": 550, "y": 170, "w": 65, "h": 20 },
        { "x": 660, "y": 90, "w": 140, "h": 20 }
      ],
      "hearts": [
        { "x": 40, "y": 390 }, { "x": 142, "y": 300 }, { "x": 252, "y": 220 }, { "x": 362, "y": 140 }, { "x": 472, "y": 60 }, { "x": 720, "y": 60 }
      ],
      "butterflies": [
        { "x": 330, "y": 145, "range": 50 },
        { "x": 440, "y": 65, "range": 50 },
        { "x": 550, "y": 145, "range": 55 }
      ],
      "goal": { "x": 755, "y": 45 }
    }
  ]
}
```

- [ ] **Step 2: Write your 10 love notes**

Open `src/config/levels.json` and replace each `"WRITE YOUR NOTE FOR LEVEL N HERE 💕"` with your personal message. Keep each note under ~150 characters (3 short lines) so it fits the LoveNoteScene layout.

- [ ] **Step 3: Play through all 10 levels**

Start the game and verify:
- Each level loads with the correct background color
- Platform layouts are reachable (player can jump between all platforms)
- Goal portal is accessible
- Love note screen shows your custom text
- Level 10 note screen shows "See Ending 💕" button instead of "Next Level"

- [ ] **Step 4: Commit**

```bash
git add src/config/levels.json
git commit -m "feat: all 10 levels defined with platform layouts and love note placeholders"
```

---

## Task 11: Polish — Sounds and Mobile Verification

**Files:**
- No code changes — verify existing systems work end-to-end

- [ ] **Step 1: Add placeholder sounds (optional)**

If you have `.mp3`/`.wav` files, place them in `assets/sounds/`. If not, the game already handles missing sounds gracefully (try/catch in all sound calls).

Free kawaii music sources:
- `freemusicarchive.org` (filter by CC license)
- `opengameart.org` (search "cute" or "kawaii")

- [ ] **Step 2: Test on mobile**

Open `http://[your-local-ip]:3000` on your phone (must be on same WiFi). Verify:
- Touch left half of screen → player moves left
- Touch right half of screen → player moves right
- Tap above bottom strip → player jumps
- HUD is readable
- Buttons in MenuScene, LoveNoteScene, EndingScene are tappable

- [ ] **Step 3: Commit any sound files added**

```bash
git add assets/sounds/
git commit -m "feat: add game sounds"
```

---

## Task 12: Deploy to Netlify

**Files:** No code changes

- [ ] **Step 1: Final smoke test**

Play through the complete game locally:
- Menu → Level 1 → Love Note → ... → Level 10 → Love Note → Ending → Play Again → Menu

- [ ] **Step 2: Create the deploy zip**

```bash
# From inside the martha-game folder:
zip -r love-game.zip . -x "*.git*" -x "node_modules/*" -x ".venv/*"
```

Or on Windows: right-click the `martha-game` folder → Send to → Compressed (zipped) folder.

- [ ] **Step 3: Deploy to Netlify**

1. Go to [app.netlify.com](https://app.netlify.com)
2. Create a free account if needed
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `love-game.zip` file
5. Wait ~30 seconds for deploy

- [ ] **Step 4: Verify the live URL**

Open the Netlify URL (e.g. `https://amazing-name-12345.netlify.app`). Verify the full game works exactly as locally.

- [ ] **Step 5: (Optional) Rename the site**

In Netlify: Site settings → Site details → Change site name → set something like `[her-name]-love-story`.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete romantic platformer game ready for deploy"
```

---

## Done!

Share the Netlify URL with your girlfriend. 💕
