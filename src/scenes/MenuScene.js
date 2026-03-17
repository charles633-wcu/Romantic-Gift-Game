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

    // Subtitle with her name
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
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#db2777' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#ec4899' }));

    // Music toggle state
    this._musicOn = true;
    this._bgm = null;

    // Wire play button — also starts BGM on first user interaction
    playBtn.on('pointerdown', () => {
      try {
        if (!this.sound.get('bgm')) {
          this._bgm = this.sound.add('bgm', { loop: true, volume: 0.4 });
          this._bgm.play();
        }
      } catch (_) {}
      this.scene.start('GameScene', { levels: this.levels, levelIndex: 0 });
    });

    // Music toggle button
    const musicBtn = this.add.text(GAME_WIDTH - 20, 20, '♪', {
      fontSize: '24px',
      color: '#be185d',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

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
