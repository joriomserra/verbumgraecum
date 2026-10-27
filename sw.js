// Service worker do Verbum Graecum: permite instalar o site como aplicativo e lê-lo sem internet.
// Página: rede primeiro (as atualizações chegam logo) e cópia guardada quando não há conexão.
// Livros (data/*.js?v=…): guardados na primeira leitura; cada versão nova substitui a anterior.
const VERSAO = '285060bf20';
const CACHE = 'vg-' + VERSAO;
const BASE = ['./', 'fonts.js', 'pwa.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    const atual = await caches.open(CACHE);
    for (const n of nomes) {
      if (n === CACHE || !n.startsWith('vg-')) continue;
      // Leva para o cache novo os livros já baixados (as versões que ainda valem são conferidas pela página).
      const velho = await caches.open(n);
      for (const req of await velho.keys()) {
        if (new URL(req.url).pathname.includes('/data/')) {
          const r = await velho.match(req);
          if (r) await atual.put(req, r);
        }
      }
      await caches.delete(n);
    }
    await self.clients.claim();
  })());
});

async function guardarLivro(req, resp) {
  const c = await caches.open(CACHE);
  const caminho = new URL(req.url).pathname;
  for (const k of await c.keys()) {
    if (new URL(k.url).pathname === caminho && k.url !== req.url) await c.delete(k);
  }
  await c.put(req, resp);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(CACHE);
        if (r.ok && !r.redirected) c.put('./', r.clone());
        return r;
      } catch (err) {
        return (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.includes('/data/')) {
    e.respondWith((async () => {
      const guardado = await caches.match(req);
      if (guardado) return guardado;
      const r = await fetch(req);
      if (r.ok) e.waitUntil(guardarLivro(req, r.clone()));
      return r;
    })());
    return;
  }

  // Demais arquivos (imagens, fontes, ícones): cópia guardada na hora e atualização em segundo plano.
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const guardado = await c.match(req);
    const rede = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    if (guardado) { e.waitUntil(rede); return guardado; }
    return (await rede) || Response.error();
  })());
});
