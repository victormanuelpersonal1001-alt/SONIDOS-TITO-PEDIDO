/* Service worker: recibe la factura compartida desde WhatsApp y guarda la app para abrir rápido */
const SCOPE = self.registration.scope;
const SHARE_URL = new URL("compartir", SCOPE).href;
const SHARE_KEY = new URL("factura-compartida", SCOPE).href;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = req.url.split("?")[0];

  if (req.method === "POST" && url === SHARE_URL){
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const f = fd.getAll("factura").find(x => x && x.size);
        const cache = await caches.open("compartido");
        if (f){
          await cache.put(SHARE_KEY, new Response(f, {headers: {
            "Content-Type": f.type || "application/pdf",
            "X-Nombre": encodeURIComponent(f.name || "factura.pdf")
          }}));
        }
      } catch (err) { /* la página mostrará que no llegó el archivo */ }
      return Response.redirect(new URL("./?compartido=1", SCOPE).href, 303);
    })());
    return;
  }

  // Páginas: primero la red; si no hay conexión, la última copia guardada
  if (req.mode === "navigate"){
    e.respondWith(fetch(req).then(res => {
      const copia = res.clone();
      caches.open("app").then(c => c.put(new URL("./", SCOPE).href, copia));
      return res;
    }).catch(() => caches.match(new URL("./", SCOPE).href)));
  }
});
