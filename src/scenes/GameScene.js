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
      const tilesNeeded = Math.ceil(p.w / 32);
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.platforms.create(p.x + i * 32 + 16, p.y + p.h / 2, 'platform');
        tile.setDisplaySize(32, p.h);
        tile.refreshBody();
      }
    });
  }

  _buildPlayer(level) {
    const spawnX = (level.platforms[0]?.x || 0) + 40;
    const spawnY = (level.platforms[0]?.y || GAME_HEIGHT - 60) - 40;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setMaxVelocity(PHYSICS.playerSpeed * 2, 600);
    this.spawnX = spawnX;
    this.spawnY = spawnY;

    this.physics.add.collider(this.player, this.platforms);

    this.isInvincible = false;
  }

  _buildHUD(level) {
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

    const isMobile = this.sys.game.device.input.touch;
    if (isMobile) {
      this.add.rectangle(GAME_WIDTH / 4, GAME_HEIGHT - 40, GAME_WIDTH / 2, 80, 0xffffff, 0.15).setDepth(20);
      this.add.rectangle(3 * GAME_WIDTH / 4, GAME_HEIGHT - 40, GAME_WIDTH / 2, 80, 0xffffff, 0.15).setDepth(20);
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

    this._touchJump = false;

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
