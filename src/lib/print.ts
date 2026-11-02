import { toCardFile, type CardData } from './card'

/** Truyền danh thiếp đang soạn sang trang in (mở ở tab mới) */
export const PRINT_STORAGE_KEY = 'fds-ecard:print'

export function openPrintPage(card: CardData): void {
  // Bản in không cần ảnh đại diện → bỏ bớt cho nhẹ
  const { avatar: _avatar, ...rest } = toCardFile(card)
  localStorage.setItem(PRINT_STORAGE_KEY, JSON.stringify(rest))
  window.open('/print', '_blank', 'noopener')
}
