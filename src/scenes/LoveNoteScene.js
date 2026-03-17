export default class LoveNoteScene extends Phaser.Scene {
  constructor() { super('LoveNoteScene'); }
  create() { this.add.text(400, 225, 'LoveNote - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
