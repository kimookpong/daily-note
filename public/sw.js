// No-op service worker for development.
// Overwritten by next-pwa (Workbox) during `next build`.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()))
self.addEventListener("fetch", () => {})
