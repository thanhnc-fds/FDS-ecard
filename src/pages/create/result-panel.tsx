import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import {
  CircleCheck,
  CircleDashed,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  Link2,
  Loader2,
  Printer,
  QrCode as QrCodeIcon,
  RefreshCw,
  WifiOff,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toCardFile, type CardData } from '@/lib/card'
import { fetchCardBySlug } from '@/lib/cards-store'
import { copyToClipboard, downloadText } from '@/lib/download'
import { directLink, shortLink } from '@/lib/links'
import { openPrintPage } from '@/lib/print'
import { cn } from '@/lib/utils'
import { Section } from './form-parts'

const QrCode = lazy(() => import('@/components/qr-code'))

/** Trạng thái link rút gọn: file dữ liệu đã có trong public/cards chưa */
type ShortStatus = 'checking' | 'inactive' | 'active' | 'outdated'

function cardFileJson(card: CardData): string {
  return JSON.stringify(toCardFile(card), null, 2) + '\n'
}

function useShortLinkStatus(card: CardData) {
  const [state, setState] = useState<{ key: string; status: ShortStatus }>({ key: '', status: 'checking' })
  const [reloadKey, setReloadKey] = useState(0)
  const json = cardFileJson(card)
  const key = `${card.slug}|${json}|${reloadKey}`

  useEffect(() => {
    const controller = new AbortController()
    // Đợi người dùng gõ xong rồi mới kiểm tra
    const timer = setTimeout(async () => {
      try {
        const result = await fetchCardBySlug(card.slug, controller.signal)
        let status: ShortStatus = 'inactive'
        if (result.status === 'found') status = cardFileJson(result.card) === json ? 'active' : 'outdated'
        setState({ key, status })
      } catch {
        /* bị huỷ */
      }
    }, 500)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [card.slug, json, key])

  return {
    status: state.key === key ? state.status : ('checking' as const),
    recheck: () => setReloadKey((k) => k + 1),
  }
}

type Props = {
  card: CardData
  ready: boolean
  missing: string[]
}

export function ResultPanel({ card, ready, missing }: Props) {
  if (!ready) {
    return (
      <Section icon={Link2} title="Đường dẫn & mã QR" description="Hoàn tất thông tin để tạo danh thiếp">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          <p className="font-medium text-slate-700">Còn thiếu hoặc chưa hợp lệ:</p>
          <ul className="mt-2 list-inside list-disc space-y-0.5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      </Section>
    )
  }
  return <ReadyPanel card={card} />
}

function ReadyPanel({ card }: { card: CardData }) {
  const short = shortLink(card.slug)
  const direct = directLink(card)
  const { status, recheck } = useShortLinkStatus(card)
  const [qrSource, setQrSource] = useState<'short' | 'direct'>('short')
  const qrValue = qrSource === 'short' ? short : direct

  function handleDownloadJson() {
    downloadText(cardFileJson(card), `${card.slug}.json`, 'application/json')
    toast.success(`Đã tải ${card.slug}.json`, {
      description: 'Bỏ file vào thư mục public/cards/ để kích hoạt link rút gọn',
    })
  }

  async function handleDownloadQr(format: 'png' | 'svg') {
    try {
      const { downloadQr } = await import('@/components/qr-code')
      await downloadQr(qrValue, format, `qr-${card.slug}${qrSource === 'direct' ? '-truc-tiep' : ''}`)
    } catch {
      toast.error('Không tải được mã QR')
    }
  }

  return (
    <Section icon={Link2} title="Đường dẫn & mã QR" description="Chia sẻ danh thiếp qua link hoặc mã QR">
      <div className="space-y-4">
        {/* Link rút gọn */}
        <LinkBox
          title="Link rút gọn"
          badge={<StatusBadge status={status} />}
          url={short}
          description={
            status === 'active'
              ? 'Link chính thức, ngắn gọn, có dấu xác minh. Dùng link này để in lên danh thiếp giấy.'
              : status === 'outdated'
                ? 'Thông tin vừa sửa khác với bản đang chạy. Tải file dữ liệu mới và thay file cũ để cập nhật.'
                : 'Link chính thức, ngắn gọn, có dấu xác minh. Cần kích hoạt bằng file dữ liệu (xem hướng dẫn bên dưới).'
          }
        >
          {status !== 'active' && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Cách kích hoạt:</p>
              <ol className="mt-1 list-inside list-decimal space-y-0.5">
                <li>
                  Bấm “Tải file dữ liệu” → nhận file <code className="font-mono">{card.slug}.json</code>
                </li>
                <li>
                  Gửi cho admin, hoặc tự đặt vào thư mục <code className="font-mono">public/cards/</code>
                </li>
                <li>Bấm “Kiểm tra lại” — khi chạy local link hoạt động ngay, khi đã deploy thì sau khi deploy lại</li>
              </ol>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleDownloadJson}>
              <FileJson />
              Tải file dữ liệu
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={recheck} disabled={status === 'checking'}>
              <RefreshCw className={cn(status === 'checking' && 'animate-spin')} />
              Kiểm tra lại
            </Button>
          </div>
        </LinkBox>

        {/* Link trực tiếp */}
        <LinkBox
          title="Link trực tiếp"
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
              <Zap className="size-3" />
              Dùng ngay
            </span>
          }
          url={direct}
          description={`Thông tin và ảnh nằm ngay trong link (${direct.length} ký tự), dùng được luôn không cần kích hoạt. Muốn đổi thông tin phải tạo link mới.`}
        />

        {/* Mã QR */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="text-brand size-4" />
            <h3 className="text-sm font-semibold">Mã QR</h3>
          </div>
          <Tabs value={qrSource} onValueChange={(v) => setQrSource(v as 'short' | 'direct')} className="mt-3">
            <TabsList className="w-full">
              <TabsTrigger value="short">Link rút gọn</TabsTrigger>
              <TabsTrigger value="direct">Link trực tiếp</TabsTrigger>
            </TabsList>
            <TabsContent value={qrSource} className="mt-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="rounded-xl border bg-white p-3">
                  <Suspense
                    fallback={
                      <div className="flex size-44 items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-slate-400" />
                      </div>
                    }
                  >
                    <QrCode value={qrValue} size={176} />
                  </Suspense>
                </div>
                <div className="flex-1 space-y-3 text-sm text-slate-600">
                  {qrSource === 'short' ? (
                    <p>
                      QR ngắn, dễ quét, in nhỏ vẫn rõ. <strong>Khuyên dùng để in danh thiếp.</strong>
                      {status !== 'active' && (
                        <span className="mt-1 block text-amber-700">
                          ⚠ Chỉ quét được sau khi đã kích hoạt link rút gọn.
                        </span>
                      )}
                    </p>
                  ) : (
                    <p>QR chứa toàn bộ thông tin nên dày hơn. Phù hợp hiển thị trên màn hình, không nên in quá nhỏ.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleDownloadQr('png')}>
                      <Download />
                      PNG
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleDownloadQr('svg')}>
                      <Download />
                      SVG (in ấn)
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Danh thiếp giấy */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Printer className="text-brand size-4" />
            <h3 className="text-sm font-semibold">Danh thiếp giấy</h3>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            File in 2 mặt khổ chuẩn 90×54mm (có lề xén 3mm), mặt sau là mã QR link rút gọn. Lưu thành PDF rồi gửi thẳng
            cho nhà in. Có bản tiếng Việt và tiếng Anh.
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => openPrintPage(card)}>
            <Printer />
            Mở bản in
          </Button>
        </div>

        {/* Dùng không cần mạng */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <WifiOff className="text-brand size-4" />
            <h3 className="text-sm font-semibold">Mở danh thiếp khi không có mạng</h3>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Sau khi link rút gọn đã kích hoạt, nhân viên mở link đó trên điện thoại của mình và thêm vào màn hình chính.
            Từ đó mở danh thiếp ngay cả khi mất sóng (kho, cảng, sự kiện) để đưa QR cho người khác quét.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>
              <strong>iPhone (Safari):</strong> nút Chia sẻ → “Thêm vào MH chính”
            </li>
            <li>
              <strong>Android (Chrome):</strong> nút ⋮ → “Thêm vào màn hình chính” hoặc “Cài đặt ứng dụng”
            </li>
          </ul>
        </div>
      </div>
    </Section>
  )
}

function LinkBox({
  title,
  badge,
  url,
  description,
  children,
}: {
  title: string
  badge: ReactNode
  url: string
  description: string
  children?: ReactNode
}) {
  async function handleCopy() {
    if (await copyToClipboard(url)) toast.success(`Đã sao chép ${title.toLowerCase()}`)
    else toast.error('Không sao chép được')
  }
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code
          className="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700"
          title={url}
        >
          {url}
        </code>
        <Button type="button" size="icon" variant="outline" onClick={handleCopy} aria-label={`Sao chép ${title}`}>
          <Copy />
        </Button>
        <Button type="button" size="icon" variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Mở ${title}`}>
            <ExternalLink />
          </a>
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: ShortStatus }) {
  const map = {
    checking: { icon: Loader2, text: 'Đang kiểm tra', className: 'bg-slate-100 text-slate-600', spin: true },
    inactive: { icon: CircleDashed, text: 'Chưa kích hoạt', className: 'bg-amber-50 text-amber-700', spin: false },
    outdated: { icon: RefreshCw, text: 'Cần cập nhật', className: 'bg-orange-50 text-orange-700', spin: false },
    active: { icon: CircleCheck, text: 'Đã kích hoạt', className: 'bg-emerald-50 text-emerald-700', spin: false },
  }[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', map.className)}>
      <map.icon className={cn('size-3', map.spin && 'animate-spin')} />
      {map.text}
    </span>
  )
}
