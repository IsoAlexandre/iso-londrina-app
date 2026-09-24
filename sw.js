// Bump this string on every deploy that changes any precached file — the only
// manual step needed since this project has no build tooling.
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'iso-londrina-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './fonts/Inter-Variable.woff2',
  './fonts/Fraunces-Variable.woff2',
  './js/main.js',
  './js/vendor/jspdf.umd.min.js',
  './js/modules/db.js',
  './js/modules/state.js',
  './js/modules/data.js',
  './js/modules/validate.js',
  './js/modules/ui.js',
  './js/modules/nav.js',
  './js/modules/pricing.js',
  './js/modules/render-content.js',
  './js/modules/render-budget.js',
  './js/modules/session.js',
  './js/modules/proposal.js',
  './js/modules/pdf.js',
  './js/modules/share.js',
  './js/modules/editmode.js',
  './data/default-data.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  // Deliberately no skipWaiting() here — an update shouldn't swap the app
  // shell out from under an in-progress sales presentation. main.js prompts
  // the user and posts SKIP_WAITING only after they choose to update.
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
