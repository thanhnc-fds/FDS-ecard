import { parseCardData, type CardData } from './card'
import { isValidSlug } from './slug'

/**
 * "Kho" danh thiếp cho link rút gọn: mỗi nhân viên là 1 file tĩnh
 *   public/cards/<slug>.json
 * Không có file tổng hợp → người ngoài không tải được cả danh sách nhân viên.
 */

export type FetchCardResult = { status: 'found'; card: CardData } | { status: 'not-found' } | { status: 'error' }

export function cardFilePath(slug: string): string {
  return `/cards/${slug}.json`
}

export async function fetchCardBySlug(slug: string, signal?: AbortSignal): Promise<FetchCardResult> {
  if (!isValidSlug(slug)) return { status: 'not-found' }
  try {
    const res = await fetch(cardFilePath(slug), { signal, cache: 'no-cache', headers: { Accept: 'application/json' } })
    if (res.status === 404) return { status: 'not-found' }
    if (!res.ok) return { status: 'error' }
    // Host tĩnh có thể trả về index.html (mã 200) cho file không tồn tại
    if (!res.headers.get('content-type')?.includes('json')) return { status: 'not-found' }
    const card = parseCardData(await res.json())
    if (!card) return { status: 'error' }
    return { status: 'found', card: { ...card, slug } }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    return { status: 'error' }
  }
}
