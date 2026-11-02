/** Các đường dẫn đã dùng cho trang của hệ thống — không được dùng làm mã danh thiếp */
export const RESERVED_SLUGS = new Set([
  'create',
  'card',
  'cards',
  'avatars',
  'assets',
  'admin',
  'api',
  'edit',
  'print',
  'logo-fds',
  'favicon',
])

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Bỏ dấu tiếng Việt: "Nguyễn Văn Đức" → "Nguyen Van Duc" */
export function removeVietnameseTones(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

/** "Nguyễn Văn Đức" → "nguyen-van-duc" */
export function slugify(input: string): string {
  return removeVietnameseTones(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/, '')
}

export function isValidSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 50 && SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug)
}
