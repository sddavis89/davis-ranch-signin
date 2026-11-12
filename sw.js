/* Davis Hunting Co. — keeps a copy of the app on the phone so it opens with no signal.
   The app page is always fetched fresh when there is signal (no stale versions); the saved copy is only used when there isn't. */
var CACHE = 'dhc-app-v1';
var CORE = ['davis-ranch-ops.html', 'manifest.json', 'img/icon-192.png', 'img/icon-512.png', 'img/hero-s.webp', 'img/lodge-s.webp', 'img/release-s.webp', 'img/harvest-s.webp', 'img/cleaning-s.webp', 'img/dogs-s.webp'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // the ranch sheet and the weather always go to the network
  if (req.mode === 'navigate' || /\.html$/.test(url.pathname)) {
    // the app page: newest from the network, the saved copy only when there's no signal
    e.respondWith(fetch(req, { cache: 'no-store' }).then(function (r) {
      if (r && r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(url.pathname.split('/').pop() || 'davis-ranch-ops.html', cp); }); }
      return r;
    }).catch(function () { return caches.match(url.pathname.split('/').pop() || 'davis-ranch-ops.html').then(function (m) { return m || caches.match('davis-ranch-ops.html'); }); }));
    return;
  }
  // pictures and icons: the saved copy right away, refreshed in the background
  e.respondWith(caches.match(req).then(function (m) {
    var net = fetch(req).then(function (r) { if (r && r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); } return r; }).catch(function () { return m; });
    return m || net;
  }));
});
