/**
 * Service Worker de AgendaPro.
 * Proporciona soporte offline para la shell de la aplicación y recursos estáticos.
 */

const CACHE_NAME = 'agendapro-cache-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/logo.png',
  '/apple-touch-icon.png',
]

// Instalación: precachear activos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Error en precache:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activación: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch: estrategia Network-First para navegación y Cache-First para estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Ignorar peticiones que no sean GET (POST, PUT, DELETE a APIs)
  if (request.method !== 'GET') return

  // Ignorar peticiones de extensiones de navegador (chrome-extension://, etc.)
  if (!request.url.startsWith('http')) return

  // Peticiones de navegación (páginas HTML) -> Network First con fallback a caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/')
      })
    )
    return
  }

  // Recursos estáticos (imágenes, fuentes, css, js) -> Cache First con revalidación
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalida la caché si hay conexión
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
            }
          })
          .catch(() => {})
        return cachedResponse
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }

        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })

        return networkResponse
      })
    })
  )
})
