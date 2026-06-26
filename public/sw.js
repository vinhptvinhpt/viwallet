const CACHE = 'viwallet-v2'
const OFFLINE_QUEUE = 'offline-queue'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/dashboard', '/transactions', '/offline.html'])
    )
  )
})

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', e => {
  if (e.request.method === 'POST' && e.request.url.includes('/api/transactions')) {
    e.respondWith(
      fetch(e.request.clone()).catch(async () => {
        const body = await e.request.clone().json()
        const db = await openDB()
        await db.add(OFFLINE_QUEUE, { url: e.request.url, body, timestamp: Date.now() })
        return new Response(JSON.stringify({ queued: true }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request)).catch(async () => {
      if (e.request.destination === 'document') {
        const offlinePage = await caches.match('/offline.html')
        if (offlinePage) return offlinePage
      }
      return new Response('Offline', { status: 503 })
    })
  )
})

self.addEventListener('sync', e => {
  if (e.tag === 'sync-transactions') {
    e.waitUntil(syncQueued())
  }
})

async function syncQueued() {
  const db = await openDB()
  const items = await db.getAll(OFFLINE_QUEUE)
  for (const item of items) {
    try {
      await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      })
      await db.delete(OFFLINE_QUEUE, item.id)
    } catch {}
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('viwallet', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
