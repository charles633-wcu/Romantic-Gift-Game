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

    // Biome panels — all follow {BIOME}_BACKGROUND.png / {BIOME}_SKYBOX.png convention.
    // Keys: {biome}-repeated (ground row), {biome}-skybox (sky rows).
    const BIOME_IMAGE_LIST = [
      'arctic', 'castle', 'city', 'cyberpunk', 'desert', 'forest',
      'loveland', 'mountains', 'tropical', 'undersea', 'volcano',
    ];
    BIOME_IMAGE_LIST.forEach(b => {
      const B = b.toUpperCase();
      this.load.image(`${b}-repeated`, `assets/backgrounds/${b}/${B}_BACKGROUND.png`);
      this.load.image(`${b}-skybox`,   `assets/backgrounds/${b}/${B}_SKYBOX.png`);
    });

    // Load sounds if available (fail silently if missing)
    this.load.audio('bgm', 'assets/sounds/bgm.mp3');
    this.load.audio('collect', 'assets/sounds/collect.wav');
    this.load.audio('jump', 'assets/sounds/jump.wav');
    this.load.audio('levelComplete', 'assets/sounds/level-complete.wav');

  }

  create() {
    this._createTextures();
    this._createSounds();
    this.scene.start('MenuScene');
  }

  _createSounds() {
    const actx = this.sound.context;
    if (!actx) return;

    // Only synthesise a key if the real file didn't load — real files take priority.
    const add = (key, buf) => { if (!this.cache.audio.has(key)) this.cache.audio.add(key, buf); };

    const make = (duration, fn) => {
      const sr = actx.sampleRate;
      const n  = Math.ceil(sr * duration);
      const buf = actx.createBuffer(1, n, sr);
      fn(buf.getChannelData(0), sr, n);
      return buf;
    };

    // ── Jump: quick ascending chirp ───────────────────────────────────────────
    add('jump', make(0.14, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t   = i / sr;
        const p   = t / 0.14;
        const env = (1 - p) * (1 - p);
        d[i] = Math.sin(2 * Math.PI * (200 + 500 * p) * t) * env * 0.35;
      }
    }));

    // ── Collect heart: bright two-note chime (E5 → B5) ───────────────────────
    add('collect', make(0.35, (d, sr, n) => {
      for (let i = 0; i < n; i++) {
        const t    = i / sr;
        const freq = t < 0.12 ? 659 : 988;
        const env  = Math.pow(1 - t / 0.35, 1.5);
        d[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
      }
    }));

    // ── Death: gentle descending "oh no" — soft falling tones ────────────────
    add('death', make(0.9, (d, sr, n) => {
      // Three softly descending notes: A4 → F4 → D4, each with a warm sine decay
      const notes = [[0.0, 440], [0.28, 349], [0.56, 294]];
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        let v = 0;
        for (const [s, f] of notes) {
          if (t >= s && t < s + 0.34) {
            const nt  = t - s;
            const env = Math.pow(1 - nt / 0.34, 1.2);
            v += (Math.sin(2 * Math.PI * f * t) * 0.7
                + Math.sin(2 * Math.PI * f * 1.5 * t) * 0.2) * env * 0.18;
          }
        }
        d[i] = v;
      }
    }));

    // ── Level complete: C4-E4-G4-C5 arpeggio fanfare ─────────────────────────
    add('levelComplete', make(0.9, (d, sr, n) => {
      const notes   = [262, 330, 392, 524];
      const noteDur = 0.18;
      for (let i = 0; i < n; i++) {
        const t  = i / sr;
        const ni = Math.min(notes.length - 1, Math.floor(t / noteDur));
        const nt = t - ni * noteDur;
        const env = Math.pow(Math.max(0, 1 - nt / noteDur), 0.8);
        d[i] = Math.sin(2 * Math.PI * notes[ni] * t) * env * 0.3;
      }
    }));

    add('bgm', make(16.0, (d, sr, n) => {
      const DUR = 0.42; // note duration

      // Section A  0–4s  C major — opening theme
      const secA = [
        [0.0,262],[0.5,330],[1.0,392],[1.5,440],
        [2.0,524],[2.5,440],[3.0,392],[3.5,330],
      ];
      // Section B  4–8s  G major — brighter dominant
      const secB = [
        [4.0,392],[4.5,494],[5.0,587],[5.5,659],
        [6.0,587],[6.5,494],[7.0,392],[7.5,330],
      ];
      // Section C  8–12s  F major bridge — warmer, lower
      const secC = [
        [8.0,349],[8.5,440],[9.0,349],[9.5,294],
        [10.0,262],[10.5,294],[11.0,349],[11.5,330],
      ];
      // Section A'  12–16s  C major return — slight variation
      const secAp = [
        [12.0,330],[12.5,392],[13.0,440],[13.5,524],
        [14.0,440],[14.5,392],[15.0,330],[15.5,262],
      ];

      // Counter-melody (quieter, slightly offset rhythm)
      const counter = [
        [0.25,523],[1.25,659],[2.25,784],[3.25,659],
        [4.25,784],[5.25,988],[6.25,784],[7.25,659],
        [8.25,698],[9.25,587],[10.25,523],[11.25,587],
        [12.25,659],[13.25,784],[14.25,659],[15.25,523],
      ];

      // Bass notes (one per 2 bars)
      const bass = [
        [0.0,131,2.0],[2.0,131,2.0],  // C
        [4.0,196,2.0],[6.0,196,2.0],  // G
        [8.0,175,2.0],[10.0,131,2.0], // F → C
        [12.0,131,2.0],[14.0,165,2.0],// C → E
      ];

      const melody = [...secA, ...secB, ...secC, ...secAp];

      for (let i = 0; i < n; i++) {
        const t = i / sr;
        let v = 0;

        // Main melody — warm organ-ish tone
        for (const [s, f] of melody) {
          if (t >= s && t < s + DUR) {
            const nt  = t - s, env = Math.sin(Math.PI * nt / DUR) * 0.8;
            v += (Math.sin(2 * Math.PI * f * t) * 0.6
                + Math.sin(4 * Math.PI * f * t) * 0.25
                + Math.sin(6 * Math.PI * f * t) * 0.10) * env * 0.09;
          }
        }

        // Counter-melody — softer, flute-like (pure sine)
        for (const [s, f] of counter) {
          if (t >= s && t < s + DUR) {
            const nt  = t - s, env = Math.sin(Math.PI * nt / DUR) * 0.6;
            v += Math.sin(2 * Math.PI * f * t) * env * 0.045;
          }
        }

        // Bass — slow attack, held notes
        for (const [s, f, dur] of bass) {
          if (t >= s && t < s + dur) {
            const nt  = t - s;
            const env = Math.sin(Math.PI * nt / dur) * 0.7;
            v += (Math.sin(2 * Math.PI * f * t) * 0.7
                + Math.sin(4 * Math.PI * f * t) * 0.2) * env * 0.07;
          }
        }

        d[i] = v;
      }
    }));
  }

  _createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Platform tile (32×20)
    g.clear();
    g.fillStyle(COLORS.platform);
    g.fillRect(0, 0, 32, 16);
    g.fillStyle(COLORS.platformEdge);
    g.fillRect(0, 16, 32, 4);
    g.fillStyle(COLORS.platform);
    g.fillRect(0, 4, 4, 8);   // left end cap
    g.fillRect(28, 4, 4, 8);  // right end cap
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
    // Highlights
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(8, 6, 3);   // left lobe highlight
    g.fillCircle(20, 6, 3);  // right lobe highlight
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(16, 16, 2); // chest centre depth dot
    g.generateTexture('player', 32, 34);

    // Collectible heart (16×16)
    g.clear();
    g.fillStyle(COLORS.heartCollect);
    g.fillCircle(5, 5, 5);
    g.fillCircle(11, 5, 5);
    g.fillTriangle(1, 7, 15, 7, 8, 14);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(4, 3, 2); // top-left lobe glint
    g.generateTexture('heart-collect', 16, 16);

    // Goal portal heart (48×48)
    g.clear();
    g.fillStyle(COLORS.heartGoal);
    g.fillCircle(15, 15, 15);
    g.fillCircle(33, 15, 15);
    g.fillTriangle(2, 22, 46, 22, 24, 44);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(10, 8, 5); // top-left lobe glint
    g.generateTexture('heart-goal', 48, 48);

    // Butterfly (32×32)
    g.clear();
    g.fillStyle(COLORS.butterfly);
    g.fillEllipse(8, 12, 10, 22);   // left wing — taller, narrower, more elegant
    g.fillEllipse(24, 12, 10, 22);  // right wing
    g.fillStyle(COLORS.butterflyBody);
    g.fillRect(14, 8, 4, 18);        // body
    g.generateTexture('butterfly', 32, 32);

    // Honey bee (18×12) — small yellow/black striped body, tiny translucent wings
    g.clear();
    g.fillStyle(0xfbbf24);           // amber yellow body
    g.fillEllipse(9, 8, 14, 9);
    g.fillStyle(0x292524);           // dark stripes
    g.fillRect(5, 5, 2, 6);
    g.fillRect(9, 5, 2, 6);
    g.fillRect(13, 5, 2, 6);
    g.fillStyle(0xffffff, 0.65);     // small wings
    g.fillEllipse(5,  3, 8, 4);      // left wing
    g.fillEllipse(13, 3, 8, 4);      // right wing
    g.generateTexture('bee', 18, 12);

    // ── Biome backgrounds — each generated only if no real image was loaded ──────
    // To swap in your own art: drop a 800×450 PNG into assets/backgrounds/ with
    // the matching filename (sky.png, loveland.png, …). The procedural version
    // below will be skipped automatically.

    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // ── Sky ──────────────────────────────────────────────────────────────────────
    if (!this.textures.exists('bg-sky')) {
      g.clear();
      g.fillStyle(0xdbeafe); g.fillRect(0, 0,           W, 160);
      g.fillStyle(0x93c5fd); g.fillRect(0, 160,         W, 180);
      g.fillStyle(0x60a5fa); g.fillRect(0, 340,         W, H - 340);
      // Cloud clusters (3 groups of overlapping circles)
      g.fillStyle(0xffffff, 0.88);
      [[130,65,26],[162,54,32],[192,65,24],
       [400,100,20],[430,89,26],[458,100,19],
       [635,52,23],[665,42,29],[693,52,21]].forEach(([x,y,r]) => g.fillCircle(x,y,r));
      g.generateTexture('bg-sky', W, H);
    }

    // ── Loveland ─────────────────────────────────────────────────────────────────
    if (!this.textures.exists('bg-loveland')) {
      g.clear();
      g.fillStyle(0xfce7f3); g.fillRect(0, 0,   W, 150);
      g.fillStyle(0xfbcfe8); g.fillRect(0, 150, W, 160);
      g.fillStyle(0xf9a8d4); g.fillRect(0, 310, W, H - 310);
      // Scattered hearts (two circles + triangle)
      g.fillStyle(0xfb7185, 0.45);
      [[100,60],[240,130],[380,55],[520,110],[680,70],[760,160],
       [55,290],[310,330],[470,250],[640,310]].forEach(([cx,cy]) => {
        const s = 10;
        g.fillCircle(cx - s/2, cy, s/2);
        g.fillCircle(cx + s/2, cy, s/2);
        g.fillTriangle(cx - s, cy + s*0.3, cx + s, cy + s*0.3, cx, cy + s*1.4);
      });
      // Sparkle dots
      g.fillStyle(0xffffff, 0.5);
      [[160,40],[300,90],[450,30],[600,80],[750,45],[80,200],[420,180],[700,210]].forEach(
        ([x,y]) => g.fillCircle(x, y, 3));
      g.generateTexture('bg-loveland', W, H);
    }

    // ── Forest ───────────────────────────────────────────────────────────────────
    if (!this.textures.exists('bg-forest')) {
      g.clear();
      g.fillStyle(0xd1fae5); g.fillRect(0, 0,   W, 150);
      g.fillStyle(0x6ee7b7); g.fillRect(0, 150, W, 160);
      g.fillStyle(0x34d399); g.fillRect(0, 310, W, H - 310);
      // Pine tree silhouettes (cx, base, half-width, height)
      g.fillStyle(0x065f46);
      [[60,H,38,115],[175,H,32,98],[310,H,42,125],[445,H,35,105],
       [575,H,40,118],[705,H,34,100],[780,H,30,88],[130,H,26,78],
       [390,H,28,82],[630,H,30,90]].forEach(([cx,b,hw,ht]) =>
        g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
      // Second layer — slightly lighter, shorter trees
      g.fillStyle(0x059669, 0.7);
      [[100,H-30,20,60],[250,H-30,22,65],[500,H-30,18,55],[660,H-30,21,62],[760,H-30,17,52]].forEach(
        ([cx,b,hw,ht]) => g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
      g.generateTexture('bg-forest', W, H);
    }

    // ── Snow ─────────────────────────────────────────────────────────────────────
    if (!this.textures.exists('bg-snow')) {
      g.clear();
      g.fillStyle(0xe2e8f0); g.fillRect(0, 0,   W, 160);
      g.fillStyle(0xcbd5e1); g.fillRect(0, 160, W, 150);
      g.fillStyle(0xf1f5f9); g.fillRect(0, 310, W, H - 310);
      // Mountain silhouettes (cx, height)
      g.fillStyle(0x94a3b8);
      [[130,H,130,215],[360,H,155,245],[590,H,140,225],[790,H,100,175],[20,H,90,155]].forEach(
        ([cx,b,hw,ht]) => g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
      // Snow caps
      g.fillStyle(0xf8fafc);
      [[130,H-215,45,60],[360,H-245,52,68],[590,H-225,47,63],[790,H-175,34,48]].forEach(
        ([cx,b,hw,ht]) => g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
      // Snowflake dots
      g.fillStyle(0xffffff, 0.75);
      [[45,40],[130,110],[205,65],[290,140],[370,55],[460,95],[535,130],
       [620,50],[710,100],[775,70],[90,185],[200,230],[340,200],[480,175],[670,215]].forEach(
        ([x,y]) => g.fillCircle(x, y, 2));
      g.generateTexture('bg-snow', W, H);
    }

    // ── Castle ───────────────────────────────────────────────────────────────────
    if (!this.textures.exists('bg-castle')) {
      g.clear();
      g.fillStyle(0x1e1b4b); g.fillRect(0, 0,   W, 150);
      g.fillStyle(0x312e81); g.fillRect(0, 150, W, 160);
      g.fillStyle(0x374151); g.fillRect(0, 310, W, H - 310);
      // Crescent moon (yellow circle with dark overlay for crescent effect)
      g.fillStyle(0xfef08a, 0.85); g.fillCircle(680, 65, 32);
      g.fillStyle(0x1e1b4b);       g.fillCircle(695, 58, 28);
      // Stars
      g.fillStyle(0xffffff, 0.75);
      [[45,35],[120,75],[205,28],[280,62],[365,42],[475,52],[545,82],[595,32],
       [720,90],[762,48],[95,140],[295,125],[495,138],[650,152]].forEach(
        ([x,y]) => g.fillCircle(x, y, 2));
      // Castle battlement silhouette along the bottom
      g.fillStyle(0x1f2937);
      g.fillRect(0, 370, W, H - 370);  // solid base
      for (let mx = 0; mx < W; mx += 44) {
        g.fillRect(mx, 350, 22, 22);   // merlons
      }
      g.generateTexture('bg-castle', W, H);
    }

    // ── Desert ───────────────────────────────────────────────────────────────────
    if (!this.textures.exists('bg-desert')) {
      g.clear();
      g.fillStyle(0xfde68a); g.fillRect(0, 0,   W, 150);
      g.fillStyle(0xfb923c); g.fillRect(0, 150, W, 160);
      g.fillStyle(0xfbbf24); g.fillRect(0, 310, W, H - 310);
      // Sun glow + core
      g.fillStyle(0xfef3c7, 0.4); g.fillCircle(100, 70, 58);
      g.fillStyle(0xfde68a);      g.fillCircle(100, 70, 42);
      // Dune silhouettes — half-ellipses rising from the bottom
      g.fillStyle(0xd97706);
      g.fillEllipse(180, H, 380, 130);
      g.fillEllipse(520, H, 340, 110);
      g.fillEllipse(760, H, 280,  95);
      g.generateTexture('bg-desert', W, H);
    }

    // ── Ground-continuation tiles — same as biome bg but no sun/moon ────────
    // Used to tile the ground row horizontally so the background extends forever
    // without duplicating the celestial object.

    // sky, loveland, forest, snow: no celestial — ground tile == bg tile
    g.clear();
    g.fillStyle(0xdbeafe); g.fillRect(0, 0, W, 160);
    g.fillStyle(0x93c5fd); g.fillRect(0, 160, W, 180);
    g.fillStyle(0x60a5fa); g.fillRect(0, 340, W, H - 340);
    g.fillStyle(0xffffff, 0.88);
    [[130,65,26],[162,54,32],[192,65,24],
     [400,100,20],[430,89,26],[458,100,19],
     [635,52,23],[665,42,29],[693,52,21]].forEach(([x,y,r]) => g.fillCircle(x,y,r));
    g.generateTexture('bg-ground-sky', W, H);

    g.clear();
    g.fillStyle(0xfce7f3); g.fillRect(0, 0, W, 150);
    g.fillStyle(0xfbcfe8); g.fillRect(0, 150, W, 160);
    g.fillStyle(0xf9a8d4); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0xfb7185, 0.45);
    [[100,60],[240,130],[380,55],[520,110],[680,70],[760,160],
     [55,290],[310,330],[470,250],[640,310]].forEach(([cx,cy]) => {
      const s = 10;
      g.fillCircle(cx - s/2, cy, s/2); g.fillCircle(cx + s/2, cy, s/2);
      g.fillTriangle(cx - s, cy + s*0.3, cx + s, cy + s*0.3, cx, cy + s*1.4);
    });
    g.fillStyle(0xffffff, 0.5);
    [[160,40],[300,90],[450,30],[600,80],[750,45],[80,200],[420,180],[700,210]].forEach(
      ([x,y]) => g.fillCircle(x, y, 3));
    g.generateTexture('bg-ground-loveland', W, H);

    g.clear();
    g.fillStyle(0xd1fae5); g.fillRect(0, 0, W, 150);
    g.fillStyle(0x6ee7b7); g.fillRect(0, 150, W, 160);
    g.fillStyle(0x34d399); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0x065f46);
    [[60,H,38,115],[175,H,32,98],[310,H,42,125],[445,H,35,105],
     [575,H,40,118],[705,H,34,100],[780,H,30,88],[130,H,26,78],
     [390,H,28,82],[630,H,30,90]].forEach(([cx,b,hw,ht]) =>
      g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
    g.fillStyle(0x059669, 0.7);
    [[100,H-30,20,60],[250,H-30,22,65],[500,H-30,18,55],[660,H-30,21,62],[760,H-30,17,52]].forEach(
      ([cx,b,hw,ht]) => g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
    g.generateTexture('bg-ground-forest', W, H);

    g.clear();
    g.fillStyle(0xe2e8f0); g.fillRect(0, 0, W, 160);
    g.fillStyle(0xcbd5e1); g.fillRect(0, 160, W, 150);
    g.fillStyle(0xf1f5f9); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0x94a3b8);
    [[130,H,130,215],[360,H,155,245],[590,H,140,225],[790,H,100,175],[20,H,90,155]].forEach(
      ([cx,b,hw,ht]) => g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
    g.fillStyle(0xf8fafc);
    [[130,H-215,45,60],[360,H-245,52,68],[590,H-225,47,63],[790,H-175,34,48]].forEach(
      ([cx,b,hw,ht]) => g.fillTriangle(cx, b-ht, cx-hw, b, cx+hw, b));
    g.fillStyle(0xffffff, 0.75);
    [[45,40],[130,110],[205,65],[290,140],[370,55],[460,95],[535,130],
     [620,50],[710,100],[775,70],[90,185],[200,230],[340,200],[480,175],[670,215]].forEach(
      ([x,y]) => g.fillCircle(x, y, 2));
    g.generateTexture('bg-ground-snow', W, H);

    // castle: same gradient + battlements, moon and stars removed
    g.clear();
    g.fillStyle(0x1e1b4b); g.fillRect(0, 0, W, 150);
    g.fillStyle(0x312e81); g.fillRect(0, 150, W, 160);
    g.fillStyle(0x374151); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0x1f2937);
    g.fillRect(0, 370, W, H - 370);
    for (let mx = 0; mx < W; mx += 44) { g.fillRect(mx, 350, 22, 22); }
    g.generateTexture('bg-ground-castle', W, H);

    // desert: same gradient + dunes, sun glow removed
    g.clear();
    g.fillStyle(0xfde68a); g.fillRect(0, 0, W, 150);
    g.fillStyle(0xfb923c); g.fillRect(0, 150, W, 160);
    g.fillStyle(0xfbbf24); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0xd97706);
    g.fillEllipse(180, H, 380, 130);
    g.fillEllipse(520, H, 340, 110);
    g.fillEllipse(760, H, 280,  95);
    g.generateTexture('bg-ground-desert', W, H);

    // ── Biome skyboxes — shown beyond the first background tile ──────────────
    // Simple repeatable patterns; each biome gets a distinct "deep sky" feel.

    // sky-sky: azure gradient bands with wispy cloud streaks
    g.clear();
    g.fillStyle(0x7dd3fc); g.fillRect(0, 0,   W, 160);
    g.fillStyle(0x38bdf8); g.fillRect(0, 160, W, 160);
    g.fillStyle(0x0ea5e9); g.fillRect(0, 320, W, H - 320);
    g.fillStyle(0xffffff, 0.12);
    for (let cx = 40; cx < W; cx += 120) {
      g.fillEllipse(cx, 80  + (cx % 60), 90, 18);
      g.fillEllipse(cx + 55, 220 + (cx % 40), 70, 14);
    }
    g.generateTexture('sky-sky', W, H);

    // sky-loveland: deep rose gradient, scattered tiny heart silhouettes
    g.clear();
    g.fillStyle(0xfda4af); g.fillRect(0, 0,   W, 150);
    g.fillStyle(0xfb7185); g.fillRect(0, 150, W, 160);
    g.fillStyle(0xf43f5e); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0xffffff, 0.18);
    [[80,55],[200,140],[350,40],[490,110],[620,70],[740,155],
     [130,280],[290,350],[460,300],[610,390]].forEach(([cx,cy]) => {
      const s = 7;
      g.fillCircle(cx - s/2, cy, s/2); g.fillCircle(cx + s/2, cy, s/2);
      g.fillTriangle(cx - s, cy + s*0.3, cx + s, cy + s*0.3, cx, cy + s*1.4);
    });
    g.generateTexture('sky-loveland', W, H);

    // sky-forest: deep emerald canopy layers
    g.clear();
    g.fillStyle(0x064e3b); g.fillRect(0, 0,   W, 150);
    g.fillStyle(0x065f46); g.fillRect(0, 150, W, 160);
    g.fillStyle(0x047857); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0x6ee7b7, 0.12);
    for (let lx = 0; lx < W; lx += 90) {
      g.fillCircle(lx, 60 + (lx % 70), 28);
      g.fillCircle(lx + 45, 200 + (lx % 50), 22);
      g.fillCircle(lx + 20, 340 + (lx % 60), 26);
    }
    g.generateTexture('sky-forest', W, H);

    // sky-snow: deep indigo twilight with subtle aurora shimmer
    g.clear();
    g.fillStyle(0x1e1b4b); g.fillRect(0, 0,   W, 150);
    g.fillStyle(0x312e81); g.fillRect(0, 150, W, 160);
    g.fillStyle(0x3730a3); g.fillRect(0, 310, W, H - 310);
    g.fillStyle(0xa5f3fc, 0.08);
    for (let ax = 0; ax < W + 60; ax += 80) { g.fillEllipse(ax, 120, 70, 220); }
    g.fillStyle(0xffffff, 0.55);
    [[35,45],[100,120],[175,30],[250,80],[340,55],[420,130],[510,40],
     [595,95],[680,65],[755,110],[60,240],[200,310],[370,260],[530,340],[700,280]].forEach(
      ([x,y]) => g.fillCircle(x, y, 1.5));
    g.generateTexture('sky-snow', W, H);

    // sky-castle: dense star field on near-black with nebula blushes
    g.clear();
    g.fillStyle(0x0f0a1e); g.fillRect(0, 0, W, H);
    g.fillStyle(0x4c1d95, 0.25); g.fillEllipse(250, 200, 320, 200);
    g.fillStyle(0x1e1b4b, 0.30); g.fillEllipse(600, 280, 280, 160);
    g.fillStyle(0xffffff, 0.9);
    [[22,18],[65,70],[112,28],[160,85],[210,42],[268,100],[315,55],[372,120],
     [418,35],[468,90],[520,18],[570,75],[625,40],[672,105],[718,22],[758,82],
     [40,180],[88,230],[148,195],[205,260],[270,215],[330,270],[400,180],[460,245],
     [525,200],[590,255],[655,185],[720,230],[780,195],[50,350],[130,400],[220,370],
     [310,420],[400,380],[490,410],[580,360],[670,415],[750,375]].forEach(
       ([x,y]) => g.fillCircle(x, y, 1.2));
    g.fillStyle(0xfef08a, 0.7); // a few brighter stars
    [[90,45],[340,80],[560,30],[700,60],[180,310],[490,280]].forEach(
      ([x,y]) => g.fillCircle(x, y, 2));
    g.generateTexture('sky-castle', W, H);

    // sky-desert: warm amber-to-purple twilight horizon
    g.clear();
    g.fillStyle(0x7c2d12); g.fillRect(0, 0,   W, 140);
    g.fillStyle(0x9a3412); g.fillRect(0, 140, W, 160);
    g.fillStyle(0xc2410c); g.fillRect(0, 300, W, H - 300);
    g.fillStyle(0xfbbf24, 0.15);
    for (let dx = 0; dx < W; dx += 70) { g.fillEllipse(dx + 35, H, 130, 55); }
    g.fillStyle(0xfef3c7, 0.6);
    [[60,40],[155,20],[270,55],[390,30],[510,50],[640,25],[740,45]].forEach(
      ([x,y]) => g.fillCircle(x, y, 1.5));
    g.generateTexture('sky-desert', W, H);

    // Moving platform tile (32×15) — brighter pink to distinguish
    g.clear();
    g.fillStyle(COLORS.movingPlatform);
    g.fillRect(0, 0, 32, 11);
    g.fillStyle(0xff66aa);
    g.fillRect(0, 11, 32, 4);
    g.fillStyle(COLORS.movingPlatform);
    g.fillRect(0, 2, 4, 7);   // left end cap
    g.fillRect(28, 2, 4, 7);  // right end cap
    g.generateTexture('platform-moving', 32, 15);

    // Conveyor platform tile (32×20) — teal/cyan to distinguish
    g.clear();
    g.fillStyle(0x0ea5e9);
    g.fillRect(0, 0, 32, 16);
    g.fillStyle(0x0284c7);
    g.fillRect(0, 16, 32, 4);
    g.fillStyle(0x0ea5e9); // match existing body fill colour
    g.fillRect(0, 4, 4, 8);
    g.fillRect(28, 4, 4, 8);
    g.generateTexture('platform-conveyor', 32, 20);

    // Blinking platform tile (32×20) — amber/yellow to warn of disappearance
    g.clear();
    g.fillStyle(0xf59e0b);
    g.fillRect(0, 0, 32, 16);
    g.fillStyle(0xd97706);
    g.fillRect(0, 16, 32, 4);
    g.fillStyle(0xf59e0b); // match existing body fill colour
    g.fillRect(0, 4, 4, 8);
    g.fillRect(28, 4, 4, 8);
    g.generateTexture('platform-blink', 32, 20);

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
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(7, 6, 4);          // top-left body highlight
    g.generateTexture('goomba', 28, 26);

    // Star-heart (invincibility pickup) — 24×24, gold with inner highlight
    g.clear();
    g.fillStyle(0xffd700);
    g.fillCircle(7, 7, 7);
    g.fillCircle(17, 7, 7);
    g.fillTriangle(1, 10, 23, 10, 12, 22);
    g.fillStyle(0xffe066);           // lighter gold inner highlight
    g.fillCircle(5, 5, 3);
    g.fillCircle(15, 5, 3);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(4, 3, 3);           // white glint
    g.generateTexture('heart-star', 24, 24);

    g.destroy();
  }
}
