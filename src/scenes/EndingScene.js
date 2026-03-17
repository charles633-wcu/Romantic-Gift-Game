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
