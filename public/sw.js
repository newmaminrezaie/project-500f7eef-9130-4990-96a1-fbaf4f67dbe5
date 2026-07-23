// Minimal service worker: enables PWA install prompt on Android + network-first
// fallback so the shell keeps working when connectivity blips.
// Intentionally simple — no aggressive precaching, so future deploys (new HTML
// and hashed assets) are picked up automatically on the next visit.

const CACHE = "rezaie-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache server functions / API — always hit network.
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache successful static asset responses for offline fallback.
        if (res && res.ok && (url.pathname.startsWith("/assets/") || url.pathname === "/saffron-rezaie-logo.png" || url.pathname === "/manifest.webmanifest")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
  );
});
