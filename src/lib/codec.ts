import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { company } from '@/config/company'
import { parseCardData, type CardData } from './card'
import { toNationalPhone } from './phone'
import { driveImageUrl, getDriveId } from './avatar-url'

/**
 * Mã hoá danh thiếp vào URL (link trực tiếp).
 * - Dùng key ngắn để link gọn hơn
 * - Bỏ các giá trị trùng mặc định (website, văn phòng của công ty)
 * - Ảnh đại diện Google Drive: chỉ lưu mã file (~33 ký tự)
 */

const VERSION = 1

type Compact = {
  v: number
  n: string
  t: string
  /** Chức danh tiếng Anh */
  te?: string
  p: string
  e: string
  g?: string
  /** Telegram theo số điện thoại */
  gp?: 1
  z?: 1
  /** Không có key → website công ty; chuỗi rỗng → không có website */
  w?: string
  o?: string
  /** Ảnh: mã file Google Drive, hoặc link https đầy đủ */
  a?: string
}

export function encodeCard(card: CardData): string {
  const compact: Compact = {
    v: VERSION,
    n: card.name,
    t: card.title,
    p: toNationalPhone(card.phone),
    e: card.email,
  }
  if (card.titleEn) compact.te = card.titleEn
  if (card.telegram) compact.g = card.telegram
  else if (card.telegramPhone) compact.gp = 1
  if (card.zalo) compact.z = 1
  if (!card.website) compact.w = ''
  else if (card.website !== company.website) compact.w = card.website
  if (card.office !== company.offices[0].id) compact.o = card.office
  if (card.avatar) compact.a = getDriveId(card.avatar) ?? card.avatar
  return compressToEncodedURIComponent(JSON.stringify(compact))
}

export function decodeCard(encoded: string): CardData | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const c = JSON.parse(json) as Partial<Compact> | null
    if (!c || typeof c !== 'object' || c.v !== VERSION) return null
    return parseCardData({
      name: c.n,
      title: c.t,
      titleEn: c.te,
      phone: c.p,
      email: c.e,
      telegram: c.g,
      telegramPhone: c.gp === 1,
      zalo: c.z === 1,
      website: c.w === undefined ? company.website : c.w,
      office: c.o,
      avatar: typeof c.a === 'string' ? (c.a.startsWith('https://') ? c.a : driveImageUrl(c.a)) : undefined,
    })
  } catch {
    return null
  }
}
