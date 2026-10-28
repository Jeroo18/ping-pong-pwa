// La raíz antes era la Mini Arcade, que se instalaba como app con su propio service worker.
// Este archivo lo reemplaza: borra su caché y se desregistra para que el portafolio
// siempre se cargue desde la red.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => /^mini-arcade-v\d+$/.test(k)).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
