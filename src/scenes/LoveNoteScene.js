import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { getRandomMessage } from '../config/messages.js';

export default class LoveNoteScene extends Phaser.Scene {
  constructor() { super('LoveNoteScene'); }

  init(data) {
    this.levelNum = data.levelNum || 1;
    this.message  = getRandomMessage();
  }

  create() {
    // Warm cream background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xfff8e7);

    // Decorative border
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 40, GAME_HEIGHT - 40)
      .setStrokeStyle(3, 0xfcd34d);

    // Envelope
    const envelope = this.add.text(GAME_WIDTH / 2, 110, '💌', { fontSize: '64px' })
      .setOrigin(0.5).setScale(0).setAlpha(0);
    this.tweens.add({ targets: envelope, scale: 1, alpha: 1, duration: 600, ease: 'Back.easeOut' });

    // Heading
    const heading = this.add.text(GAME_WIDTH / 2, 185, `Level ${this.levelNum} Complete! 💕`, {
      fontSize: '26px', color: '#92400e', fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: heading, alpha: 1, duration: 400, delay: 500 });

    // Divider
    const line = this.add.rectangle(GAME_WIDTH / 2, 215, 400, 2, 0xfcd34d).setAlpha(0);
    this.tweens.add({ targets: line, alpha: 1, duration: 400, delay: 700 });

    // Love note
    const note = this.add.text(GAME_WIDTH / 2, 295, this.message, {
      fontSize: '18px', color: '#78350f', fontStyle: 'italic',
      wordWrap: { width: 580 }, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: note, alpha: 1, duration: 400, delay: 900 });

    // Next level button
    const nextBtn = this.add.text(GAME_WIDTH / 2, 400, 'Next Level →', {
      fontSize: '22px', color: '#ffffff',
      backgroundColor: '#f59e0b', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: nextBtn, alpha: 1, duration: 400, delay: 1200 });

    nextBtn.on('pointerover', () => nextBtn.setStyle({ backgroundColor: '#d97706' }));
    nextBtn.on('pointerout',  () => nextBtn.setStyle({ backgroundColor: '#f59e0b' }));
    nextBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { levelNum: this.levelNum + 1 });
    });
  }
}
