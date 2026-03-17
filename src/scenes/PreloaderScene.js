import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('PreloaderScene'); }

  preload() {
    // Loading bar background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 400, 20, 0x333333);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2, 0, 20, 0xff69b4);
    bar.setOrigin(0, 0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Loading... 💕', {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => { bar.width = 400 * value; });
    this.load.on('loaderror', () => { /* silently ignore missing assets */ });

    // Load sounds if available (fail silently if missing)
    this.load.audio('bgm', 'assets/sounds/bgm.mp3');
    this.load.audio('collect', 'assets/sounds/collect.wav');
    this.load.audio('jump', 'assets/sounds/jump.wav');
    this.load.audio('levelComplete', 'assets/sounds/level-complete.wav');

    this.load.json('levels', 'src/config/levels.json');
  }

  create() {
    this._createTextures();
    const data = this.cache.json.get('levels');
    this.scene.start('MenuScene', { levels: data ? data.levels : [] });
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

    // Player heart body (32×34) — heart shape + legs
    g.clear();
    g.fillStyle(COLORS.player);
    g.fillCircle(10, 10, 10);
    g.fillCircle(22, 10, 10);
    g.fillTriangle(2, 14, 30, 14, 16, 28);
    // Legs
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
    g.fillStyle(COLORS.butterflyBody);
    g.fillRect(14, 8, 4, 18);        // body
    g.generateTexture('butterfly', 32, 32);

    // Background gradients — one per level (different hues)
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
      g.fillStyle(top);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT / 2);
      g.fillStyle(bottom);
      g.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);
      g.generateTexture(`bg-${i + 1}`, GAME_WIDTH, GAME_HEIGHT);
    });

    // Moving platform tile (32×15) — brighter pink to distinguish
    g.clear();
    g.fillStyle(COLORS.movingPlatform);
    g.fillRect(0, 0, 32, 11);
    g.fillStyle(0xff66aa);
    g.fillRect(0, 11, 32, 4);
    g.generateTexture('platform-moving', 32, 15);

    // Goomba (28×26) — round orange enemy, stompable
    g.clear();
    g.fillStyle(COLORS.goomba);
    g.fillCircle(14, 12, 12);       // round body
    g.fillStyle(0x000000);
    g.fillCircle(9,  9, 2);         // left eye
    g.fillCircle(19, 9, 2);         // right eye
    g.fillRect(10, 16, 2, 2);       // frown left
    g.fillRect(16, 16, 2, 2);       // frown right
    g.fillStyle(COLORS.goomba);
    g.fillRect(6,  21, 6, 5);       // left foot
    g.fillRect(16, 21, 6, 5);       // right foot
    g.generateTexture('goomba', 28, 26);

    g.destroy();
  }
}
