// MauzoChap PWA Service Worker
const CACHE_NAME = "mauzochap-v1";
const OFFLINE_URL = "/";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
];

// ─── Install: pre-cache core shell assets ─────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// ─── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: Network-first, fallback to cache ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Skip non-GET and non-http(s) requests
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  // Skip Supabase / third-party API calls — always go to network
  const url = new URL(event.request.url);
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.io") ||
    url.hostname.includes("api.qrserver.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache a copy of successful navigations
        if (networkResponse.ok && event.request.mode === "navigate") {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed — return cached version or offline page
        return caches.match(event.request).then(
          (cached) => cached || caches.match(OFFLINE_URL)
        );
      })
  );
});
