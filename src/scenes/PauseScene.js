// src/scenes/PauseScene.js
import { GAME_WIDTH, GAME_HEIGHT, STORAGE_PREFIX } from '../constants.js';

export default class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  init(data) {
    this.levelNum = data?.levelNum ?? 1;
  }

  create() {
    // Ensure only the topmost interactive object receives each pointer event,
    // so card buttons don't also fire the overlay's resume handler.
    this.input.setTopOnly(true);

    // ── Dark overlay — tapping outside card resumes ──────────────────────────
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6
    ).setDepth(50).setInteractive();
    overlay.on('pointerdown', () => this._resume());

    // ── Card background ──────────────────────────────────────────────────────
    const cardW = 380, cardH = 300;
    const cardX = GAME_WIDTH / 2, cardY = GAME_HEIGHT / 2;

    this.add.rectangle(cardX, cardY, cardW, cardH, 0xffffff)
      .setStrokeStyle(3, 0xec4899).setDepth(51);

    // ── Title ────────────────────────────────────────────────────────────────
    this.add.text(cardX, cardY - 130, '⏸  Paused', {
      fontSize: '22px', color: '#be185d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51);

    // ── Continue button ──────────────────────────────────────────────────────
    const continueBtn = this.add.text(cardX, cardY - 92, '▶  Continue', {
      fontSize: '18px', color: '#ffffff',
      backgroundColor: '#ec4899', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerover',  () => continueBtn.setStyle({ backgroundColor: '#db2777' }));
    continueBtn.on('pointerout',   () => continueBtn.setStyle({ backgroundColor: '#ec4899' }));
    continueBtn.on('pointerdown',  () => this._resume());

    // ── Music toggle ─────────────────────────────────────────────────────────
    const musicState = localStorage.getItem(`${STORAGE_PREFIX}_music`) ?? 'on';

    this.add.text(cardX - 80, cardY - 48, '♪ Music', {
      fontSize: '15px', color: '#374151',
    }).setOrigin(0.5).setDepth(51);

    const musicOnBtn = this.add.text(cardX + 38, cardY - 48, 'ON', {
      fontSize: '13px', color: '#ffffff', padding: { x: 8, y: 4 },
      backgroundColor: musicState === 'on' ? '#ec4899' : '#6b7280',
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    const musicOffBtn = this.add.text(cardX + 78, cardY - 48, 'OFF', {
      fontSize: '13px', color: '#ffffff', padding: { x: 8, y: 4 },
      backgroundColor: musicState === 'off' ? '#ec4899' : '#6b7280',
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    const setMusic = (state) => {
      localStorage.setItem(`${STORAGE_PREFIX}_music`, state);
      musicOnBtn.setStyle({ backgroundColor: state === 'on'  ? '#ec4899' : '#6b7280' });
      musicOffBtn.setStyle({ backgroundColor: state === 'off' ? '#ec4899' : '#6b7280' });
      const bgm = this.game.sound.get('bgm');
      if (bgm) { state === 'off' ? bgm.pause() : bgm.resume(); }
    };
    musicOnBtn.on('pointerdown',  () => setMusic('on'));
    musicOffBtn.on('pointerdown', () => setMusic('off'));

    // ── SFX toggle ───────────────────────────────────────────────────────────
    const sfxState = localStorage.getItem(`${STORAGE_PREFIX}_sfx`) ?? 'on';

    this.add.text(cardX - 80, cardY - 16, '🔊 SFX', {
      fontSize: '15px', color: '#374151',
    }).setOrigin(0.5).setDepth(51);

    const sfxOnBtn = this.add.text(cardX + 38, cardY - 16, 'ON', {
      fontSize: '13px', color: '#ffffff', padding: { x: 8, y: 4 },
      backgroundColor: sfxState === 'on' ? '#ec4899' : '#6b7280',
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    const sfxOffBtn = this.add.text(cardX + 78, cardY - 16, 'OFF', {
      fontSize: '13px', color: '#ffffff', padding: { x: 8, y: 4 },
      backgroundColor: sfxState === 'off' ? '#ec4899' : '#6b7280',
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    const setSfx = (state) => {
      localStorage.setItem(`${STORAGE_PREFIX}_sfx`, state);
      sfxOnBtn.setStyle({ backgroundColor: state === 'on'  ? '#ec4899' : '#6b7280' });
      sfxOffBtn.setStyle({ backgroundColor: state === 'off' ? '#ec4899' : '#6b7280' });
      // Update GameScene's cached flag so the change takes effect immediately
      const gs = this.scene.get('GameScene');
      if (gs) gs._sfxOn = (state === 'on');
    };
    sfxOnBtn.on('pointerdown',  () => setSfx('on'));
    sfxOffBtn.on('pointerdown', () => setSfx('off'));

    // ── Divider ──────────────────────────────────────────────────────────────
    this.add.rectangle(cardX, cardY + 22, 320, 1, 0xe5e7eb).setDepth(51);

    // ── Controls button ──────────────────────────────────────────────────────
    const ctrlBtn = this.add.text(cardX, cardY + 40, '🎮  Controls', {
      fontSize: '15px', color: '#9d174d',
      backgroundColor: '#fce7f3', padding: { x: 16, y: 7 },
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    ctrlBtn.on('pointerover', () => ctrlBtn.setStyle({ backgroundColor: '#fbcfe8' }));
    ctrlBtn.on('pointerout',  () => ctrlBtn.setStyle({ backgroundColor: '#fce7f3' }));
    ctrlBtn.on('pointerdown', () => this._showControls());

    // ── Exit to Menu ─────────────────────────────────────────────────────────
    const exitBtn = this.add.text(cardX, cardY + 100, 'Exit to Menu', {
      fontSize: '16px', color: '#ffffff',
      backgroundColor: '#6b7280', padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

    exitBtn.on('pointerover',  () => exitBtn.setStyle({ backgroundColor: '#4b5563' }));
    exitBtn.on('pointerout',   () => exitBtn.setStyle({ backgroundColor: '#6b7280' }));
    exitBtn.on('pointerdown',  () => this._exitToMenu());
  }

  _showControls() {
    const CX = GAME_WIDTH / 2, CY = GAME_HEIGHT / 2;
    const W = 500, H = 310, D = 60;

    const nodes = [];
    const track = o => { nodes.push(o); return o; };
    const closeAll = () => nodes.forEach(o => { try { o.destroy(); } catch(_){} });

    track(this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setDepth(D).setInteractive()).on('pointerdown', closeAll);
    track(this.add.rectangle(CX, CY, W, H, 0xffffff)
      .setStrokeStyle(3, 0xec4899).setDepth(D + 1));
    track(this.add.text(CX, CY - 128, '🎮  Controls', {
      fontSize: '20px', color: '#be185d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(D + 2));
    track(this.add.rectangle(CX, CY - 104, W - 40, 1, 0xfbcfe8).setDepth(D + 2));

    const col1 = CX - 110, col2 = CX + 110;
    const rows = [
      ['⌨️  Keyboard',             '📱  Mobile'],
      ['← / A        Move left',   'Left button'],
      ['→ / D        Move right',  'Right button'],
      ['↑ / W / Space  Jump',      'Tap anywhere else'],
      ['↑ on ladder   Climb up',   ''],
      ['↓ on ladder   Climb down', ''],
    ];
    rows.forEach(([left, right], i) => {
      const y = CY - 78 + i * 36, bold = i === 0;
      track(this.add.text(col1, y, left, {
        fontSize: bold ? '13px' : '12px', color: bold ? '#be185d' : '#374151',
        fontStyle: bold ? 'bold' : 'normal',
      }).setOrigin(0.5).setDepth(D + 2));
      if (right) track(this.add.text(col2, y, right, {
        fontSize: bold ? '13px' : '12px', color: bold ? '#be185d' : '#374151',
        fontStyle: bold ? 'bold' : 'normal',
      }).setOrigin(0.5).setDepth(D + 2));
      if (i === 0) track(this.add.rectangle(CX, y + 18, W - 40, 1, 0xfbcfe8).setDepth(D + 2));
    });

    const closeBtn = track(this.add.text(CX, CY + 128, '✕  Close', {
      fontSize: '14px', color: '#ffffff',
      backgroundColor: '#ec4899', padding: { x: 20, y: 7 },
    }).setOrigin(0.5).setDepth(D + 2).setInteractive({ useHandCursor: true }));
    closeBtn.on('pointerdown', closeAll);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ backgroundColor: '#db2777' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ backgroundColor: '#ec4899' }));
  }

  _resume() {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }

  _exitToMenu() {
    // Order matters: stop GameScene first, start MenuScene second, stop self last.
    // Stopping self before scene.start() would issue scene calls from an invalid context.
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
    this.scene.stop('PauseScene');
  }
}
