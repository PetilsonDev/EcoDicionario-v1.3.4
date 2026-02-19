
/**
 * EcoDicionário PWA Service Worker
 * Versão: 1.3.3
 */

const CACHE_NAME = 'ecodicionario-v1.3.3';

// Assets que devem ser guardados imediatamente para funcionamento offline
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './metadata.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap',
  'https://raw.githubusercontent.com/Petilson-Seculo/eco-dicionario-angola/refs/heads/main/background-loader.png',
  'https://raw.githubusercontent.com/Petilson-Seculo/eco-dicionario-angola/main/Logo-Sus-TECH.png',
  'https://raw.githubusercontent.com/Petilson-Seculo/eco-dicionario-angola/main/EcoDicionario-logo.png'
];

// Instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Instalando nova versão e precacheando assets...');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Não forçamos o skipWaiting imediatamente para não quebrar a sessão do utilizador
});

// Ativação: Limpeza de caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceção de Pedidos (Fetch)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Estratégia Network-First para metadados e API (Dados Críticos)
  if (url.pathname.includes('metadata.json') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedRes = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Estratégia Stale-While-Revalidate para o resto (Assets, Fontes, Imagens)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Apenas cacheamos respostas válidas
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Se offline e sem cache, falha silenciosamente ou retorna erro genérico
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Comunicação com a UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
