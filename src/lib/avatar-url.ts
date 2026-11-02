/**
 * Ảnh đại diện dạng LINK (thay vì nhúng cả ảnh vào dữ liệu).
 * Nhờ vậy link trực tiếp cũng có ảnh mà không bị dài.
 *
 * Google Drive: link chia sẻ (drive.google.com/file/d/<id>/view) là trang xem file,
 * không nhúng được. Đổi sang lh3.googleusercontent.com/d/<id>=<tuỳ chọn>, nơi Google trả
 * thẳng ảnh và cho phép đọc từ web khác (CORS) để đưa ảnh vào file danh bạ.
 *   s320  → cạnh dài 320px (đủ nét cho avatar trên màn hình 3x)
 *   -c    → cắt vuông ở giữa
 *   -rj   → trả JPEG (~20KB thay vì PNG ~120KB)
 */

const DRIVE_ID = /^[\w-]{20,100}$/
const DRIVE_OPTIONS = 's320-c-rj'
const DRIVE_PREFIX = 'https://lh3.googleusercontent.com/d/'

/** Các dạng link Drive hay gặp → lấy mã file */
const DRIVE_LINK_PATTERNS = [
  /^https?:\/\/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([\w-]+)/,
  /^https?:\/\/(?:drive|docs)\.google\.com\/(?:open|uc|thumbnail)\?(?:[^#]*&)?id=([\w-]+)/,
  /^https?:\/\/lh3\.googleusercontent\.com\/d\/([\w-]+)/,
]

const URL_MAX_LENGTH = 500

export type AvatarLinkResult = { ok: true; url: string } | { ok: false; reason: 'folder' | 'notImage' | 'invalid' }

export function driveImageUrl(id: string): string {
  return `${DRIVE_PREFIX}${id}=${DRIVE_OPTIONS}`
}

/** Mã file Drive nếu `url` là link ảnh Drive chuẩn (do driveImageUrl tạo) */
export function getDriveId(url: string): string | null {
  if (!url.startsWith(DRIVE_PREFIX) || !url.endsWith(`=${DRIVE_OPTIONS}`)) return null
  const id = url.slice(DRIVE_PREFIX.length, -DRIVE_OPTIONS.length - 1)
  return DRIVE_ID.test(id) ? id : null
}

/** Chuẩn hoá link ảnh người dùng dán vào: Drive → link ảnh trực tiếp, link khác → phải là https */
export function parseAvatarLink(input: string): AvatarLinkResult {
  const text = input.trim()
  for (const pattern of DRIVE_LINK_PATTERNS) {
    const id = text.match(pattern)?.[1]
    if (id && DRIVE_ID.test(id)) return { ok: true, url: driveImageUrl(id) }
  }
  if (/^https?:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//.test(text)) return { ok: false, reason: 'folder' }
  if (/^https?:\/\/docs\.google\.com\/(?:document|spreadsheets|presentation)\//.test(text)) {
    return { ok: false, reason: 'notImage' }
  }

  if (text.length > URL_MAX_LENGTH || /\s/.test(text)) return { ok: false, reason: 'invalid' }
  try {
    const url = new URL(text)
    if (url.protocol !== 'https:' || url.username || url.password) return { ok: false, reason: 'invalid' }
    return { ok: true, url: url.href }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}

/** Thử tải ảnh trong trình duyệt: dùng để báo ngay cho người dùng link có hiện được ảnh không */
export function probeImage(src: string, timeoutMs = 12_000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    const timer = setTimeout(() => done(false), timeoutMs)
    function done(ok: boolean) {
      clearTimeout(timer)
      img.onload = img.onerror = null
      resolve(ok)
    }
    img.onload = () => done(img.naturalWidth > 0)
    img.onerror = () => done(false)
    img.src = src
  })
}

/**
 * Tải ảnh từ link về thành data URL (để nhúng vào file danh bạ .vcf).
 * Chỉ được khi nơi chứa ảnh cho phép (CORS) — Google Drive có. Không được thì trả null.
 */
export async function fetchImageAsDataUrl(src: string, timeoutMs = 6000): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(src, { signal: controller.signal, referrerPolicy: 'no-referrer' })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !/^image\/(jpeg|png)/.test(type)) return null
    const blob = await response.blob()
    if (blob.size > 200_000) return null
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
