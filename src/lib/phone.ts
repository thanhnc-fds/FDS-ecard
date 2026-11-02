/**
 * Chuẩn hoá số điện thoại Việt Nam.
 * - Di động: 10 số, đầu 03/05/07/08/09  → 0909 123 456
 * - Cố định: 11 số, đầu 02x             → 028 3823 4567
 * Lưu trữ dạng quốc tế E.164: +84909123456
 */

const MOBILE = /^[35789]\d{8}$/ // số quốc gia (bỏ 0) — 9 chữ số
const LANDLINE = /^2\d{9}$/ // 10 chữ số

/** Trả về phần "số quốc gia" (không có 0 hay +84), hoặc null nếu không hợp lệ */
function toNationalSignificant(input: string): string | null {
  let digits = input.trim().replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+84')) digits = digits.slice(3)
  else if (digits.startsWith('0084')) digits = digits.slice(4)
  else if (digits.startsWith('84') && digits.length >= 11) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  else return null
  if (!/^\d+$/.test(digits)) return null
  return MOBILE.test(digits) || LANDLINE.test(digits) ? digits : null
}

export function isValidVnPhone(input: string): boolean {
  return toNationalSignificant(input) !== null
}

/** "0909.123.456" → "+84909123456" ; không hợp lệ → null */
export function normalizeVnPhone(input: string): string | null {
  const nsn = toNationalSignificant(input)
  return nsn ? `+84${nsn}` : null
}

/** "+84909123456" → "0909123456" */
export function toNationalPhone(input: string): string {
  const nsn = toNationalSignificant(input)
  return nsn ? `0${nsn}` : input
}

/** "+84909123456" → "0909 123 456" ; "+842838234567" → "028 3823 4567" */
export function formatVnPhone(input: string): string {
  const nsn = toNationalSignificant(input)
  if (!nsn) return input
  const n = `0${nsn}`
  if (n.length === 10) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`
  return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
}
