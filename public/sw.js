const CACHE_NAME = 'lingine-app-shell-v3';
const APP_SHELL = ['/manifest.json'];
const STATIC_DESTINATIONS = new Set([
  'font',
  'image',
  'manifest',
  'script',
  'style',
  'worker',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((key) => key !== CACHE_NAME))
      .then((staleKeys) =>
        Promise.all(staleKeys.map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isSameOriginRequest(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isApiRequest(requestUrl) {
  return (
    isSameOriginRequest(requestUrl) && requestUrl.pathname.startsWith('/api/')
  );
}

function isStaticAssetRequest(request, requestUrl) {
  if (!isSameOriginRequest(requestUrl)) {
    return false;
  }

  return (
    STATIC_DESTINATIONS.has(request.destination) ||
    requestUrl.pathname.startsWith('/_next/static/') ||
    requestUrl.pathname.startsWith('/icons/')
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (isApiRequest(requestUrl)) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response.ok) {
            return response;
          }

          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  if (isStaticAssetRequest(event.request, requestUrl)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          if (!response.ok) {
            return response;
          }

          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
