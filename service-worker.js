const CACHE_NAME = 'dnd-sheet-cache-v29-visualpolish';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './dm.html',
  './dm-manifest.json',
  './icons-dm/icon-192.png',
  './icons-dm/icon-512.png',
  './icons-dm/icon-maskable-512.png',
  './icons-dm/apple-touch-icon.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

// Network-first strategy: always tries to fetch the latest version from the
// hosted site first (so updates show up as soon as you're online), and only
// falls back to the cached copy when there is no connection.
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(function(response){
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function(cache){
        cache.put(event.request, copy);
      });
      return response;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        if (cached) return cached;
        if (event.request.mode === 'navigate'){
          if (event.request.url.indexOf('dm.html') !== -1) return caches.match('./dm.html');
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Lets the page force this worker to take over immediately after an update.
self.addEventListener('message', function(event){
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
