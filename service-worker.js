const CACHE = 'love-story-v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon.svg',
  '/src/main.js',
  '/src/constants.js',
  '/src/config/biomes.js',
  '/src/config/levelGenerator.js',
  '/src/config/messages.js',
  '/src/scenes/PreloaderScene.js',
  '/src/scenes/MenuScene.js',
  '/src/scenes/GameScene.js',
  '/src/scenes/LoveNoteScene.js',
  '/src/scenes/PauseScene.js',
  '/src/scenes/EndingScene.js',
  '/src/scenes/DevMenuScene.js',
  '/assets/phaser.min.js',
  '/assets/sounds/bgm.mp3',
];

// Install: cache all local assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local assets, network-first for CDN (Phaser)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Let CDN requests (Phaser) go straight to network
  if (url.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      });
    })
  );
});
