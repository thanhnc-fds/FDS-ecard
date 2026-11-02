import { company } from '@/config/company'
import type { CardData } from './card'
import { encodeCard } from './codec'

export function siteOrigin(): string {
  return (company.siteUrl || window.location.origin).replace(/\/+$/, '')
}

/** Link rút gọn: https://.../nguyen-van-a */
export function shortLink(slug: string): string {
  return `${siteOrigin()}/${slug}`
}

/** Link trực tiếp: https://.../card#<dữ liệu nén> */
export function directLink(card: CardData): string {
  return `${siteOrigin()}/card#${encodeCard(card)}`
}
