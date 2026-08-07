const CACHE = 'folha-ponto-v2';

// Arquivos essenciais do app (App Shell)
const ARQUIVOS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-152.png',
  '/icons/icon-167.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Bibliotecas externas usadas pelo app (necessárias para exportar Excel/PDF offline)
const ARQUIVOS_EXTERNOS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      // Cacheia o essencial primeiro (se isso falhar, a instalação falha)
      await c.addAll(ARQUIVOS);
      // Cacheia os externos individualmente, sem travar a instalação se algum falhar
      await Promise.all(
        ARQUIVOS_EXTERNOS.map(url =>
          fetch(url, { mode: 'cors' })
            .then(res => res.ok && c.put(url, res))
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(res => {
          // Guarda dinamicamente no cache o que for buscado com sucesso (GET)
          if (e.request.method === 'GET' && res && res.ok) {
            const resClone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, resClone));
          }
          return res;
        })
        .catch(() => {
          // Sem rede e sem cache: se for navegação de página, cai no index.html
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
