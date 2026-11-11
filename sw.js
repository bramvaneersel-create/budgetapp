/* Service worker: bewaart de app-bestanden op het toestel zodat de app volledig offline werkt.
   Er worden nooit gegevens verstuurd; alleen de eigen app-bestanden worden uit de cache geladen. */
const VERSION = 'jaarbudget-v11';
const FILES = ['./', './index.html', './app.js', './app.css', './manifest.webmanifest', './icon-ring-180.png', './icon-ring-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
