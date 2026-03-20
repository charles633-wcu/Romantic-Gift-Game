import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, STORAGE_PREFIX } from '../constants.js';
import { generateLevel } from '../config/levelGenerator.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.levelNum        = data.levelNum || 1;
    this.forceBiome      = data.forceBiome || null;
    this.lives           = 3;
    this.heartsCollected = 0;
  }

  create() {
    const level = generateLevel(this.levelNum);
    if (this.forceBiome) level.background = `bg-${this.forceBiome}`;
    const mapW  = level.mapWidth  || GAME_WIDTH;
    const mapH  = level.mapHeight || GAME_HEIGHT;
    this.mapH   = mapH;
    this._conveyorForce = 60 + Math.min(this.levelNum, 30) * 2;
    this._sfxOn = (localStorage.getItem(`${STORAGE_PREFIX}_sfx`) !== 'off');
    this._wasOnGround    = false;
    this._onWindmillArm  = false; // set at end of each frame; read at top of next
    this._ridingArm      = null;  // which arm the player is currently seated on
    this._seatOffsetX    = 0;     // player's X offset from arm centre while riding

    // Expand physics world and camera to match generated map dimensions.
    // Top and bottom are open: no ceiling so players can jump freely to any height;
    // no floor collision so the lava-fall death trigger works.
    this.physics.world.setBounds(0, 0, mapW, mapH + 100);
    this.physics.world.setBoundsCollision(true, true, false, false);

    this._buildBackground(level);
    this._buildDecorButterflies(level);
    this._buildPlatforms(level);
    this._buildPlayer(level);
    this._buildHearts(level);

    // Shared emitter — reused for all heart collects in this level
    this._collectEmitter = this.add.particles(0, 0, 'heart-collect', {
      speed: { min: 40, max: 90 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 350,
      quantity: 5,
      emitting: false,
    }).setDepth(8);

    this._buildButterflies(level);
    this._buildGoombas(level);
    this._buildStarHearts(level);
    this._buildGoalPortal(level);
    this._buildBouncePads(level);
    this._buildWindmills(level);
    this._buildLadders(level);
    this._buildHUD(level);
    this._setupControls();
    this._setupMobileControls();

    // Camera can scroll the full map plus a generous sky margin above y=0.
    const SKY_MARGIN = GAME_HEIGHT * 6;
    this.cameras.main.setBounds(0, -SKY_MARGIN, mapW, mapH + SKY_MARGIN);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  _buildBackground(level) {
    const bgKey = level.background;
    const mapW  = level.mapWidth  || GAME_WIDTH;
    const mapH  = level.mapHeight || GAME_HEIGHT;

    const groundRowY  = mapH - GAME_HEIGHT;

    // ── Image-based biomes (forest, mountains, …) ───────────────────────────────
    // Any biome whose `${biome}-repeated` texture was loaded gets this path.
    const biomeKey = bgKey.replace('bg-', '');
    const repKey   = `${biomeKey}-repeated`;
    const skyKey2  = `${biomeKey}-skybox`;
    if (this.textures.exists(repKey) && this.textures.exists(skyKey2)) {
      const repSrc = this.textures.get(repKey).getSourceImage();
      const skySrc = this.textures.get(skyKey2).getSourceImage();

      // Scale each image to GAME_HEIGHT preserving aspect ratio, then tile by the
      // scaled width — no vertical squish, full image always visible in one screen.
      const repDisplayW = Math.ceil(repSrc.width  * (GAME_HEIGHT / repSrc.height));
      const skyDisplayW = Math.ceil(skySrc.width  * (GAME_HEIGHT / skySrc.height));

      const SKY_MARGIN = GAME_HEIGHT * 6;
      for (let bx = 0; bx < mapW; bx += skyDisplayW) {
        for (let by = -SKY_MARGIN; by < groundRowY; by += GAME_HEIGHT) {
          this.add.image(bx, by, skyKey2).setOrigin(0, 0).setDisplaySize(skyDisplayW, GAME_HEIGHT);
        }
      }
      // Ground row — aspect-ratio scaled, full image visible from spawn
      for (let bx = 0; bx < mapW; bx += repDisplayW) {
        this.add.image(bx, groundRowY, repKey).setOrigin(0, 0).setDisplaySize(repDisplayW, GAME_HEIGHT);
      }
      // Sun — procedural, top-right, once per level
      const sun = this.add.graphics().setDepth(0);
      sun.fillStyle(0xffe066, 1);
      sun.fillCircle(0, 0, 38);
      sun.fillStyle(0xfff4a0, 0.5);
      sun.fillCircle(0, 0, 28);
      sun.x = mapW - 100;
      sun.y = 80;
    } else {

    const skyKey      = bgKey.replace('bg-', 'sky-');
    const bgGroundKey = bgKey.replace('bg-', 'bg-ground-');

    // Skybox first (lowest in display list) — fills everything above the ground row.
    for (let bx = 0; bx < mapW; bx += GAME_WIDTH) {
      for (let by = 0; by < groundRowY; by += GAME_HEIGHT) {
        this.add.image(bx + GAME_WIDTH / 2, by + GAME_HEIGHT / 2, skyKey);
      }
    }

    // Ground row on top: biome bg (with sun/moon) once at the left (spawn side),
    // then bg-ground-* tiles — same scenery, no duplicate sun/moon.
    // Rendered after sky so it always covers the overlap zone at low levels.
    this.add.image(GAME_WIDTH / 2, groundRowY + GAME_HEIGHT / 2, bgKey);
    for (let bx = GAME_WIDTH; bx < mapW; bx += GAME_WIDTH) {
      this.add.image(bx + GAME_WIDTH / 2, groundRowY + GAME_HEIGHT / 2, bgGroundKey);
    }

    } // end biome branch

    const levelNum = level.id;
    const tilesX   = Math.ceil(mapW / GAME_WIDTH);

    // ── Seeded RNGs — independent per layer so positions don't interfere ────────
    let s1 = levelNum * 31 + 7;
    const srnd1 = (min, max) => {
      s1 = (s1 * 1664525 + 1013904223) & 0xffffffff;
      return min + (Math.abs(s1) % (max - min + 1));
    };

    let s2 = levelNum * 53 + 13;
    const srnd2 = (min, max) => {
      s2 = (s2 * 1664525 + 1013904223) & 0xffffffff;
      return min + (Math.abs(s2) % (max - min + 1));
    };

    // ── Layer 1: far soft ovals (scrollFactor 0.15) ──────────────────────────────
    const g1 = this.add.graphics().setDepth(0).setScrollFactor(0.15);
    g1.fillStyle(0xffffff, 0.06);
    for (let tx = 0; tx < tilesX; tx++) {
      for (let i = 0; i < 10; i++) {
        const ox = tx * GAME_WIDTH + srnd1(0, GAME_WIDTH);
        const oy = srnd1(30, mapH - 60);
        const ow = srnd1(18, 40);
        const oh = srnd1(10, 22);
        g1.fillEllipse(ox, oy, ow, oh);
      }
    }

    // ── Layer 2: near diamonds (scrollFactor 0.45) ───────────────────────────────
    const g2 = this.add.graphics().setDepth(0).setScrollFactor(0.45);
    g2.fillStyle(0xffffff, 0.09);
    for (let tx = 0; tx < tilesX; tx++) {
      for (let i = 0; i < 5; i++) {
        const dx = tx * GAME_WIDTH + srnd2(0, GAME_WIDTH);
        const dy = srnd2(20, mapH - 40);
        const r = 5;
        g2.fillTriangle(dx, dy - r,  dx + r, dy,  dx, dy + r);
        g2.fillTriangle(dx, dy - r,  dx - r, dy,  dx, dy + r);
      }
    }

    // Lava strip at the bottom of the full map.
  }

  _buildDecorButterflies(level) {
    const mapW   = level.mapWidth  || GAME_WIDTH;
    const mapH   = level.mapHeight || GAME_HEIGHT;
    const tilesX = Math.ceil(mapW / GAME_WIDTH);
    const tilesY = Math.ceil(mapH / GAME_HEIGHT);
    const count  = tilesX * tilesY * 3;

    // Seeded RNG — independent seed so it doesn't interfere with parallax RNGs
    let s = level.id * 97 + 41;
    const rng = (min, max) => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return min + (Math.abs(s) % (max - min + 1));
    };

    const biomeKey = (level.background || '').replace('bg-', '');

    if (biomeKey === 'arctic')   { this._buildDecorSnow(count, mapW, mapH, rng);   return; }
    if (biomeKey === 'cyberpunk'){ this._buildDecorDrones(count, mapW, mapH, rng); return; }
    if (biomeKey === 'undersea') { this._buildDecorFish(count, mapW, mapH, rng);   return; }
    if (biomeKey === 'volcano')  { this._buildDecorEmbers(count, mapW, mapH, rng); return; }

    // ── Default: butterflies + bees ─────────────────────────────────────────
    const TINTS = [
      0xff6b9d, 0xff9f43, 0xffd32a, 0x54e346, 0x48dbfb,
      0xff6b6b, 0xffeaa7, 0x55efc4, 0xfd79a8, 0xfdcb6e,
    ];
    const BF_SCALE  = 0.55;
    const BEE_SCALE = 0.7;

    for (let i = 0; i < count; i++) {
      const x     = rng(40, mapW - 40);
      const y     = rng(40, mapH - 100);
      const isBee = (i % 3 === 0);

      if (isBee) {
        const bee = this.add.image(x, y, 'bee')
          .setDepth(0).setAlpha(0.6).setScale(BEE_SCALE).setFlipX(rng(0, 1) === 1);
        const driftX = rng(55, 110) * (rng(0, 1) ? 1 : -1);
        const driftY = rng(30,  70) * (rng(0, 1) ? 1 : -1);
        const dur    = 700 + rng(0, 700);
        this.tweens.add({ targets: bee, x: x + driftX, y: y + driftY, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rng(0, dur) });
        this.tweens.add({ targets: bee, scaleY: BEE_SCALE * 0.3, duration: 55 + rng(0, 30), yoyo: true, repeat: -1, ease: 'Linear' });
      } else {
        const tint = TINTS[rng(0, TINTS.length - 1)];
        const bf   = this.add.image(x, y, 'butterfly')
          .setDepth(0).setAlpha(0.55).setScale(BF_SCALE).setTint(tint).setFlipX(rng(0, 1) === 1);
        const driftX = rng(18, 50) * (rng(0, 1) ? 1 : -1);
        const driftY = rng(8,  25) * (rng(0, 1) ? 1 : -1);
        const dur    = 2200 + rng(0, 2800);
        this.tweens.add({ targets: bf, x: x + driftX, y: y + driftY, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rng(0, dur) });
        this.tweens.add({ targets: bf, scaleY: BF_SCALE * 0.4, duration: 120 + rng(0, 80), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rng(0, 150) });
      }
    }
  }

  // ── Arctic: falling snowflakes ─────────────────────────────────────────────
  _buildDecorSnow(count, mapW, mapH, rng) {
    for (let i = 0; i < count; i++) {
      const x     = rng(0, mapW);
      const y     = rng(0, mapH - 80);
      const r     = 1 + rng(0, 2);          // radius 1–3 px
      const alpha = 0.3 + rng(0, 5) * 0.1; // 0.3–0.8

      const flake = this.add.circle(x, y, r, 0xffffff).setAlpha(alpha).setDepth(1);

      const fallDist = 70 + rng(0, 80);
      const driftX   = rng(0, 20) * (rng(0, 1) ? 1 : -1);
      const dur      = 2000 + rng(0, 2500);

      // repeat:-1 yoyo:false — falls then snaps back to start, staggered delays hide the snap
      this.tweens.add({
        targets: flake, y: y + fallDist, x: x + driftX,
        duration: dur, repeat: -1, yoyo: false,
        ease: 'Linear', delay: rng(0, dur),
      });
    }
  }

  // ── Cyberpunk: glowing neon drones ────────────────────────────────────────
  _buildDecorDrones(count, mapW, mapH, rng) {
    const NEONS = [0x00ffff, 0xff00ff, 0x00ff88, 0xff4400, 0xaaff00, 0x4488ff];

    for (let i = 0; i < count; i++) {
      const x     = rng(40, mapW - 40);
      const y     = rng(40, mapH - 100);
      const color = NEONS[rng(0, NEONS.length - 1)];

      // Cross-shaped body + bright center dot
      const g = this.add.graphics().setDepth(1).setAlpha(0.75);
      g.fillStyle(color, 1);
      g.fillRect(-7, -2, 14, 4);  // horizontal bar
      g.fillRect(-2, -7, 4, 14);  // vertical bar
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, 0, 2);      // center light
      g.x = x; g.y = y;

      const driftX = rng(30, 80) * (rng(0, 1) ? 1 : -1);
      const driftY = rng(15, 40) * (rng(0, 1) ? 1 : -1);
      const dur    = 600 + rng(0, 800);

      this.tweens.add({ targets: g, x: x + driftX, y: y + driftY, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rng(0, dur) });
      // Rapid signal blink
      this.tweens.add({ targets: g, alpha: 0.15, duration: 150 + rng(0, 250), yoyo: true, repeat: -1, delay: rng(0, 600) });
    }
  }

  // ── Undersea: fish swimming horizontally ──────────────────────────────────
  _buildDecorFish(count, mapW, mapH, rng) {
    const FISH_COLORS = [0xff6b00, 0xff9f43, 0xffd32a, 0xff4757, 0x2ed573, 0x1e90ff, 0xff6b81, 0xeccc68];

    for (let i = 0; i < count; i++) {
      const x     = rng(40, mapW - 40);
      const y     = rng(40, mapH - 80);
      const color = FISH_COLORS[rng(0, FISH_COLORS.length - 1)];
      const facingRight = rng(0, 1) === 1;

      // Fish shape: ellipse body facing right + left-side tail + eye
      const g = this.add.graphics().setDepth(1).setAlpha(0.7);
      g.fillStyle(color, 1);
      g.fillEllipse(2, 0, 14, 8);             // body
      g.fillTriangle(-5, 0, -10, -5, -10, 5); // tail
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(6, -1, 1.5);               // eye
      g.x = x; g.y = y;
      g.setScale(facingRight ? 1 : -1, 1);

      const swimRange = (150 + rng(0, 200)) * (facingRight ? 1 : -1);
      const dur       = 3000 + rng(0, 3000);

      this.tweens.add({
        targets: g, x: x + swimRange,
        duration: dur, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: rng(0, dur),
        onYoyo:   () => g.setScale(facingRight ? -1 :  1, 1),
        onRepeat: () => g.setScale(facingRight ?  1 : -1, 1),
      });
      // Gentle vertical bob
      const bobY = rng(5, 15) * (rng(0, 1) ? 1 : -1);
      this.tweens.add({ targets: g, y: y + bobY, duration: 1200 + rng(0, 1000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rng(0, 800) });
    }
  }

  // ── Volcano: rising embers ─────────────────────────────────────────────────
  _buildDecorEmbers(count, mapW, mapH, rng) {
    const EMBER_COLORS = [0xff4400, 0xff8800, 0xffcc00, 0xff2200, 0xff6600];

    for (let i = 0; i < count; i++) {
      const x     = rng(0, mapW);
      const y     = rng(80, mapH);
      const r     = 1 + rng(0, 2);
      const color = EMBER_COLORS[rng(0, EMBER_COLORS.length - 1)];
      const alpha = 0.5 + rng(0, 4) * 0.1; // 0.5–0.9

      const ember = this.add.circle(x, y, r, color).setAlpha(alpha).setDepth(1);

      const riseDist = 80 + rng(0, 120);
      const driftX   = rng(0, 30) * (rng(0, 1) ? 1 : -1);
      const dur      = 1500 + rng(0, 2000);

      // Rises and fades out, then snaps back to origin — staggered delays give continuous flow
      this.tweens.add({
        targets: ember, y: y - riseDist, x: x + driftX, alpha: 0,
        duration: dur, repeat: -1, yoyo: false,
        ease: 'Sine.easeOut', delay: rng(0, dur),
      });
    }
  }

  _buildPlatforms(level) {
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group();

    level.platforms.forEach(p => {
      if (p.phantom) return; // BFS-only phantom — never render

      if (p.moving) {
        const tilesNeeded = Math.ceil(p.w / 32);
        for (let i = 0; i < tilesNeeded; i++) {
          const tile = this.movingPlatforms.create(
            p.x + i * 32 + 16,
            p.y + (p.h || 15) / 2,
            'platform-moving'
          );
          tile.setDisplaySize(32, p.h || 15);
          tile.body.allowGravity = false;
          tile.body.immovable = true;
          tile.body.setSize(32, p.h || 15);
          tile.startX   = p.x + i * 32 + 16;
          tile.moveRange = p.moveRange || 80;
          tile.moveSpeed = p.moveSpeed || 60;
          tile.moveDir   = 1;
        }
      } else {
        const tileKey     = p.blinking ? 'platform-blink' : p.conveyor ? 'platform-conveyor' : 'platform';
        const tilesNeeded = Math.ceil(p.w / 32);
        const blinkTiles  = [];
        for (let i = 0; i < tilesNeeded; i++) {
          const tile = this.platforms.create(p.x + i * 32 + 16, p.y + p.h / 2, tileKey);
          tile.setDisplaySize(32, p.h);
          tile.refreshBody();
          if (p.blinking) {
            blinkTiles.push(tile);
          }
          if (p.conveyor) {
            tile.conveyorDir = p.conveyor;
          }
        }

        if (p.blinking && blinkTiles.length > 0) {
          const cycleOn  = 1500;
          const cycleOff = 1000;
          const phase    = Phaser.Math.Between(0, 2500);

          this.time.delayedCall(phase, () => {
            const blink = () => {
              this.tweens.add({
                targets: blinkTiles,
                alpha: 0.3,
                duration: 75,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                  blinkTiles.forEach(t => { t.setAlpha(0); t.body.enable = false; });
                  this.time.delayedCall(cycleOff, () => {
                    blinkTiles.forEach(t => { t.setAlpha(1); t.body.enable = true; });
                    this.time.delayedCall(cycleOn - 300, blink);
                  });
                },
              });
            };
            this.time.delayedCall(cycleOn - 300, blink);
          });
        }

        if (p.conveyor) {
          const arrowChar = p.conveyor === 'right' ? '→' : '←';
          const arrowX    = Math.floor(p.x + p.w / 2);
          const arrowY    = p.y - 2;
          this.add.text(arrowX, arrowY, arrowChar, {
            fontSize: '11px', color: '#ffffff',
          }).setOrigin(0.5, 1).setDepth(2);
        }
      }
    });
  }

  _buildPlayer(level) {
    const spawnX = (level.platforms[0]?.x || 0) + 40;
    const spawnY = (level.platforms[0]?.y || GAME_HEIGHT - 60) - 40;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(PHYSICS.playerSpeed, 600);
    this.spawnX = spawnX;
    this.spawnY = spawnY;

    // One-way platforms: only collide when player is falling down (or standing),
    // so the player can jump up through a platform from below.
    const oneWay = (player, _tile) => player.body.velocity.y >= 0;
    this.physics.add.collider(this.player, this.platforms,       null, oneWay, this);
    this.physics.add.collider(this.player, this.movingPlatforms, null, oneWay, this);

    this.isInvincible  = false;
    this._clambering   = false;
    this._coyoteFrames = 0;
    this._isDead       = false;
  }

  _buildHearts(level) {
    this.heartGroup = this.physics.add.staticGroup();
    (level.hearts || []).forEach(h => {
      const heart = this.heartGroup.create(h.x, h.y, 'heart-collect');
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
      if (this._isDead) return;
      // Cache position BEFORE destroy() — reading x/y after destroy() returns undefined
      const { x, y } = heart;
      heart.destroy();
      this._collectEmitter.emitParticleAt(x, y, 5);
      this.heartsCollected++;
      this.heartsText.setText(`💕 ${this.heartsCollected} / ${(level.hearts || []).length}`);
      const newTotal = parseInt(localStorage.getItem(`${STORAGE_PREFIX}_total_hearts`) || '0') + 1;
      localStorage.setItem(`${STORAGE_PREFIX}_total_hearts`, String(newTotal));
      this.allTimeText.setText(`✨ ${newTotal} total`);
      this._sfx('collect', { volume: 0.6 });
    });
  }

  _buildButterflies(level) {
    this.butterflies = this.physics.add.group();

    (level.butterflies || []).forEach(b => {
      const bf = this.butterflies.create(b.x, b.y, 'butterfly');
      const speed = b.speed || 80;
      bf.setVelocityX(speed);
      bf.patrolSpeed = speed;
      bf.patrolStartX = b.x - b.range;
      bf.patrolEndX = b.x + b.range;
      bf.body.allowGravity = false;
      bf.body.immovable = true;
    });

    this.physics.add.overlap(this.player, this.butterflies, () => {
      this._loseLife();
    });
  }

  _buildGoombas(level) {
    this.goombas = this.physics.add.group();

    (level.goombas || []).forEach(g => {
      const goomba = this.goombas.create(g.x, g.y, 'goomba');
      const speed = g.speed || 60;
      goomba.setVelocityX(speed);
      goomba.patrolSpeed  = speed;
      goomba.patrolStartX = g.x - g.range;
      goomba.patrolEndX   = g.x + g.range;
      goomba.body.allowGravity = false;
      goomba.body.immovable    = true;
    });

    this.physics.add.overlap(this.player, this.goombas, (player, goomba) => {
      // Stomp works even while invincible — fall on them, kill them, get the bounce
      if (player.body.velocity.y > 50 && player.y < goomba.y) {
        goomba.destroy();
        this.player.setVelocityY(PHYSICS.jumpVelocity * 1.3);
        this._sfx('collect', { volume: 0.5 });
      } else if (!this.isInvincible) {
        this._loseLife();
      }
    });
  }

  _buildGoalPortal(level) {
    const goal = this.physics.add.staticImage(level.goal.x, level.goal.y, 'heart-goal');
    goal.body.setSize(40, 40);

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

      // Cinematic white flash
      const flash = this.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff
      ).setScrollFactor(0).setDepth(60).setAlpha(0);
      this.tweens.add({
        targets: flash,
        alpha: 0.28,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });

      this._sfx('levelComplete', { volume: 0.7 });

      this.player.setVelocity(0, 0);
      this.player.body.enable = false;

      this.time.delayedCall(800, () => {
        // Persist high score — highest level whose goal the player has reached.
        const prev = parseInt(localStorage.getItem(`${STORAGE_PREFIX}_highscore`) || '0');
        if (this.levelNum > prev) localStorage.setItem(`${STORAGE_PREFIX}_highscore`, String(this.levelNum));

        this.scene.start('LoveNoteScene', { levelNum: this.levelNum });
      });
    });

    this._levelComplete = false;
  }

  _buildBouncePads(level) {
    this.bouncePadGroup = this.physics.add.staticGroup();
    (level.bouncePads || []).forEach(bp => {
      const pad = this.bouncePadGroup.create(bp.x, bp.y, null);
      pad.setDisplaySize(28, 10);
      pad.refreshBody();
      this.add.rectangle(bp.x, bp.y, 28, 10, 0x84cc16).setDepth(2);
    });

    this.physics.add.overlap(this.player, this.bouncePadGroup, () => {
      if (this._isDead) return;
      if (this.player.body.velocity.y >= 0) {
        this.player.setVelocityY(PHYSICS.jumpVelocity * 2.2);
        this._sfx('jump', { volume: 0.9 });
      }
    });
  }

  _buildWindmills(level) {
    this._windmillArms = [];

    (level.windmills || []).forEach(wm => {
      // Hub
      this.add.circle(wm.x, wm.y, 8, 0x6b7280).setDepth(2);

      // 2 visual arms (at 0 and PI) that rotate through all positions at runtime.
      // The generator inserts 4 BFS phantom platforms (at 0, PI/2, PI, 3*PI/2) for
      // validation coverage — these are static snapshots only, not extra visual arms.
      const armW = 36, armH = 8;
      [0, Math.PI].forEach(startAngle => {
        const visual = this.add.rectangle(
          wm.x + Math.cos(startAngle) * wm.radius,
          wm.y + Math.sin(startAngle) * wm.radius,
          armW, armH, 0x94a3b8
        ).setDepth(2);

        this._windmillArms.push({
          visual,
          cx: wm.x, cy: wm.y,
          radius: wm.radius,
          angle: startAngle,
          speed: wm.speed,
          w: armW, h: armH,
        });
      });
    });
  }

  _buildLadders(level) {
    this._ladderZones = []; // simple AABB list for per-frame overlap check

    (level.ladders || []).forEach(lad => {
      const { x, topY, bottomY } = lad;
      const h = bottomY - topY;

      // Visual: two vertical rails + horizontal rungs every 14 px
      const g = this.add.graphics().setDepth(2);
      g.fillStyle(0x92400e);               // brown rails
      g.fillRect(x - 6, topY, 3, h);
      g.fillRect(x + 3, topY, 3, h);
      g.fillStyle(0xb45309);               // lighter rungs
      for (let ry = topY + 10; ry < bottomY; ry += 14) {
        g.fillRect(x - 6, ry, 12, 2);
      }

      // Store AABB for manual overlap check in update()
      this._ladderZones.push({ x, topY, bottomY, halfW: 12 });
    });
  }

  _buildHUD(level) {
    this.add.rectangle(GAME_WIDTH / 2, 18, GAME_WIDTH, 36, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(9);

    this.livesText = this.add.text(12, 18, `💗 x ${this.lives}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(10).setScrollFactor(0);

    const allTimeTotal = parseInt(localStorage.getItem(`${STORAGE_PREFIX}_total_hearts`) || '0');
    this.allTimeText = this.add.text(120, 18, `✨ ${allTimeTotal} total`, {
      fontSize: '13px', color: '#fda4af',
    }).setOrigin(0, 0.5).setDepth(10).setScrollFactor(0);

    this.levelText = this.add.text(GAME_WIDTH / 2, 18, `Level ${level.id}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(10).setScrollFactor(0);

    this.heartsText = this.add.text(GAME_WIDTH - 44, 18, `💕 0 / ${level.hearts?.length || 0}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(10).setScrollFactor(0);

    // Hamburger — opens pause menu
    this.add.text(GAME_WIDTH - 12, 18, '☰', {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(10).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openPause());
  }

  _openPause() {
    this.scene.launch('PauseScene', { levelNum: this.levelNum });
    this.scene.pause();
  }

  _sfx(key, config = {}) {
    if (this._sfxOn) {
      try { this.sound.play(key, config); } catch (_) {}
    }
  }

  _setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
    this._jumpBuffer   = 0;
    this._coyoteFrames = 0;
  }

  _setupMobileControls() {
    this._touchLeft = false;
    this._touchRight = false;
    this._touchJump = false;
    this._touchClimbUp = false;
    this._touchClimbDown = false;
    this._leftPointerId = null;
    this._rightPointerId = null;
    this._jumpPointerId = null;
    this._climbUpPointerId = null;
    this._climbDownPointerId = null;

    // Enable enough pointer slots for simultaneous move + jump touches
    this.input.addPointer(2);

    // Button hit zones in screen space (scrollFactor 0), vertically centred
    const BTN_W = 110, BTN_H = 110;
    const BTN_Y  = GAME_HEIGHT / 2; // vertically centred for thumb comfort
    const leftZone  = { x: 0,                  y: BTN_Y - BTN_H / 2, w: BTN_W, h: BTN_H };
    const rightZone = { x: GAME_WIDTH - BTN_W, y: BTN_Y - BTN_H / 2, w: BTN_W, h: BTN_H };

    // Climb buttons: centred on screen, stacked vertically
    const CX = GAME_WIDTH / 2;
    const CLIMB_W = 100, CLIMB_H = 80;
    const climbUpZone   = { x: CX - CLIMB_W / 2, y: BTN_Y - CLIMB_H - 8, w: CLIMB_W, h: CLIMB_H };
    const climbDownZone = { x: CX - CLIMB_W / 2, y: BTN_Y + 8,            w: CLIMB_W, h: CLIMB_H };

    const inZone = (ptr, z) => ptr.x >= z.x && ptr.x <= z.x + z.w && ptr.y >= z.y && ptr.y <= z.y + z.h;

    this.input.on('pointerdown', (ptr) => {
      if (ptr.y <= 36) return; // HUD guard
      if (this._onLadder && inZone(ptr, climbUpZone))        { this._touchClimbUp   = true; this._climbUpPointerId   = ptr.id; }
      else if (this._onLadder && inZone(ptr, climbDownZone)) { this._touchClimbDown  = true; this._climbDownPointerId = ptr.id; }
      else if (inZone(ptr, leftZone))                        { this._touchLeft  = true; this._leftPointerId  = ptr.id; }
      else if (inZone(ptr, rightZone))                       { this._touchRight = true; this._rightPointerId = ptr.id; }
      else                                                   { this._touchJump  = true; this._jumpPointerId  = ptr.id; }
    });

    this.input.on('pointerup', (ptr) => {
      if (ptr.id === this._leftPointerId)      { this._touchLeft      = false; this._leftPointerId      = null; }
      if (ptr.id === this._rightPointerId)     { this._touchRight     = false; this._rightPointerId     = null; }
      if (ptr.id === this._jumpPointerId)      { this._touchJump      = false; this._jumpPointerId      = null; }
      if (ptr.id === this._climbUpPointerId)   { this._touchClimbUp   = false; this._climbUpPointerId   = null; }
      if (ptr.id === this._climbDownPointerId) { this._touchClimbDown = false; this._climbDownPointerId = null; }
    });

    const isMobile = this.sys.game.device.input.touch;
    if (isMobile) {
      const lx = BTN_W / 2, rx = GAME_WIDTH - BTN_W / 2;
      this.add.rectangle(lx, BTN_Y, BTN_W, BTN_H, 0xffffff, 0.2).setDepth(20).setScrollFactor(0);
      this.add.text(lx, BTN_Y, '←', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
      this.add.rectangle(rx, BTN_Y, BTN_W, BTN_H, 0xffffff, 0.2).setDepth(20).setScrollFactor(0);
      this.add.text(rx, BTN_Y, '→', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0);

      // Climb buttons — hidden until player is on a ladder
      const cuY = BTN_Y - CLIMB_H / 2 - 8;
      const cdY = BTN_Y + CLIMB_H / 2 + 8;
      this._climbUpBg   = this.add.rectangle(CX, cuY, CLIMB_W, CLIMB_H, 0xffffff, 0.2).setDepth(20).setScrollFactor(0).setVisible(false);
      this._climbUpTxt  = this.add.text(CX, cuY, '▲', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0).setVisible(false);
      this._climbDnBg   = this.add.rectangle(CX, cdY, CLIMB_W, CLIMB_H, 0xffffff, 0.2).setDepth(20).setScrollFactor(0).setVisible(false);
      this._climbDnTxt  = this.add.text(CX, cdY, '▼', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0).setVisible(false);
    }
  }

  _setClimbButtonsVisible(visible) {
    this._climbUpBg?.setVisible(visible);
    this._climbUpTxt?.setVisible(visible);
    this._climbDnBg?.setVisible(visible);
    this._climbDnTxt?.setVisible(visible);
  }

  update(time, delta) {
    if (this._clambering || this._isDead) return;

    const onGround = this.player.body.touching.down || this.player.body.blocked.down;

    // Treat windmill arm as ground for movement + jump purposes.
    // _onWindmillArm is written at the END of the previous frame's windmill loop,
    // so it's already available here at the top of this frame.
    const onSurface = onGround || this._onWindmillArm;

    // Landing squish — fires once on the frame the player touches down.
    // Guard isInvincible: the invincibility pulse tween already owns scaleX/scaleY.
    if (onSurface && !this._wasOnGround && !this._clambering && !this.isInvincible) {
      this.tweens.add({
        targets: this.player,
        scaleY: 0.82,
        scaleX: 1.12,
        duration: 60,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    }
    this._wasOnGround = onSurface;

    const goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown  || this._touchLeft;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || this._touchRight;
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.space)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || this._touchJump;

    // --- Ladder detection: AABB check against each ladder zone ---
    let activeLadder = null;
    const pb = this.player.body;
    const pressingDown = this.cursors.down.isDown;
    for (const lz of (this._ladderZones || [])) {
      const xOverlap = pb.right > lz.x - lz.halfW && pb.left < lz.x + lz.halfW;
      // Standard: player body overlaps ladder zone
      if (xOverlap && pb.bottom > lz.topY && pb.top < lz.bottomY) {
        activeLadder = lz;
        break;
      }
      // Climb down: player standing just above the ladder top while pressing down
      if (xOverlap && pressingDown && pb.bottom >= lz.topY - 4 && pb.bottom <= lz.topY + 20) {
        activeLadder = lz;
        break;
      }
    }

    if (activeLadder && !goLeft && !goRight && !jumpJustPressed) {
      // Ladder mode: gravity off, snap X, climb with up/down keys
      this.player.body.allowGravity = false;
      this.player.setVelocityX(0);
      this.player.x = activeLadder.x; // stay centred on ladder
      const climbUp   = this.cursors.up.isDown   || this.wasd.up.isDown   || this._touchClimbUp;
      const climbDown = this.cursors.down.isDown                           || this._touchClimbDown;
      if (climbUp)        this.player.setVelocityY(-95);
      else if (climbDown) this.player.setVelocityY(95);
      else                this.player.setVelocityY(0);
      if (!this._onLadder) { this._onLadder = true; this._setClimbButtonsVisible(true); }
      // Skip normal movement + jump this frame
    } else {
      // Not on ladder (or player pressed left/right/jump to dismount)
      if (this._onLadder) { this._onLadder = false; this._setClimbButtonsVisible(false); }
      this.player.body.allowGravity = true;

      // --- Coyote time: allow jump for 6 frames after walking off a ledge ---
      if (onGround) {
        this._coyoteFrames = 6;
      } else if (this._coyoteFrames > 0) {
        this._coyoteFrames--;
      }

      // --- Moving platform carry + conveyor belt detection ---
    let platformCarryVx = 0;
    if (onGround) {
      for (const tile of this.movingPlatforms.getChildren()) {
        const underfoot = this.player.body.bottom >= tile.body.top - 4
                       && this.player.body.bottom <= tile.body.top + 6
                       && this.player.body.right   > tile.body.left
                       && this.player.body.left    < tile.body.right;
        if (underfoot) { platformCarryVx = tile.body.velocity.x; break; }
      }

      for (const tile of this.platforms.getChildren()) {
        if (!tile.conveyorDir) continue;
        const underfoot = this.player.body.bottom >= tile.body.top - 4
                       && this.player.body.bottom <= tile.body.top + 6
                       && this.player.body.right   > tile.body.left
                       && this.player.body.left    < tile.body.right;
        if (underfoot) {
          platformCarryVx += tile.conveyorDir === 'right' ? this._conveyorForce : -this._conveyorForce;
          break;
        }
      }
    }

    // --- Movement: snap to zero on surface with no input (kills platform-bump drift) ---
    if (!goLeft && !goRight && onSurface) {
      this.player.setVelocityX(platformCarryVx); // stand still, or ride the platform
    } else {
      const inputVx   = goLeft ? -PHYSICS.playerSpeed : (goRight ? PHYSICS.playerSpeed : 0);
      const targetVx  = inputVx + platformCarryVx;
      const lerpFactor = onSurface ? 0.35 : 0.12;
      const newVx      = Phaser.Math.Linear(this.player.body.velocity.x, targetVx, lerpFactor);
      this.player.setVelocityX(Math.abs(newVx) < 1 ? 0 : newVx);
    }

    if (goLeft)  this.player.setFlipX(true);
    if (goRight) this.player.setFlipX(false);

    // --- Jump: tiny 3-frame buffer (prevents missed inputs, not long queuing) ---
    if (jumpJustPressed) this._jumpBuffer = 3;
    if (this._jumpBuffer > 0) this._jumpBuffer--;
    if (this._jumpBuffer > 0 && (onGround || this._coyoteFrames > 0 || this._onWindmillArm)) {
      this.player.setVelocityY(PHYSICS.jumpVelocity);
      this._jumpBuffer   = 0;
      this._coyoteFrames = 0;
      this._sfx('jump', { volume: 0.5 });
    }

    } // end ladder else block

    // Deplete invincibility bar every frame
    if (this._invincBarFill && this._invincEndTimer) {
      this._invincBarFill.scaleX = Math.max(0, 1 - this._invincEndTimer.getProgress());
    }

    this._checkClamber(onGround, goLeft, goRight);

    // Butterfly patrol
    this.butterflies?.getChildren().forEach(bf => {
      if (bf.x >= bf.patrolEndX) {
        bf.setVelocityX(-bf.patrolSpeed);
        bf.setFlipX(true);
      } else if (bf.x <= bf.patrolStartX) {
        bf.setVelocityX(bf.patrolSpeed);
        bf.setFlipX(false);
      }
    });

    // Moving platform patrol
    this.movingPlatforms?.getChildren().forEach(tile => {
      if (tile.x >= tile.startX + tile.moveRange) tile.moveDir = -1;
      if (tile.x <= tile.startX - tile.moveRange) tile.moveDir =  1;
      tile.body.setVelocityX(tile.moveDir * tile.moveSpeed);
    });

    // Windmill: advance arm angles, reposition visuals, carry player
    this._onWindmillArm = false; // reset each frame; set true below if player is on any arm
    for (const arm of (this._windmillArms || [])) {
      arm.angle += arm.speed * (delta / 1000); // clockwise, delta is ms

      const ax = arm.cx + Math.cos(arm.angle) * arm.radius;
      const ay = arm.cy + Math.sin(arm.angle) * arm.radius;
      arm.visual.setPosition(ax, ay);

      const armTop   = ay - arm.h / 2;
      const armLeft  = ax - arm.w / 2;
      const armRight = ax + arm.w / 2;
      const onArm    = !this._isDead
                    && this.player.body.bottom >= armTop - 4
                    && this.player.body.bottom <= armTop + 8
                    && this.player.body.right   > armLeft
                    && this.player.body.left    < armRight
                    && this.player.body.velocity.y >= -50;

      if (onArm) {
        this._onWindmillArm = true; // read at top of NEXT frame for jump/movement

        const tvx = -Math.sin(arm.angle) * arm.radius * arm.speed;
        const tvy =  Math.cos(arm.angle) * arm.radius * arm.speed;

        // Initialise seat offset when first landing on this arm
        if (this._ridingArm !== arm) {
          this._ridingArm   = arm;
          this._seatOffsetX = this.player.x - ax;
        }

        // Advance seat with player input so they can slide along the arm
        const inputVx = goLeft ? -PHYSICS.playerSpeed : goRight ? PHYSICS.playerSpeed : 0;
        this._seatOffsetX += inputVx * (delta / 1000);

        // Snap player BOTH axes directly to their seat on the arm.
        // This tracks the full circular path without relying on velocity integration.
        // body.reset zeros velocity then we restore it — physics and snap stay consistent.
        this.player.x = ax + this._seatOffsetX;
        this.player.y = armTop - this.player.displayHeight / 2;
        this.player.body.reset(this.player.x, this.player.y);

        // Velocity = tangential + input so the player launches with arm momentum when leaving
        this.player.setVelocityX(tvx + inputVx);
        this.player.setVelocityY(Math.min(0, tvy));
      }
    }

    // Clear seat when not riding any arm
    if (!this._onWindmillArm) this._ridingArm = null;

    // Goomba patrol
    this.goombas?.getChildren().forEach(g => {
      if (g.x >= g.patrolEndX) {
        g.setVelocityX(-g.patrolSpeed);
        g.setFlipX(true);
      } else if (g.x <= g.patrolStartX) {
        g.setVelocityX(g.patrolSpeed);
        g.setFlipX(false);
      }
    });

    if (this.player.y > this.mapH) {
      this._restartLevel(); // fell off the bottom
    }
  }

  _buildStarHearts(level) {
    this.starGroup = this.physics.add.staticGroup();
    (level.starHearts || []).forEach(s => {
      const star = this.starGroup.create(s.x, s.y, 'heart-star');
      // Bob up and down
      this.tweens.add({
        targets: star, y: s.y - 8,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 400),
      });
      // Slow spin
      this.tweens.add({
        targets: star, angle: 12,
        duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });

    this.physics.add.overlap(this.player, this.starGroup, (player, star) => {
      if (this._isDead) return;
      star.destroy();
      this._activateInvincibility();
      this._sfx('collect', { volume: 0.9 });
    });
  }

  _activateInvincibility() {
    const DURATION = 9000;
    const BAR_W    = 130;
    const BAR_H    = 7;
    const BAR_CX   = GAME_WIDTH / 2;
    const BAR_Y    = 38;

    this.isInvincible = true;
    this.player.setTint(0xffd700);

    // Tear down any previous invincibility
    if (this._invincTween)    { this._invincTween.stop(); this._invincTween = null; }
    if (this._invincEndTimer)  this._invincEndTimer.remove();
    if (this._invincWarnTimer) this._invincWarnTimer.remove();
    if (this._invincBarBg)    { this._invincBarBg.destroy();   this._invincBarBg   = null; }
    if (this._invincBarFill)  { this._invincBarFill.destroy(); this._invincBarFill = null; }
    if (this._invincIcon)     { this._invincIcon.destroy();    this._invincIcon    = null; }

    // Golden pulse
    this._invincTween = this.tweens.add({
      targets: this.player,
      scaleX: 1.18, scaleY: 1.18,
      duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Progress bar: ⭐ [████████████]
    this._invincIcon    = this.add.text(BAR_CX - BAR_W / 2 - 14, BAR_Y, '⭐', { fontSize: '12px' })
                            .setOrigin(0.5).setDepth(10).setScrollFactor(0);
    this._invincBarBg   = this.add.rectangle(BAR_CX, BAR_Y, BAR_W, BAR_H, 0x222222, 0.8)
                            .setDepth(10).setScrollFactor(0);
    this._invincBarFill = this.add.rectangle(BAR_CX - BAR_W / 2, BAR_Y, BAR_W, BAR_H, 0xffd700)
                            .setOrigin(0, 0.5).setDepth(11).setScrollFactor(0);

    // Warning at 2 s left: pulse faster, bar turns orange
    this._invincWarnTimer = this.time.delayedCall(DURATION - 2000, () => {
      if (this._invincTween)   this._invincTween.timeScale = 4;
      if (this._invincBarFill) this._invincBarFill.setFillStyle(0xff6600);
    });

    // Expiry
    this._invincEndTimer = this.time.delayedCall(DURATION, () => {
      this.isInvincible = false;
      this.player.clearTint();
      this.player.setScale(1);
      if (this._invincTween)   { this._invincTween.stop(); this._invincTween = null; }
      if (this._invincBarBg)   { this._invincBarBg.destroy();   this._invincBarBg   = null; }
      if (this._invincBarFill) { this._invincBarFill.destroy(); this._invincBarFill = null; }
      if (this._invincIcon)    { this._invincIcon.destroy();    this._invincIcon    = null; }
    });
  }

  _checkClamber(onGround, goLeft, goRight) {
    if (onGround || this.isInvincible) return;

    const blockedRight = this.player.body.blocked.right;
    const blockedLeft  = this.player.body.blocked.left;

    let dir = null;
    if (blockedRight && goRight) dir = 'right';
    else if (blockedLeft && goLeft) dir = 'left';
    if (!dir) return;

    const playerTop   = this.player.body.top;
    const playerRight = this.player.body.right;
    const playerLeft  = this.player.body.left;

    const allTiles = [
      ...this.platforms.getChildren(),
      ...this.movingPlatforms.getChildren(),
    ];

    for (const tile of allTiles) {
      const tileTop  = tile.body.top;
      // Horizontal: player edge must be within ~14px of tile's near edge
      const nearRight = dir === 'right' && Math.abs(playerRight - tile.body.left)  < 14;
      const nearLeft  = dir === 'left'  && Math.abs(playerLeft  - tile.body.right) < 14;
      if (!nearRight && !nearLeft) continue;

      // Vertical: player top must be 0–28px BELOW the tile top (ledge-grab window)
      if (playerTop < tileTop || playerTop > tileTop + 28) continue;

      this._startClamber(tile, dir);
      return;
    }
  }

  _startClamber(tile, dir) {
    this._clambering = true;
    this.player.setVelocity(0, 0);
    this.player.body.enable = false;

    // Where to land: sitting on top of the tile, stepped forward a bit
    const targetY = tile.body.top - this.player.displayHeight / 2;
    const targetX = this.player.x + (dir === 'right' ? 22 : -22);

    // Phase 1 — pull up (squish = effort)
    this.tweens.add({
      targets: this.player,
      y: targetY,
      scaleX: 0.78,
      scaleY: 1.15,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Phase 2 — step onto the platform (pop back to normal scale)
        this.tweens.add({
          targets: this.player,
          x: targetX,
          scaleX: 1,
          scaleY: 1,
          duration: 130,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.player.body.reset(targetX, targetY);
            this.player.body.enable = true;
            this._clambering = false;
          },
        });
      },
    });
  }

  _loseLife() {
    if (this.isInvincible || this._isDead) return;
    this.lives--;
    this.livesText.setText(`💗 x ${this.lives}`);
    this.cameras.main.shake(180, 0.004);
    if (this.lives <= 0) {
      this._playDeathAnimation();
    } else {
      this._respawnPlayer();
    }
  }

  _playDeathAnimation() {
    this._isDead = true;
    this.player.body.enable = false;
    this.player.setVelocity(0, 0);
    this._sfx('death', { volume: 0.7 });

    // Spin and fall off the bottom of the screen
    this.tweens.add({
      targets: this.player,
      y: this.mapH + 80,
      angle: 720,       // two full rotations
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => this._restartLevel(),
    });
  }

  _respawnPlayer() {
    this.isInvincible = true;
    this.player.setPosition(this.spawnX, this.spawnY);
    this.player.setVelocity(0, 0);

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
      const overlay = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Try again! 💕', {
        fontSize: '36px', color: '#ffffff', backgroundColor: '#be185d', padding: { x: 20, y: 10 },
      }).setOrigin(0.5).setDepth(50).setScrollFactor(0);

      this.time.delayedCall(1200, () => {
        this.scene.start('GameScene', { levelNum: this.levelNum });
      });
    });
  }
}
