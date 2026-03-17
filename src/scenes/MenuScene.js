export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() { this.add.text(400, 225, 'Menu - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
