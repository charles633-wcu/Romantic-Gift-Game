import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from '../constants.js';
import { generateLevel } from '../config/levelGenerator.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.levelNum        = data.levelNum || 1;
    this.lives           = 3;
    this.heartsCollected = 0;
  }

  create() {
    const level = generateLevel(this.levelNum);
    const mapW  = level.mapWidth  || GAME_WIDTH;
    const mapH  = level.mapHeight || GAME_HEIGHT;
    this.mapH   = mapH;

    // Expand physics world and camera to match generated map dimensions.
    // Bottom is open (no collision) so the lava-fall death trigger works.
    this.physics.world.setBounds(0, 0, mapW, mapH + 100);
    this.physics.world.setBoundsCollision(true, true, true, false);

    this._buildBackground(level);
    this._buildPlatforms(level);
    this._buildPlayer(level);
    this._buildHearts(level);
    this._buildButterflies(level);
    this._buildGoombas(level);
    this._buildStarHearts(level);
    this._buildGoalPortal(level);
    this._buildBouncePads(level);
    this._buildHUD(level);
    this._setupControls();
    this._setupMobileControls();

    // Smooth camera follow — bounds keep it from showing void beyond the map.
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  _buildBackground(level) {
    const bgKey = `bg-${((level.id - 1) % 10) + 1}`;
    const mapW  = level.mapWidth  || GAME_WIDTH;
    const mapH  = level.mapHeight || GAME_HEIGHT;

    // Tile the 800×450 background texture across the full world in both axes.
    for (let bx = 0; bx < mapW; bx += GAME_WIDTH) {
      for (let by = 0; by < mapH; by += GAME_HEIGHT) {
        this.add.image(bx + GAME_WIDTH / 2, by + GAME_HEIGHT / 2, bgKey);
      }
    }

    // Lava strip at the bottom of the full map.
    const lava = this.add.rectangle(mapW / 2, mapH - 8, mapW, 16, 0xff4500).setDepth(1);
    this.tweens.add({ targets: lava, alpha: 0.7, duration: 350, yoyo: true, repeat: -1 });
  }

  _buildPlatforms(level) {
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group();

    level.platforms.forEach(p => {
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
        const tilesNeeded = Math.ceil(p.w / 32);
        for (let i = 0; i < tilesNeeded; i++) {
          const tile = this.platforms.create(p.x + i * 32 + 16, p.y + p.h / 2, 'platform');
          tile.setDisplaySize(32, p.h);
          tile.refreshBody();
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

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);

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
      heart.destroy();
      this.heartsCollected++;
      this.heartsText.setText(`💕 ${this.heartsCollected} / ${(level.hearts || []).length}`);
      try { this.sound.play('collect', { volume: 0.6 }); } catch (_) {}
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
      if (this.isInvincible) return;
      // Stomp: player falling and centre above goomba centre
      if (player.body.velocity.y > 50 && player.y < goomba.y) {
        goomba.destroy();
        this.player.setVelocityY(PHYSICS.jumpVelocity * 1.3); // stomp bounce: 30% above normal jump
        try { this.sound.play('collect', { volume: 0.5 }); } catch (_) {}
      } else {
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

      try { this.sound.play('levelComplete', { volume: 0.7 }); } catch (_) {}

      this.player.setVelocity(0, 0);
      this.player.body.enable = false;

      this.time.delayedCall(800, () => {
        // Persist high score — highest level whose goal the player has reached.
        const prev = parseInt(localStorage.getItem('martha_highscore') || '0');
        if (this.levelNum > prev) localStorage.setItem('martha_highscore', String(this.levelNum));

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
        try { this.sound.play('jump', { volume: 0.9 }); } catch (_) {}
      }
    });
  }

  _buildHUD(level) {
    this.add.rectangle(GAME_WIDTH / 2, 18, GAME_WIDTH, 36, 0x000000, 0.3)
      .setScrollFactor(0).setDepth(9);

    this.livesText = this.add.text(12, 18, `💗 x ${this.lives}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(10).setScrollFactor(0);

    this.levelText = this.add.text(GAME_WIDTH / 2, 18, `Level ${level.id}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5, 0.5).setDepth(10).setScrollFactor(0);

    this.heartsText = this.add.text(GAME_WIDTH - 12, 18, `💕 0 / ${level.hearts?.length || 0}`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(1, 0.5).setDepth(10).setScrollFactor(0);
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
    this._leftPointerId = null;
    this._rightPointerId = null;
    this._jumpPointerId = null;

    this.input.on('pointerdown', (ptr) => {
      if (ptr.y > GAME_HEIGHT - 80) {
        if (ptr.x < GAME_WIDTH / 2) { this._touchLeft = true; this._leftPointerId = ptr.id; }
        else { this._touchRight = true; this._rightPointerId = ptr.id; }
      } else {
        this._touchJump = true; this._jumpPointerId = ptr.id;
      }
    });

    this.input.on('pointerup', (ptr) => {
      if (ptr.id === this._leftPointerId)  { this._touchLeft  = false; this._leftPointerId  = null; }
      if (ptr.id === this._rightPointerId) { this._touchRight = false; this._rightPointerId = null; }
      if (ptr.id === this._jumpPointerId)  { this._touchJump  = false; this._jumpPointerId  = null; }
    });

    const isMobile = this.sys.game.device.input.touch;
    if (isMobile) {
      this.add.rectangle(GAME_WIDTH / 4, GAME_HEIGHT - 40, GAME_WIDTH / 2, 80, 0xffffff, 0.15).setDepth(20).setScrollFactor(0);
      this.add.rectangle(3 * GAME_WIDTH / 4, GAME_HEIGHT - 40, GAME_WIDTH / 2, 80, 0xffffff, 0.15).setDepth(20).setScrollFactor(0);
      this.add.text(GAME_WIDTH / 4, GAME_HEIGHT - 40, '←', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
      this.add.text(3 * GAME_WIDTH / 4, GAME_HEIGHT - 40, '→', { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5).setDepth(21).setScrollFactor(0);
    }
  }

  update(time, delta) {
    if (this._clambering || this._isDead) return;

    const onGround = this.player.body.touching.down || this.player.body.blocked.down;
    const goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown  || this._touchLeft;
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown || this._touchRight;
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.up)
      || Phaser.Input.Keyboard.JustDown(this.wasd.space)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space)
      || this._touchJump;

    // --- Coyote time: allow jump for 6 frames after walking off a ledge ---
    if (onGround) {
      this._coyoteFrames = 6;
    } else if (this._coyoteFrames > 0) {
      this._coyoteFrames--;
    }

    // --- Moving platform carry: find platform directly underfoot ---
    let platformCarryVx = 0;
    if (onGround) {
      for (const tile of this.movingPlatforms.getChildren()) {
        const underfoot = this.player.body.bottom >= tile.body.top - 4
                       && this.player.body.bottom <= tile.body.top + 6
                       && this.player.body.right   > tile.body.left
                       && this.player.body.left    < tile.body.right;
        if (underfoot) { platformCarryVx = tile.body.velocity.x; break; }
      }
    }

    // --- Movement: snap to zero on ground with no input (kills platform-bump drift) ---
    if (!goLeft && !goRight && onGround) {
      this.player.setVelocityX(platformCarryVx); // stand still, or ride the platform
    } else {
      const inputVx   = goLeft ? -PHYSICS.playerSpeed : (goRight ? PHYSICS.playerSpeed : 0);
      const targetVx  = inputVx + platformCarryVx;
      const lerpFactor = onGround ? 0.35 : 0.12;
      const newVx      = Phaser.Math.Linear(this.player.body.velocity.x, targetVx, lerpFactor);
      this.player.setVelocityX(Math.abs(newVx) < 1 ? 0 : newVx);
    }

    if (goLeft)  this.player.setFlipX(true);
    if (goRight) this.player.setFlipX(false);

    // --- Jump: tiny 3-frame buffer (prevents missed inputs, not long queuing) ---
    if (jumpJustPressed) this._jumpBuffer = 3;
    if (this._jumpBuffer > 0) this._jumpBuffer--;
    if (this._jumpBuffer > 0 && (onGround || this._coyoteFrames > 0)) {
      this.player.setVelocityY(PHYSICS.jumpVelocity);
      this._jumpBuffer   = 0;
      this._coyoteFrames = 0;
      try { this.sound.play('jump', { volume: 0.5 }); } catch (_) {}
    }

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
      this._restartLevel(); // lava = instant death
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
      try { this.sound.play('collect', { volume: 0.9 }); } catch (_) {}
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
