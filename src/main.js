import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

// Import scenes (will add as we build them)
import PreloaderScene from './scenes/PreloaderScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import LoveNoteScene from './scenes/LoveNoteScene.js';
import EndingScene from './scenes/EndingScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false },
  },
  scene: [PreloaderScene, MenuScene, GameScene, LoveNoteScene, EndingScene],
};

new Phaser.Game(config);
