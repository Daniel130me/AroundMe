const CACHE_NAME = "aroundme-ai-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/manifest.json"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching App Shell and static assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip API calls or Firestore calls so they always go to the network first
  if (requestUrl.pathname.startsWith("/api/") || requestUrl.hostname.includes("firestore") || requestUrl.hostname.includes("firebase")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return a mock offline JSON response for APIs if offline
        return new Response(
          JSON.stringify({
            status: "offline",
            message: "You are currently offline. Showing cached information if available.",
            offline: true
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Cache-first strategy for other static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Don't cache non-GET requests or Google Maps scripts dynamically
        if (event.request.method !== "GET" || requestUrl.hostname.includes("maps.googleapis.com")) {
          return networkResponse;
        }

        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      // Fallback for document requests when offline
      if (event.request.headers.get("accept").includes("text/html")) {
        return caches.match("/index.html");
      }
    })
  );
});
