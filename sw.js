const CACHE_NAME = 'islamic-knowledge-cache-v9';
const OFFLINE_URLS =[
  './',
  './islamic.html',
  './quran.html',
  './quran-module.js',
  './misconceptions-module.js',
  './ans.json',
  './question.json',
  './namazshikkha.json',
  './misconceptions.json',
  './manifest.json',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0,1',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;700&display=swap'
];

// Install event – cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Use Promise.allSettled so that a single failed URL doesn't break the whole install
      await Promise.allSettled(
        OFFLINE_URLS.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          })
        )
      );
    })()
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});

// Fetch event – serve from cache, fallback to network, with offline fallback page
self.addEventListener('fetch', event => {
  // For API calls, always go to network (no cache)
  if (
    event.request.url.includes('generativelanguage') ||
    event.request.url.includes('openrouter') ||
    event.request.url.includes('x.ai') ||
    event.request.url.includes('alquran.cloud')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests: cache-first, then network, with fallbacks
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached response if found
      if (cached) return cached;

      // Otherwise try network
      return fetch(event.request)
        .then(networkRes => {
          // Cache successful GET responses (excluding chrome-extension and analytics)
          if (
            event.request.method === 'GET' &&
            !event.request.url.startsWith('chrome-extension') &&
            !event.request.url.includes('analytics') &&
            networkRes.ok
          ) {
            const responseToCache = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkRes;
        })
        .catch(() => {
          // Network failed – return fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./islamic.html');
          }
          // For image requests, return logo.png as a fallback
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
            return caches.match('./logo.png');
          }
          // For everything else, a simple offline response
          return new Response('নেটওয়ার্ক সংযোগ নেই', {
            status: 408,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
    })
  );
});
