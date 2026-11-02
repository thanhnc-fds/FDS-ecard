/**
 * Thông tin công ty — cố định cho toàn bộ danh thiếp.
 * Nguồn: chữ ký email chính thức của công ty.
 */

export type Office = {
  /** Mã ngắn, dùng trong link — KHÔNG đổi sau khi đã phát hành link */
  id: string
  label: string
  address: string
  /** Bản tiếng Anh (hiện khi người xem dùng tiếng Anh). Bỏ trống → dùng bản tiếng Việt */
  labelEn?: string
  addressEn?: string
  /** Link Google Maps. Bỏ trống → tự tạo link tìm kiếm theo địa chỉ */
  mapUrl?: string
}

export const company = {
  shortName: 'FDS',
  fullName: 'FADO SOLUTIONS JSC',
  /** Tên tiếng Anh. Bỏ trống → dùng fullName */
  fullNameEn: '',
  website: 'https://fadosolution.com',
  /**
   * Logo trong thư mục /public — bản tối ưu (480px, WebP ~32KB) tạo từ fds_logo.png.
   * Đổi logo: thay file rồi giữ nguyên tên, hoặc sửa đường dẫn ở đây.
   */
  logo: '/logo-fds.webp',
  /** Ảnh đặt giữa mã QR */
  logoMark: '/logo-fds.webp',
  /**
   * Ảnh bìa nửa trên danh thiếp (ví dụ '/cover-fds.jpg' đặt trong /public).
   * Nên dùng ảnh ngang tỉ lệ ~ 5:2, rộng ≥ 1000px, phần giữa-dưới sẽ bị ảnh đại diện che.
   * Bỏ trống → hiện logo trên nền sáng.
   */
  cover: '',
  /** Màu thương hiệu (mã HEX, lấy từ logo) — dùng cho giao diện và mã QR */
  brandColor: '#00348C',
  /** Xanh đậm hơn: chữ, chấm QR */
  brandColorDark: '#002266',
  /** Màu nhấn (cam trong logo) */
  accentColor: '#FF5000',
  offices: [
    {
      id: 'hcm',
      label: 'Trụ sở chính',
      address: '161/1-3 Cộng Hòa, Phường Bảy Hiền, TP. Hồ Chí Minh',
      labelEn: 'Head office',
      addressEn: '161/1-3 Cong Hoa, Bay Hien Ward, Ho Chi Minh City',
    },
  ] satisfies Office[] as Office[],
  /**
   * Địa chỉ website sau khi deploy, ví dụ 'https://ecard.fadosolution.com'.
   * Bỏ trống → dùng địa chỉ hiện tại của trình duyệt (phù hợp khi chạy local).
   */
  siteUrl: '',
}

export function getOffice(id?: string): Office {
  return company.offices.find((o) => o.id === id) ?? company.offices[0]
}

export function getMapUrl(office: Office): string {
  return office.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`
}
