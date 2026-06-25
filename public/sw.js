const CACHE = 'viwallet-v1'
const OFFLINE_QUEUE = 'offline-queue'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(['/', '/dashboard', '/transactions'])
    )
  )
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
    caches.match(e.request).then(cached => cached || fetch(e.request))
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
