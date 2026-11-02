import { useCallback, useEffect, useState } from 'react'
import { company, type Office } from '@/config/company'
import type { CardData } from './card'

/**
 * Song ngữ cho phần KHÁCH XEM (danh thiếp, trang lỗi).
 * Trang tạo dành cho nhân viên nên chỉ dùng tiếng Việt.
 */

export type Lang = 'vi' | 'en'

const STORAGE_KEY = 'fds-ecard:lang'

export const STRINGS = {
  vi: {
    saveContact: 'Lưu danh bạ',
    enlargeQr: 'Phóng to mã QR',
    scanToSave: 'Quét để lưu danh thiếp',
    digitalCard: 'Danh thiếp điện tử',
    verified: `Nhân viên ${company.shortName} đã xác minh`,
    cardOf: (name: string) => `Danh thiếp của ${name}`,
    namePlaceholder: 'Họ và tên',
    titlePlaceholder: 'Chức danh',
    phone: 'Điện thoại',
    inAppHint: 'Không lưu được? Bấm ⋯ ở góc màn hình → “Mở bằng trình duyệt” rồi bấm Lưu danh bạ lại.',
    country: 'Việt Nam',
    loading: 'Đang tải',
    invalidTitle: 'Link danh thiếp không hợp lệ',
    invalidDesc:
      'Link có thể đã bị cắt mất một phần khi gửi qua tin nhắn. Hãy nhờ người gửi chia sẻ lại link hoặc mã QR.',
    notFoundTitle: 'Không tìm thấy danh thiếp',
    notFoundDesc: 'Danh thiếp này không tồn tại hoặc đã được gỡ. Vui lòng kiểm tra lại đường dẫn.',
    errorTitle: 'Không tải được danh thiếp',
    errorDesc: 'Đã có lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.',
    pageNotFoundTitle: 'Không tìm thấy trang',
    pageNotFoundDesc: 'Đường dẫn không tồn tại. Vui lòng kiểm tra lại.',
    retry: 'Thử lại',
    visitWebsite: `Truy cập website ${company.shortName}`,
  },
  en: {
    saveContact: 'Save contact',
    enlargeQr: 'Enlarge QR code',
    scanToSave: 'Scan to save contact',
    digitalCard: 'Digital business card',
    verified: `Verified ${company.shortName} employee`,
    cardOf: (name: string) => `Business card of ${name}`,
    namePlaceholder: 'Full name',
    titlePlaceholder: 'Job title',
    phone: 'Phone',
    inAppHint: 'Not saved? Tap ⋯ in the corner → “Open in browser”, then tap Save contact again.',
    country: 'Vietnam',
    loading: 'Loading',
    invalidTitle: 'Invalid business card link',
    invalidDesc:
      'The link may have been cut off when shared. Please ask the sender to share the link or QR code again.',
    notFoundTitle: 'Business card not found',
    notFoundDesc: 'This business card does not exist or has been removed. Please check the link.',
    errorTitle: 'Could not load business card',
    errorDesc: 'Something went wrong while loading. Please check your connection and try again.',
    pageNotFoundTitle: 'Page not found',
    pageNotFoundDesc: 'This page does not exist. Please check the link.',
    retry: 'Try again',
    visitWebsite: `Visit ${company.shortName} website`,
  },
} satisfies Record<Lang, unknown>

export type Strings = (typeof STRINGS)['vi']

/**
 * Chọn ngôn ngữ: ?lang=en trên link → lựa chọn trước đó của người xem → ngôn ngữ điện thoại.
 * Điện thoại cài tiếng Việt → tiếng Việt, còn lại → tiếng Anh.
 */
export function detectLang(): Lang {
  try {
    const param = new URLSearchParams(window.location.search).get('lang')
    if (param === 'vi' || param === 'en') return param
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'vi' || saved === 'en') return saved
  } catch {
    /* bỏ qua */
  }
  const preferred = navigator.languages?.[0] ?? navigator.language ?? 'vi'
  return preferred.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

/** Ngôn ngữ của người xem, nhớ lựa chọn khi họ bấm đổi */
export function useViewerLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(detectLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* bỏ qua */
    }
  }, [])
  return [lang, setLang]
}

/* ---- Lấy nội dung theo ngôn ngữ, thiếu bản tiếng Anh thì dùng tiếng Việt ---- */

export function cardTitle(card: CardData, lang: Lang): string {
  return lang === 'en' && card.titleEn ? card.titleEn : card.title
}

export function companyName(lang: Lang): string {
  return lang === 'en' && company.fullNameEn ? company.fullNameEn : company.fullName
}

export function officeLabel(office: Office, lang: Lang): string {
  return lang === 'en' && office.labelEn ? office.labelEn : office.label
}

export function officeAddress(office: Office, lang: Lang): string {
  return lang === 'en' && office.addressEn ? office.addressEn : office.address
}
