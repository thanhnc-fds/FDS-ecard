import * as z from 'zod/mini'
import { company } from '@/config/company'
import { isEmail, LIMITS, type CardData } from './card'
import { isValidSlug } from './slug'
import { normalizeVnPhone } from './phone'
import { normalizeTelegram, normalizeWebsite } from './social'

/**
 * Phần dành riêng cho TRANG TẠO (form nhập liệu).
 * Tách khỏi card.ts để trang danh thiếp của khách không phải tải phần này.
 */

const required = (message: string) => z.refine<string>((v) => v.trim().length > 0, message)
const optionalValid = (check: (v: string) => boolean, message: string) =>
  z.refine<string>((v) => v.trim() === '' || check(v), message)

export const cardFormSchema = z.object({
  name: z.string().check(required('Vui lòng nhập họ và tên'), z.maxLength(LIMITS.name, `Tối đa ${LIMITS.name} ký tự`)),
  title: z
    .string()
    .check(required('Vui lòng nhập chức danh'), z.maxLength(LIMITS.title, `Tối đa ${LIMITS.title} ký tự`)),
  titleEn: z.string().check(z.maxLength(LIMITS.title, `Tối đa ${LIMITS.title} ký tự`)),
  phone: z.string().check(
    required('Vui lòng nhập số điện thoại'),
    optionalValid((v) => normalizeVnPhone(v) !== null, 'Số điện thoại Việt Nam không hợp lệ'),
  ),
  email: z.string().check(
    required('Vui lòng nhập email'),
    optionalValid((v) => isEmail(v.trim()), 'Email không hợp lệ'),
    z.maxLength(LIMITS.email, `Tối đa ${LIMITS.email} ký tự`),
  ),
  telegram: z
    .string()
    .check(
      optionalValid((v) => normalizeTelegram(v) !== null, 'Username Telegram không hợp lệ (5–32 ký tự: chữ, số, _)'),
    ),
  zalo: z.boolean(),
  /** Bật Telegram; username để trống → mở Telegram theo số điện thoại */
  telegramOn: z.boolean(),
  website: z.string().check(optionalValid((v) => normalizeWebsite(v) !== null, 'Website không hợp lệ')),
  office: z.string(),
  slug: z
    .string()
    .check(
      z.refine(
        isValidSlug,
        'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang (2–50 ký tự, không trùng tên hệ thống)',
      ),
    ),
  avatar: z.string(),
})

export type CardFormValues = z.infer<typeof cardFormSchema>

export const emptyFormValues: CardFormValues = {
  name: '',
  title: '',
  titleEn: '',
  phone: '',
  email: '',
  telegram: '',
  zalo: true,
  telegramOn: true,
  website: company.website,
  office: company.offices[0].id,
  slug: '',
  avatar: '',
}

/**
 * Chuyển giá trị form → dữ liệu danh thiếp.
 * Dùng cả cho bản xem trước khi form chưa hợp lệ: field nào sai thì bỏ trống.
 */
export function formToCard(values: CardFormValues): CardData {
  return {
    slug: values.slug,
    name: values.name.trim().replace(/\s+/g, ' '),
    title: values.title.trim().replace(/\s+/g, ' '),
    titleEn: values.titleEn.trim().replace(/\s+/g, ' ') || undefined,
    phone: normalizeVnPhone(values.phone) ?? '',
    email: isEmail(values.email.trim()) ? values.email.trim().toLowerCase() : '',
    telegram: (values.telegramOn && normalizeTelegram(values.telegram)) || undefined,
    telegramPhone: values.telegramOn && !normalizeTelegram(values.telegram) ? true : undefined,
    zalo: values.zalo,
    website: normalizeWebsite(values.website) ?? undefined,
    office: values.office,
    avatar: values.avatar || undefined,
  }
}

export function cardToForm(card: CardData): CardFormValues {
  return {
    name: card.name,
    title: card.title,
    titleEn: card.titleEn ?? '',
    phone: card.phone,
    email: card.email,
    telegram: card.telegram ? `@${card.telegram}` : '',
    zalo: card.zalo,
    telegramOn: !!card.telegram || !!card.telegramPhone,
    website: card.website ?? '',
    office: card.office,
    slug: card.slug,
    avatar: card.avatar ?? '',
  }
}
