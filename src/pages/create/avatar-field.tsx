import { useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Loader2, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/card/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDriveId, parseAvatarLink, probeImage } from '@/lib/avatar-url'
import { cn } from '@/lib/utils'

type Props = {
  name: string
  /** Link ảnh đã chuẩn hoá (lh3.googleusercontent.com) hoặc chuỗi rỗng */
  value: string
  onChange: (value: string) => void
}

type LinkStatus = { state: 'idle' } | { state: 'checking' } | { state: 'ok' } | { state: 'error'; message: string }

const LINK_ERRORS = {
  folder: 'Đây là link thư mục. Hãy mở riêng ảnh rồi lấy link của file ảnh đó.',
  notImage: 'Đây là link tài liệu (Docs/Sheets/Slides), không phải ảnh.',
  invalid: 'Link chưa đúng. Hãy dán link chia sẻ ảnh trên Google Drive.',
  load: 'Không tải được ảnh. Kiểm tra quyền chia sẻ đã là “Bất kỳ ai có đường liên kết” chưa.',
} as const

const CHECK_DELAY_MS = 400

/** Link hiện trong ô nhập: ảnh Drive → hiện lại dạng link chia sẻ quen thuộc */
function toLinkText(value: string): string {
  if (!value) return ''
  const driveId = getDriveId(value)
  return driveId ? `https://drive.google.com/file/d/${driveId}/view` : value
}

/**
 * Ảnh đại diện = link ảnh trên Google Drive (đã bật chia sẻ công khai).
 * Ảnh không nằm trong dữ liệu danh thiếp, chỉ có mã file → link trực tiếp vẫn ngắn mà vẫn có ảnh.
 */
export function AvatarField({ name, value, onChange }: Props) {
  // Ô link giữ chữ người dùng đang gõ; giá trị form chỉ đổi khi ảnh tải được
  const [linkText, setLinkText] = useState(() => toLinkText(value))
  const [status, setStatus] = useState<LinkStatus>({ state: 'idle' })
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const checkId = useRef(0)

  // Giá trị bị đổi từ bên ngoài (mở file dữ liệu, tạo mới, khôi phục nháp) → đồng bộ lại ô link
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setLinkText(toLinkText(value))
    setStatus({ state: 'idle' })
  }

  function emit(next: string) {
    setSyncedValue(next)
    onChange(next)
  }

  function handleChange(text: string) {
    setLinkText(text)
    clearTimeout(checkTimer.current)
    const id = ++checkId.current

    if (!text.trim()) {
      setStatus({ state: 'idle' })
      if (value) emit('')
      return
    }
    const parsed = parseAvatarLink(text)
    if (!parsed.ok) {
      setStatus({ state: 'error', message: LINK_ERRORS[parsed.reason] })
      return
    }
    if (parsed.url === value) {
      setStatus({ state: 'ok' })
      return
    }
    setStatus({ state: 'checking' })
    checkTimer.current = setTimeout(async () => {
      const ok = await probeImage(parsed.url)
      if (id !== checkId.current) return // người dùng đã sửa sang link khác
      if (ok) {
        emit(parsed.url)
        setStatus({ state: 'ok' })
      } else {
        setStatus({ state: 'error', message: LINK_ERRORS.load })
      }
    }, CHECK_DELAY_MS)
  }

  const hasError = status.state === 'error'

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-start">
      <div className="flex shrink-0 flex-col items-center gap-2">
        <Avatar name={name} src={value || undefined} className="size-20 text-2xl" />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => handleChange('')}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
            Xoá ảnh
          </Button>
        )}
      </div>

      <div className="w-full min-w-0 flex-1">
        <label htmlFor="avatar-link" className="text-sm font-medium">
          Ảnh đại diện <span className="font-normal text-slate-400">(link Google Drive)</span>
        </label>
        <div className="relative mt-2">
          <Input
            id="avatar-link"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://drive.google.com/file/d/…"
            value={linkText}
            onChange={(e) => handleChange(e.target.value)}
            aria-invalid={hasError}
            aria-describedby="avatar-link-status"
            className="h-10 pr-9"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {status.state === 'checking' && <Loader2 className="size-4 animate-spin text-slate-400" />}
            {status.state === 'ok' && <CircleCheck className="size-4 text-emerald-600" />}
            {hasError && <CircleAlert className="text-destructive size-4" />}
          </span>
        </div>
        <p
          id="avatar-link-status"
          aria-live="polite"
          className={cn('mt-1.5 text-xs', hasError ? 'text-destructive' : 'text-slate-500')}
        >
          {status.state === 'checking'
            ? 'Đang kiểm tra ảnh…'
            : status.state === 'ok'
              ? 'Ảnh hợp lệ.'
              : hasError
                ? status.message
                : 'Không bắt buộc. Chưa có ảnh thì hiện chữ viết tắt của tên.'}
        </p>
        <details className="mt-2 text-xs text-slate-500">
          <summary className="text-brand cursor-pointer font-medium select-none">
            Cách lấy link ảnh từ Google Drive
          </summary>
          <ol className="mt-1.5 list-inside list-decimal space-y-0.5 leading-relaxed">
            <li>Tải ảnh chân dung lên Google Drive</li>
            <li>Bấm chuột phải vào ảnh (điện thoại: bấm dấu ⋮) → Chia sẻ</li>
            <li>
              Mục “Quyền truy cập chung” chọn <b className="text-slate-700">Bất kỳ ai có đường liên kết</b>
            </li>
            <li>Bấm “Sao chép đường liên kết” rồi dán vào ô trên</li>
          </ol>
          <p className="mt-1.5">
            Ảnh tự cắt vuông ở giữa, nên chọn ảnh có khuôn mặt ở chính giữa. Muốn đổi ảnh mà giữ nguyên link: trên Drive
            chọn “Quản lý phiên bản” → tải ảnh mới lên.
          </p>
        </details>
      </div>
    </div>
  )
}
