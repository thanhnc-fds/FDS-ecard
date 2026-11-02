/**
 * Service worker — cho phép mở danh thiếp khi KHÔNG có mạng.
 * File này là khuôn mẫu: lúc build, vite.config.ts điền danh sách file cần lưu sẵn
 * và mã phiên bản rồi xuất ra dist/sw.js. Chỉ chạy trên bản build (không chạy khi dev).
 *
 * Chiến lược:
 *  - Trang (điều hướng):  mạng trước, mạng chậm/mất → bản đã lưu
 *  - /cards/*.json:       mạng trước (luôn lấy thông tin mới nhất), mất mạng → bản đã lưu
 *  - /assets/* (có hash): lưu sẵn, dùng bản lưu (file có hash không bao giờ đổi nội dung)
 *  - File khác (logo…):   dùng bản lưu ngay, đồng thời cập nhật ngầm
 *  - Ảnh từ web khác (avatar Google Drive): dùng bản lưu ngay, cập nhật ngầm, giữ tối đa MAX_IMAGES ảnh
 */

const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__

const STATIC_CACHE = `fds-static-${VERSION}`
/** Dữ liệu danh thiếp giữ qua các phiên bản */
const CARDS_CACHE = 'fds-cards'
/** Mạng chậm hơn mức này thì dùng bản đã lưu (sóng yếu ở kho, cảng…) */
const NETWORK_TIMEOUT_MS = 3500
/** Ảnh đại diện từ web khác (Drive) — giữ qua các phiên bản */
const IMAGES_CACHE = 'fds-images'
const MAX_IMAGES = 30

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('fds-static-') && k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    if (request.destination === 'image' && url.protocol === 'https:') event.respondWith(crossOriginImage(request))
    return
  }

  if (request.mode === 'navigate') {
    // Mọi trang đều là index.html (ứng dụng 1 trang)
    event.respondWith(networkFirst(request, STATIC_CACHE, '/index.html'))
  } else if (url.pathname.startsWith('/cards/')) {
    event.respondWith(networkFirst(request, CARDS_CACHE, url.pathname, isJson))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

function isJson(response) {
  return (response.headers.get('content-type') || '').includes('json')
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function networkFirst(request, cacheName, cacheKey, shouldCache = () => true) {
  const cache = await caches.open(cacheName)
  const network = fetch(request).then(async (response) => {
    if (response.ok && shouldCache(response)) await cache.put(cacheKey, response.clone())
    return response
  })
  try {
    return await withTimeout(network, NETWORK_TIMEOUT_MS)
  } catch {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
    return network // không có bản lưu → đợi mạng (hoặc báo lỗi)
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(STATIC_CACHE)
        await cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)
  return cached || network
}

/**
 * Ảnh web khác: <img> không dùng CORS nên phản hồi là "opaque" (không đọc được trạng thái),
 * vẫn lưu được và hiển thị được. Ảnh lỗi thật (403 khi chưa bật chia sẻ) cũng opaque,
 * nhưng card đã có chữ viết tắt thay thế nên không sao.
 */
async function crossOriginImage(request) {
  const cache = await caches.open(IMAGES_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok || response.type === 'opaque') {
        await cache.put(request, response.clone())
        const keys = await cache.keys()
        await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_IMAGES)).map((k) => cache.delete(k)))
      }
      return response
    })
    .catch(() => cached || Response.error())
  return cached || network
}
