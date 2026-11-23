const CACHE_NAME = 'pokerrunde-v14';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const networkFirst = req.mode === 'navigate' || /\/(index\.html|manifest\.json)?$/.test(url.pathname) || url.pathname.endsWith('.json') || url.pathname.endsWith('.html');
  if (networkFirst) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    })));
  }
});
