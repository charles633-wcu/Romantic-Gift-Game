import { HER_NAME, STORAGE_PREFIX, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

const DEV_PIN = '1234';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const savedMusic = localStorage.getItem(`${STORAGE_PREFIX}_music`) ?? 'on';
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-loveland');

    // Floating hearts (decorative)
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 380);
      const heart = this.add.image(x, y, 'heart-collect').setAlpha(0.4);
      this.tweens.add({
        targets: heart, y: y - 20,
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000),
      });
    }

    // Title
    this.add.text(GAME_WIDTH / 2, 110, 'A Love Story 💕', {
      fontSize: '42px', color: '#be185d', fontStyle: 'bold',
      stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 163, `for ${HER_NAME}`, {
      fontSize: '22px', color: '#9d174d', fontStyle: 'italic',
    }).setOrigin(0.5);

    // High score
    const best = parseInt(localStorage.getItem(`${STORAGE_PREFIX}_highscore`) || '0');
    if (best > 0) {
      this.add.text(GAME_WIDTH / 2, 208, `Best: Level ${best} 🏆`, {
        fontSize: '16px', color: '#d97706',
      }).setOrigin(0.5);
    }

    // Play button
    const playBtn = this.add.text(GAME_WIDTH / 2, 275, '▶  Play', {
      fontSize: '28px', color: '#ffffff',
      backgroundColor: '#ec4899', padding: { x: 30, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#db2777' }));
    playBtn.on('pointerout',  () => playBtn.setStyle({ backgroundColor: '#ec4899' }));

    this._musicOn = (savedMusic === 'on');

    playBtn.on('pointerdown', () => {
      try {
        if (this._musicOn && !this.sound.get('bgm')) {
          this.sound.add('bgm', { loop: true, volume: 0.37 }).play();
        }
      } catch (_) {}
      this.scene.start('GameScene', { levelNum: 1 });
    });

    // Controls button
    const ctrlBtn = this.add.text(GAME_WIDTH / 2, 335, '🎮  Controls', {
      fontSize: '16px', color: '#9d174d',
      backgroundColor: '#fce7f3', padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    ctrlBtn.on('pointerover', () => ctrlBtn.setStyle({ backgroundColor: '#fbcfe8' }));
    ctrlBtn.on('pointerout',  () => ctrlBtn.setStyle({ backgroundColor: '#fce7f3' }));
    ctrlBtn.on('pointerdown', () => this._showControls());

    // Music toggle
    const musicBtn = this.add.text(GAME_WIDTH - 20, 20, this._musicOn ? '♪' : '🔇', {
      fontSize: '24px', color: '#be185d',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    musicBtn.on('pointerdown', () => {
      this._musicOn = !this._musicOn;
      musicBtn.setText(this._musicOn ? '♪' : '🔇');
      localStorage.setItem(`${STORAGE_PREFIX}_music`, this._musicOn ? 'on' : 'off');
      try {
        const bgm = this.sound.get('bgm');
        if (bgm) { this._musicOn ? bgm.resume() : bgm.pause(); }
      } catch (_) {}
    });

    // Hidden dev lock — small icon bottom-left, not labelled
    const lockBtn = this.add.text(18, GAME_HEIGHT - 16, '🔒', {
      fontSize: '14px', alpha: 0.25,
    }).setOrigin(0, 1).setInteractive({ useHandCursor: true });

    lockBtn.on('pointerover', () => lockBtn.setAlpha(0.6));
    lockBtn.on('pointerout',  () => lockBtn.setAlpha(0.25));
    lockBtn.on('pointerdown', () => this._showPinPad(lockBtn));
  }

  // ── PIN pad ────────────────────────────────────────────────────────────────

  _showPinPad(lockBtn) {
    const CX = GAME_WIDTH / 2, CY = GAME_HEIGHT / 2;
    let entered = '';
    const DEPTH = 20;

    const nodes = [];
    const track = obj => { nodes.push(obj); return obj; };
    const closeAll = () => nodes.forEach(o => { try { o.destroy(); } catch(_){} });

    track(this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(DEPTH).setInteractive());

    const card = track(this.add.rectangle(CX, CY, 260, 340, 0xffffff).setStrokeStyle(2, 0xec4899).setDepth(DEPTH + 1));

    track(this.add.text(CX, CY - 148, 'Developer Access', {
      fontSize: '15px', color: '#be185d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH + 2));

    // PIN display (4 dots)
    const display = track(this.add.text(CX, CY - 112, '○ ○ ○ ○', {
      fontSize: '20px', color: '#374151', letterSpacing: 4,
    }).setOrigin(0.5).setDepth(DEPTH + 2));

    const updateDisplay = () => {
      const filled = '● '.repeat(entered.length);
      const empty  = '○ '.repeat(Math.max(0, 4 - entered.length));
      display.setText((filled + empty).trim());
    };

    // Status text (wrong PIN feedback)
    const status = track(this.add.text(CX, CY - 82, '', {
      fontSize: '12px', color: '#ef4444',
    }).setOrigin(0.5).setDepth(DEPTH + 2));

    // Number pad  1-9, then ←, 0, ✓
    const PAD = ['1','2','3','4','5','6','7','8','9','←','0','✓'];
    const btnW = 56, btnH = 38, cols = 3, startX = CX - btnW, startY = CY - 48;

    PAD.forEach((label, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const bx = startX + col * (btnW + 8);
      const by = startY + row * (btnH + 8);

      const isAction = label === '←' || label === '✓';
      const bg = track(this.add.rectangle(bx, by, btnW, btnH,
        isAction ? 0xf3f4f6 : 0xfce7f3).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true }));
      const txt = track(this.add.text(bx, by, label, {
        fontSize: '18px', color: isAction ? '#6b7280' : '#be185d', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH + 3));

      bg.on('pointerover', () => bg.setFillStyle(0xec4899) && txt.setStyle({ color: '#ffffff' }));
      bg.on('pointerout',  () => bg.setFillStyle(isAction ? 0xf3f4f6 : 0xfce7f3) && txt.setStyle({ color: isAction ? '#6b7280' : '#be185d' }));

      bg.on('pointerdown', () => {
        if (label === '←') {
          entered = entered.slice(0, -1);
          status.setText('');
          updateDisplay();
        } else if (label === '✓') {
          if (entered.length < 4) {
            status.setText('Enter 4 digits');
          } else if (entered === DEV_PIN) {
            closeAll();
            lockBtn.setText('🔓').setAlpha(0.5);
            this._addDevButtons();
          } else {
            entered = '';
            updateDisplay();
            status.setText('Incorrect PIN');
          }
        } else if (entered.length < 4) {
          entered += label;
          updateDisplay();
        }
      });
    });

    // Cancel
    const cancelBtn = track(this.add.text(CX, CY + 148, 'Cancel', {
      fontSize: '13px', color: '#9ca3af',
    }).setOrigin(0.5).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true }));
    cancelBtn.on('pointerover', () => cancelBtn.setStyle({ color: '#ec4899' }));
    cancelBtn.on('pointerout',  () => cancelBtn.setStyle({ color: '#9ca3af' }));
    cancelBtn.on('pointerdown', closeAll);
  }

  _addDevButtons() {
    const devBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 36, '[ DEV: Jump to Level 15 ]', {
      fontSize: '13px', color: '#9ca3af',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    devBtn.on('pointerover', () => devBtn.setStyle({ color: '#ec4899' }));
    devBtn.on('pointerout',  () => devBtn.setStyle({ color: '#9ca3af' }));
    devBtn.on('pointerdown', () => {
      try {
        if (this._musicOn && !this.sound.get('bgm')) {
          this.sound.add('bgm', { loop: true, volume: 0.37 }).play();
        }
      } catch (_) {}
      this.scene.start('GameScene', { levelNum: 15 });
    });

    const biomeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, '[ DEV: Biome Tester ]', {
      fontSize: '13px', color: '#4ade80',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    biomeBtn.on('pointerover', () => biomeBtn.setStyle({ color: '#ec4899' }));
    biomeBtn.on('pointerout',  () => biomeBtn.setStyle({ color: '#4ade80' }));
    biomeBtn.on('pointerdown', () => this.scene.start('DevMenuScene'));
  }

  // ── Controls modal ─────────────────────────────────────────────────────────

  _showControls() {
    const CX = GAME_WIDTH / 2, CY = GAME_HEIGHT / 2;
    const W = 500, H = 310;
    const DEPTH = 10;

    const nodes = [];
    const track = obj => { nodes.push(obj); return obj; };
    const closeAll = () => nodes.forEach(o => { try { o.destroy(); } catch(_){} });

    track(this.add.rectangle(CX, CY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setDepth(DEPTH).setInteractive()).on('pointerdown', closeAll);

    track(this.add.rectangle(CX, CY, W, H, 0xffffff)
      .setStrokeStyle(3, 0xec4899).setDepth(DEPTH + 1));

    track(this.add.text(CX, CY - 128, '🎮  Controls', {
      fontSize: '20px', color: '#be185d', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH + 2));

    track(this.add.rectangle(CX, CY - 104, W - 40, 1, 0xfbcfe8).setDepth(DEPTH + 2));

    const col1 = CX - 110, col2 = CX + 110;
    const rows = [
      ['⌨️  Keyboard',            '📱  Mobile'],
      ['← / A        Move left',  'Left side of screen'],
      ['→ / D        Move right', 'Right side of screen'],
      ['↑ / W / Space  Jump',     'Tap upper half'],
      ['↑ on ladder   Climb up',  ''],
      ['↓ on ladder   Climb down',''],
    ];

    rows.forEach(([left, right], i) => {
      const y    = CY - 78 + i * 36;
      const bold = i === 0;
      track(this.add.text(col1, y, left, {
        fontSize: bold ? '13px' : '12px', color: bold ? '#be185d' : '#374151',
        fontStyle: bold ? 'bold' : 'normal',
      }).setOrigin(0.5).setDepth(DEPTH + 2));
      if (right) {
        track(this.add.text(col2, y, right, {
          fontSize: bold ? '13px' : '12px', color: bold ? '#be185d' : '#374151',
          fontStyle: bold ? 'bold' : 'normal',
        }).setOrigin(0.5).setDepth(DEPTH + 2));
      }
      if (i === 0) track(this.add.rectangle(CX, y + 18, W - 40, 1, 0xfbcfe8).setDepth(DEPTH + 2));
    });

    const closeBtn = track(this.add.text(CX, CY + 128, '✕  Close', {
      fontSize: '14px', color: '#ffffff',
      backgroundColor: '#ec4899', padding: { x: 20, y: 7 },
    }).setOrigin(0.5).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true }));

    closeBtn.on('pointerdown', closeAll);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ backgroundColor: '#db2777' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ backgroundColor: '#ec4899' }));
  }
}
