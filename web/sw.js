/**
 * Inthawnna — Service Worker & Web Share Target Controller
 * Handles offline PWA caching & system share drawer incoming files
 */

const CACHE_NAME = 'inthawnna-pwa-v3.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './favicon.ico',
  './icon.png',
  './libs/peerjs.min.js',
  './libs/qrcode.min.js',
  './libs/jszip.min.js'
];

// Open / Upgrade IndexedDB for incoming shares
function openShareDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('inthawnna_share_store', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('incoming_shares')) {
        db.createObjectStore('incoming_shares', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Store shared files & text safely in IndexedDB
async function saveSharePayload(payload) {
  const db = await openShareDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('incoming_shares', 'readwrite');
    const store = tx.objectStore('incoming_shares');

    const serializedFiles = (payload.files || []).map((file, idx) => ({
      blob: file,
      name: file.name || `shared_file_${Date.now()}_${idx}`,
      type: file.type || 'application/octet-stream',
      size: file.size || 0,
      lastModified: file.lastModified || Date.now()
    }));

    store.add({
      files: serializedFiles,
      title: payload.title || '',
      text: payload.text || '',
      url: payload.url || '',
      timestamp: Date.now()
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 1. Service Worker Install — Precache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to precache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Service Worker Activate — Clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event — Intercept Web Share Target POST & Serve Cached Shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Intercept Web Share Target POST request from Android
  if (event.request.method === 'POST' && url.pathname.includes('share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll('files') || [];
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const sharedUrl = formData.get('url') || '';

        // Persist files and shared metadata into IndexedDB
        await saveSharePayload({ files, title, text, url: sharedUrl });

        // Notify any already open client window immediately
        const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windowClients) {
          client.postMessage({ type: 'PENDING_SHARED_FILES_READY' });
        }

        // Redirect browser to main portal with indicator query param
        return Response.redirect('./?shared=true', 303);
      } catch (err) {
        console.error('[SW] Failed to handle share target payload:', err);
        return Response.redirect('./?error=share_failed', 303);
      }
    })());
    return;
  }

  // B. Skip non-GET requests or external third-party requests (e.g. STUN, TURN, IP lookups)
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // C. Offline Caching Strategy: Network First, Fallback to Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, update cache in background
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline (e.g. phone hotspot with 0 data, airplane mode), serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If seeking an HTML page, fallback to cached index.html
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html') || caches.match('./');
          }
          return new Response('Network error (Offline)', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
