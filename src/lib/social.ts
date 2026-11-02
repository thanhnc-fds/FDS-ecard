/** Username Telegram: 5–32 ký tự, chữ/số/gạch dưới, bắt đầu bằng chữ */
const TELEGRAM_USERNAME = /^[a-zA-Z][a-zA-Z0-9_]{3,30}[a-zA-Z0-9]$/

/** Nhận "@user", "user", "t.me/user", "https://t.me/user" → "user" ; không hợp lệ → null */
export function normalizeTelegram(input: string): string | null {
  const value = input
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
  return TELEGRAM_USERNAME.test(value) ? value : null
}

export function telegramUrl(username: string): string {
  return `https://t.me/${username}`
}

/**
 * Link mở Telegram của nhân viên: có username → mở đúng tài khoản;
 * không có → mở theo số điện thoại (t.me/+84…, cần người đó cho phép tìm bằng SĐT — mặc định là cho phép).
 * Trên điện thoại, t.me mở thẳng app Telegram.
 */
export function telegramLink(card: { telegram?: string; telegramPhone?: boolean; phone: string }): string | null {
  if (card.telegram) return telegramUrl(card.telegram)
  if (card.telegramPhone && card.phone) return `https://t.me/${card.phone}`
  return null
}

/** Zalo dùng số điện thoại dạng 0xxxxxxxxx */
export function zaloUrl(nationalPhone: string): string {
  return `https://zalo.me/${nationalPhone}`
}

/**
 * Chuẩn hoá website: tự thêm https://, chỉ chấp nhận http/https
 * (chặn các link nguy hiểm như "javascript:...").
 */
export function normalizeWebsite(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!url.hostname.includes('.')) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

/** "https://www.fadosolution.com/abc" → "fadosolution.com/abc" (để hiển thị) */
export function displayWebsite(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}
