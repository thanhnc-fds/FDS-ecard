import { emptyFormValues, type CardFormValues } from '@/lib/card-form'

/** Lưu bản nháp vào trình duyệt để lỡ tải lại trang không mất dữ liệu đang nhập */

const KEY = 'fds-ecard:draft'

export type Draft = { values: CardFormValues; slugTouched: boolean }

export function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Draft>
      // Chỉ lấy các field đúng kiểu, field lạ/sai kiểu dùng giá trị mặc định
      const values = { ...emptyFormValues }
      for (const key of Object.keys(emptyFormValues) as (keyof CardFormValues)[]) {
        const v = parsed.values?.[key]
        if (typeof v === typeof emptyFormValues[key]) (values as Record<string, unknown>)[key] = v
      }
      return { values, slugTouched: parsed.slugTouched === true }
    }
  } catch {
    /* bản nháp hỏng → bỏ qua */
  }
  return { values: emptyFormValues, slugTouched: false }
}

export function saveDraft(draft: Draft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    /* hết dung lượng / chế độ ẩn danh → bỏ qua */
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY)
}
