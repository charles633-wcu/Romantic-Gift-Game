export default class PreloaderScene extends Phaser.Scene {
  constructor() { super('PreloaderScene'); }
  preload() {}
  create() { this.scene.start('MenuScene', { levels: [] }); }
}
