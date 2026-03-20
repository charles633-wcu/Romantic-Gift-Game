import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

// Biomes available for dev testing.
// Add an entry here whenever new biome images are loaded in PreloaderScene.
const DEV_BIOMES = [
  { key: 'arctic',    label: 'Arctic' },
  { key: 'castle',    label: 'Castle' },
  { key: 'city',      label: 'City' },
  { key: 'cyberpunk', label: 'Cyberpunk' },
  { key: 'desert',    label: 'Desert' },
  { key: 'forest',    label: 'Forest' },
  { key: 'loveland',  label: 'Loveland' },
  { key: 'mountains', label: 'Mountains' },
  { key: 'tropical',  label: 'Tropical' },
  { key: 'undersea',  label: 'Undersea' },
  { key: 'volcano',   label: 'Volcano' },
];

export default class DevMenuScene extends Phaser.Scene {
  constructor() { super('DevMenuScene'); }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    this.add.text(GAME_WIDTH / 2, 40, 'DEV — Biome Tester', {
      fontSize: '26px', color: '#ec4899', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 78, 'Each runs Level 10 with the selected biome', {
      fontSize: '13px', color: '#9ca3af',
    }).setOrigin(0.5);

    const cols   = 2;
    const startY = 115;
    const step   = 52;
    const colX   = [GAME_WIDTH / 4, (GAME_WIDTH * 3) / 4];

    DEV_BIOMES.forEach(({ key, label }, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const btn = this.add.text(colX[col], startY + row * step, `▶  ${label}`, {
        fontSize: '18px', color: '#ffffff',
        backgroundColor: '#374151', padding: { x: 20, y: 9 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#ec4899' }));
      btn.on('pointerout',  () => btn.setStyle({ backgroundColor: '#374151' }));
      btn.on('pointerdown', () => {
        this.scene.start('GameScene', { levelNum: 20, forceBiome: key });
      });
    });

    // Back button
    const back = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 36, '← Back to Menu', {
      fontSize: '14px', color: '#6b7280',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerover', () => back.setStyle({ color: '#ec4899' }));
    back.on('pointerout',  () => back.setStyle({ color: '#6b7280' }));
    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
