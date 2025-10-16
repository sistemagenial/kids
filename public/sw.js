
// ✅ CORREÇÃO: Service Worker otimizado - removendo recursos problemáticos
const CACHE_NAME = 'kids-app-v4';

// ✅ CORREÇÃO: Cache apenas recursos que realmente existem
const urlsToCache = [
  // Removido '/' e '/index.html' que estavam causando falhas
  // O cache será feito dinamicamente conforme necessário
];

// Install - ✅ CORREÇÃO: Instalação sem cache inicial problemático
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // ✅ CORREÇÃO: Não tenta cachear recursos na instalação
        // Evita erros de "Request failed"
        return Promise.resolve();
      })
      .then(() => {
        console.log('Service Worker instalado com sucesso');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Erro na instalação do SW:', err);
      })
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker ativado com sucesso');
      return self.clients.claim();
    })
  );
});

// Fetch - ✅ CORREÇÃO: Estratégia mais robusta sem cache problemático
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ✅ CORREÇÃO: Ignorar requisições que podem causar problemas
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:' ||
      event.request.method !== 'GET') {
    return;
  }
  
  // ✅ CORREÇÃO: Network First para APIs - sem fallback problemático
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('/login') ||
      url.pathname.includes('/admin') ||
      url.search.includes('action=')) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Sempre retornar a resposta da rede para APIs
          return response;
        })
        .catch(error => {
          // Em caso de erro de rede, retornar erro específico
          console.error('Erro de rede na API:', error);
          return new Response(
            JSON.stringify({ error: 'Erro de conexão com o servidor' }), 
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // ✅ CORREÇÃO: Para outros recursos, tentar rede primeiro
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for bem-sucedida, cachear e retornar
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.warn('Erro ao cachear:', err);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Em caso de erro, tentar cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // ✅ CORREÇÃO: Para documentos, retornar página de erro offline
            if (event.request.destination === 'document') {
              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <title>Offline</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h1>Você está offline</h1>
                  <p>Verifique sua conexão com a internet e tente novamente.</p>
                  <button onclick="window.location.reload()">Tentar Novamente</button>
                </body>
                </html>`,
                { 
                  status: 200,
                  headers: { 'Content-Type': 'text/html' }
                }
              );
            }
            
            // Para outros recursos, retornar erro
            return new Response('Recurso não disponível offline', { status: 503 });
          });
      })
  );
});

// ✅ CORREÇÃO: Limpar cache quando necessário
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('Cache limpo com sucesso');
      event.ports[0].postMessage({ success: true });
    });
  }
});
