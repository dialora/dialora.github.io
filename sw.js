const CACHE_NAME = 'dialora';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css', // Если есть
  './app.js',    // Ваш главный скрипт
  './logo.png',
  './marked.min.js'
];

// 1. Установка: кэшируем статику (оболочку приложения)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Активация: чистим старый кэш, если обновили версию
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// 3. Перехват запросов: сначала ищем в кэше, если нет — идем в сеть
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
