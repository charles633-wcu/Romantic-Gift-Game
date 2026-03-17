export default class EndingScene extends Phaser.Scene {
  constructor() { super('EndingScene'); }
  create() { this.add.text(400, 225, 'Ending - Coming Soon', { color: '#ffffff' }).setOrigin(0.5); }
}
