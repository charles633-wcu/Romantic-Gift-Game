import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from './constants.js';

// Import scenes (will add as we build them)
import PreloaderScene from './scenes/PreloaderScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import LoveNoteScene from './scenes/LoveNoteScene.js';
import EndingScene from './scenes/EndingScene.js';
import PauseScene from './scenes/PauseScene.js';
import DevMenuScene from './scenes/DevMenuScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.LANDSCAPE,
  },
  input: {
    activePointers: 3, // allow up to 3 simultaneous touches (move + jump + spare)
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: PHYSICS.gravityY }, debug: false },
  },
  scene: [PreloaderScene, MenuScene, GameScene, LoveNoteScene, PauseScene, EndingScene, DevMenuScene],
};

new Phaser.Game(config);
