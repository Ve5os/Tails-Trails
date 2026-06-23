const CACHE_NAME = 'tails-trails-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/walks.js',
  '/js/feed.js',
  '/js/map.js',
  '/js/profile.js',
  '/js/utils.js',
  '/images/logo.svg'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэширование файлов');
        return cache.addAll(ASSETS);
      })
      .catch(err => console.error('Ошибка кэширования:', err))
  );
  self.skipWaiting();
});

// Активация и очистка старого кэша
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Если есть в кэше - отдаем, иначе грузим с сервера
        if (cached) {
          return cached;
        }
        
        // Для запросов к API (если они появятся) - не кэшируем
        if (event.request.url.includes('/api/')) {
          return fetch(event.request);
        }
        
        return fetch(event.request)
          .then(response => {
            // Не кэшируем ошибки и сторонние ресурсы
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Если нет сети и нет кэша - показываем страницу офлайн
            return caches.match('/offline.html');
          });
      })
  );
});