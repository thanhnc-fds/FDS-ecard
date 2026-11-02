import type { Office } from '@/config/company'
import type { CardData } from './card'
import { cardTitle, companyName, officeAddress, STRINGS, type Lang } from './i18n'
import { telegramLink } from './social'

/**
 * Tạo file vCard 3.0 (.vcf) — định dạng được iPhone, Android, Outlook, Gmail hỗ trợ.
 */

/** Escape ký tự đặc biệt theo RFC 2426 */
export function escapeVCardText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/**
 * Gập dòng dài hơn 75 byte (RFC 2425). Cắt theo byte UTF-8 nhưng không cắt
 * giữa một ký tự có dấu (ví dụ "ễ" chiếm 3 byte).
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const parts: string[] = []
  let current = ''
  let currentBytes = 0
  // Dòng đầu tối đa 75 byte, các dòng sau có 1 dấu cách ở đầu → tối đa 74 byte nội dung
  let limit = 75
  for (const char of line) {
    const size = encoder.encode(char).length
    if (currentBytes + size > limit) {
      parts.push(current)
      current = ''
      currentBytes = 0
      limit = 74
    }
    current += char
    currentBytes += size
  }
  if (current) parts.push(current)
  return parts.join('\r\n ')
}

export type VCardOptions = {
  office: Office
  /** URL của danh thiếp, thêm vào để người nhận mở lại được */
  cardUrl?: string
  /** Ngôn ngữ của người lưu: chức danh, địa chỉ, ghi chú theo ngôn ngữ này */
  lang?: Lang
  /** Ảnh đại diện đã tải về, dạng data URL JPEG/PNG (nhúng thẳng vào file) */
  photo?: string | null
}

export function buildVCard(card: CardData, { office, cardUrl, lang = 'vi', photo }: VCardOptions): string {
  const e = escapeVCardText
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    // Tên tiếng Việt: đặt toàn bộ họ tên vào một trường để điện thoại luôn hiển thị
    // đúng thứ tự "Nguyễn Văn A", bất kể cài đặt sắp xếp tên kiểu phương Tây.
    `N:;${e(card.name)};;;`,
    `FN:${e(card.name)}`,
    `ORG:${e(companyName(lang))}`,
    `TITLE:${e(cardTitle(card, lang))}`,
    `TEL;TYPE=CELL,VOICE:${card.phone}`,
    `EMAIL;TYPE=INTERNET,WORK:${e(card.email)}`,
    `ADR;TYPE=WORK:;;${e(officeAddress(office, lang))};;;;${e(STRINGS[lang].country)}`,
  ]
  if (card.website) lines.push(`URL;TYPE=WORK:${e(card.website)}`)
  const telegram = telegramLink(card)
  if (telegram) lines.push(`X-SOCIALPROFILE;TYPE=telegram:${e(telegram)}`)
  if (cardUrl) lines.push(`NOTE:${e(`${STRINGS[lang].digitalCard}: ${cardUrl}`)}`)

  const image = photo?.match(/^data:image\/(jpeg|png);base64,(.+)$/)
  if (image) lines.push(`PHOTO;ENCODING=b;TYPE=${image[1].toUpperCase()}:${image[2]}`)
  lines.push('END:VCARD')

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
