const CACHE_NAME = "biofabricas-v1";

const urlsToCache = [
  "./",
  "./index.html",
  "./css/index.css",
  "./js/map.js",
  "./js/data.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});