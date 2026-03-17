export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() { this.add.text(400, 225, 'Game - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
