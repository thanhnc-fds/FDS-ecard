import * as z from 'zod/mini'
import { company } from '@/config/company'
import { isValidSlug } from './slug'
import { normalizeVnPhone } from './phone'
import { normalizeTelegram, normalizeWebsite } from './social'
import { parseAvatarLink } from './avatar-url'

/** Dữ liệu chuẩn của một danh thiếp (đã chuẩn hoá, an toàn để hiển thị) */
export type CardData = {
  /** Mã link rút gọn, ví dụ "nguyen-van-a" */
  slug: string
  name: string
  title: string
  /** Chức danh tiếng Anh (không bắt buộc) — hiện khi người xem dùng tiếng Anh */
  titleEn?: string
  /** Dạng quốc tế: +84909123456 */
  phone: string
  email: string
  /** Username Telegram, không có @ */
  telegram?: string
  /** Có Telegram nhưng không có username → mở Telegram theo số điện thoại */
  telegramPhone?: boolean
  /** Số điện thoại có dùng Zalo */
  zalo: boolean
  website?: string
  /** Mã văn phòng trong config công ty */
  office: string
  /** Ảnh đại diện: link ảnh https (Google Drive, đã chuẩn hoá) */
  avatar?: string
}

export const LIMITS = { name: 60, title: 80, email: 100 } as const

export const isEmail = (v: string) => z.email().safeParse(v).success

/* ------------------------------------------------------------------ */
/* Kiểm tra dữ liệu từ NGUỒN NGOÀI (link trực tiếp, file JSON)         */
/* Không tin dữ liệu đầu vào: kiểm tra và chuẩn hoá lại toàn bộ.       */
/* ------------------------------------------------------------------ */

const storedCardSchema = z.object({
  slug: z.optional(z.string()),
  name: z.string().check(z.minLength(1), z.maxLength(LIMITS.name)),
  title: z.string().check(z.minLength(1), z.maxLength(LIMITS.title)),
  titleEn: z.optional(z.string().check(z.maxLength(LIMITS.title))),
  phone: z.string(),
  email: z.string().check(z.maxLength(LIMITS.email)),
  telegram: z.optional(z.string()),
  telegramPhone: z.optional(z.boolean()),
  zalo: z.optional(z.boolean()),
  website: z.optional(z.string()),
  office: z.optional(z.string()),
  avatar: z.optional(z.string()),
})

export function parseCardData(input: unknown): CardData | null {
  const result = storedCardSchema.safeParse(input)
  if (!result.success) return null
  const d = result.data

  const name = d.name.trim()
  const title = d.title.trim()
  const phone = normalizeVnPhone(d.phone)
  const email = d.email.trim().toLowerCase()
  if (!name || !title || !phone || !isEmail(email)) return null

  const office = company.offices.find((o) => o.id === d.office)?.id ?? company.offices[0].id
  const avatarLink = d.avatar ? parseAvatarLink(d.avatar) : null
  const telegram = (d.telegram && normalizeTelegram(d.telegram)) || undefined

  return {
    slug: d.slug && isValidSlug(d.slug) ? d.slug : '',
    name,
    title,
    titleEn: d.titleEn?.trim() || undefined,
    phone,
    email,
    telegram,
    telegramPhone: !telegram && d.telegramPhone === true ? true : undefined,
    zalo: d.zalo ?? false,
    website: (d.website && normalizeWebsite(d.website)) || undefined,
    office,
    avatar: avatarLink?.ok ? avatarLink.url : undefined,
  }
}

/** Chữ cái viết tắt cho ảnh đại diện mặc định: "Nguyễn Văn An" → "NA" */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Dữ liệu ghi ra file JSON cho link rút gọn (thứ tự key dễ đọc cho admin) */
export function toCardFile(card: CardData): CardData {
  const { slug, name, title, titleEn, phone, email, telegram, telegramPhone, zalo, website, office, avatar } = card
  return { slug, name, title, titleEn, phone, email, telegram, telegramPhone, zalo, website, office, avatar }
}
