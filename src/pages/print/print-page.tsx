/**
 * Bản in danh thiếp giấy — khổ chuẩn 90×54mm, 2 mặt.
 * Dùng chức năng in của trình duyệt → "Lưu dưới dạng PDF": chữ và QR giữ dạng vector,
 * font được nhúng sẵn, gửi thẳng cho nhà in.
 *
 * Nguồn dữ liệu:
 *   /print          → danh thiếp đang soạn ở trang tạo (truyền qua localStorage)
 *   /print/<slug>   → danh thiếp đã kích hoạt (public/cards/<slug>.json)
 */
import { useEffect, useState, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import { useParams } from 'react-router'
import { Globe, Loader2, Mail, MapPin, Phone, Printer } from 'lucide-react'
import { TelegramIcon } from '@/components/brand-icons'
import QrCode from '@/components/qr-code'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { company, getOffice } from '@/config/company'
import { parseCardData, type CardData } from '@/lib/card'
import { fetchCardBySlug } from '@/lib/cards-store'
import { cardTitle, companyName, officeAddress, type Lang } from '@/lib/i18n'
import { shortLink } from '@/lib/links'
import { PRINT_STORAGE_KEY } from '@/lib/print'
import { formatVnPhone } from '@/lib/phone'
import { displayWebsite } from '@/lib/social'
import { cn } from '@/lib/utils'

/** Kích thước thành phẩm (mm) và lề xén mỗi cạnh */
const TRIM = { w: 90, h: 54 }
const BLEED = 3
/** Vùng an toàn: chữ cách mép cắt tối thiểu 4mm */
const SAFE = 4

type Icon = ComponentType<SVGProps<SVGSVGElement>>

function readStoredCard(): CardData | null {
  try {
    return parseCardData(JSON.parse(localStorage.getItem(PRINT_STORAGE_KEY) ?? 'null'))
  } catch {
    return null
  }
}

type PrintCardState = { status: 'loading' | 'missing' | 'ready'; card?: CardData }

function usePrintCard(slug?: string): PrintCardState {
  const [stored] = useState(() => (slug ? null : readStoredCard()))
  const [remote, setRemote] = useState<{ slug: string; card: CardData | null } | null>(null)

  useEffect(() => {
    if (!slug) return
    const controller = new AbortController()
    fetchCardBySlug(slug, controller.signal)
      .then((r) => setRemote({ slug, card: r.status === 'found' ? r.card : null }))
      .catch(() => {
        /* bị huỷ */
      })
    return () => controller.abort()
  }, [slug])

  if (!slug) return stored ? { status: 'ready', card: stored } : { status: 'missing' }
  if (!remote || remote.slug !== slug) return { status: 'loading' }
  return remote.card ? { status: 'ready', card: remote.card } : { status: 'missing' }
}

export default function PrintPage() {
  const { slug } = useParams()
  const { status, card } = usePrintCard(slug)
  const [bleed, setBleed] = useState(true)
  const [lang, setLang] = useState<Lang>('vi')

  const pageW = TRIM.w + (bleed ? BLEED * 2 : 0)
  const pageH = TRIM.h + (bleed ? BLEED * 2 : 0)

  useEffect(() => {
    if (card) document.title = `Ban-in-danh-thiep-${card.slug || 'fds'}`
  }, [card])

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-brand size-8 animate-spin" />
      </div>
    )
  }
  if (!card) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center text-sm text-slate-500">
        Không có dữ liệu danh thiếp để in. Hãy mở bản in từ trang tạo danh thiếp.
      </div>
    )
  }

  const pageStyle: CSSProperties = { width: `${pageW}mm`, height: `${pageH}mm` }
  const inset = (bleed ? BLEED : 0) + SAFE

  return (
    <div className="min-h-dvh bg-slate-200 print:bg-white">
      {/* Khổ giấy khi in = đúng kích thước danh thiếp, không lề */}
      <style>{`@page { size: ${pageW}mm ${pageH}mm; margin: 0; }
        @media print { html, body { background: #fff; } }
        .print-page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`}</style>

      {/* Thanh công cụ — không in ra */}
      <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <div>
            <h1 className="font-semibold">Bản in danh thiếp giấy</h1>
            <p className="text-xs text-slate-500">
              {card.name} · {TRIM.w}×{TRIM.h}mm · 2 mặt
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={bleed} onCheckedChange={setBleed} />
            Lề xén {BLEED}mm
          </label>
          <div className="flex rounded-lg border p-0.5 text-sm">
            {(['vi', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn('rounded-md px-3 py-1', lang === l ? 'bg-brand text-white' : 'text-slate-600')}
              >
                {l === 'vi' ? 'Tiếng Việt' : 'English'}
              </button>
            ))}
          </div>
          <Button onClick={() => window.print()} className="ml-auto h-10">
            <Printer />
            In / Lưu PDF
          </Button>
        </div>
        <p className="mx-auto max-w-4xl px-4 pb-3 text-xs text-slate-500">
          Trong hộp thoại in: chọn <strong>Lưu dưới dạng PDF</strong>, Lề: <strong>Không</strong>, Tỉ lệ:{' '}
          <strong>100%</strong>. Gửi file PDF cho nhà in
          {bleed ? ` — file đã có lề xén ${BLEED}mm mỗi cạnh, nhà in cắt về ${TRIM.w}×${TRIM.h}mm.` : '.'}
        </p>
      </div>

      {/* Hai mặt danh thiếp */}
      <div className="flex flex-col items-center gap-10 py-10 print:block print:p-0">
        {(['front', 'back'] as const).map((side) => (
          <div key={side} className="flex flex-col items-center gap-3 print:block">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase print:hidden">
              {side === 'front' ? 'Mặt trước' : 'Mặt sau'}
            </span>
            {/* Trên màn hình phóng to để xem; khi in giữ đúng kích thước thật */}
            <div className="relative [zoom:2.4] shadow-xl max-sm:[zoom:1.1] print:[zoom:1] print:shadow-none">
              <div
                className="print-page relative break-after-page overflow-hidden bg-white text-slate-900"
                style={pageStyle}
              >
                {side === 'front' ? (
                  <Front card={card} lang={lang} inset={inset} />
                ) : (
                  <Back card={card} lang={lang} inset={inset} />
                )}
              </div>
              {bleed && <TrimGuide />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Đường viền nét đứt chỉ vị trí cắt — chỉ hiện trên màn hình */
function TrimGuide() {
  return (
    <div
      className="pointer-events-none absolute border border-dashed border-pink-500/70 print:hidden"
      style={{ inset: `${BLEED}mm` }}
    />
  )
}

function Front({ card, lang, inset }: { card: CardData; lang: Lang; inset: number }) {
  const office = getOffice(card.office)
  const title = cardTitle(card, lang)
  const secondaryTitle = lang === 'vi' && card.titleEn ? card.titleEn : undefined
  const contacts: { icon: Icon; text: string }[] = [
    { icon: Phone, text: formatVnPhone(card.phone) },
    { icon: Mail, text: card.email },
    ...(card.telegram ? [{ icon: TelegramIcon, text: `@${card.telegram}` }] : []),
    ...(card.website ? [{ icon: Globe, text: displayWebsite(card.website) }] : []),
    { icon: MapPin, text: officeAddress(office, lang) },
  ]

  return (
    <>
      {/* Trang trí: vạch tốc độ màu cam + mảng xanh góc phải (tràn ra lề xén) */}
      <div
        className="bg-brand absolute top-0 right-0 bottom-0"
        style={{ width: `${inset + 7}mm`, clipPath: 'polygon(38% 0, 100% 0, 100% 100%, 0 100%)' }}
      />
      <div
        className="bg-brand-accent absolute top-0 bottom-0"
        style={{
          right: `${inset + 6}mm`,
          width: '1.6mm',
          clipPath: 'polygon(60% 0, 100% 0, 40% 100%, 0 100%)',
          transform: 'translateX(-0.8mm)',
        }}
      />

      <div className="absolute flex flex-col" style={{ inset: `${inset}mm`, right: `${inset + 10}mm` }}>
        <img
          src={company.logo}
          alt={company.fullName}
          style={{ height: '8mm', width: 'auto', alignSelf: 'flex-start' }}
        />

        <div style={{ marginTop: '3.2mm' }}>
          <div className="text-brand-dark font-bold" style={{ fontSize: '12pt', lineHeight: 1.15 }}>
            {card.name}
          </div>
          <div className="text-brand font-semibold" style={{ fontSize: '7.5pt', marginTop: '0.8mm' }}>
            {title}
          </div>
          {secondaryTitle && (
            <div className="text-slate-500 italic" style={{ fontSize: '6.5pt' }}>
              {secondaryTitle}
            </div>
          )}
          <div className="bg-brand-accent" style={{ width: '8mm', height: '0.6mm', marginTop: '1.6mm' }} />
        </div>

        <ul className="mt-auto" style={{ fontSize: '6.3pt', lineHeight: 1.3 }}>
          {contacts.map(({ icon: ContactIcon, text }, i) => (
            <li key={i} className="flex items-start" style={{ gap: '1.4mm', marginTop: i ? '0.6mm' : 0 }}>
              <ContactIcon
                className="text-brand shrink-0"
                style={{ width: '2.4mm', height: '2.4mm', marginTop: '0.2mm' }}
              />
              <span className="min-w-0 [overflow-wrap:anywhere]">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function Back({ card, lang, inset }: { card: CardData; lang: Lang; inset: number }) {
  const qrValue = card.slug ? shortLink(card.slug) : ''
  return (
    <div className="bg-brand absolute inset-0 text-white">
      {/* Vạch tốc độ màu cam, lấy ý từ logo */}
      <div className="absolute flex flex-col" style={{ top: `${inset}mm`, left: `${inset}mm`, gap: '1mm' }}>
        <span className="bg-brand-accent block -skew-x-[30deg]" style={{ width: '9mm', height: '0.9mm' }} />
        <span className="bg-brand-accent/60 block -skew-x-[30deg]" style={{ width: '5mm', height: '0.9mm' }} />
      </div>

      <div className="absolute flex items-center" style={{ inset: `${inset}mm`, gap: '5mm' }}>
        <div className="shrink-0 rounded-[2mm] bg-white" style={{ padding: '1.6mm' }}>
          {qrValue ? (
            <QrCode value={qrValue} size={100} className="!size-[30mm]" />
          ) : (
            <div className="flex size-[30mm] items-center justify-center text-center text-[5pt] text-slate-400">
              Chưa có đường dẫn rút gọn
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="rounded-[1.5mm] bg-white" style={{ padding: '1.5mm 2.2mm', display: 'inline-block' }}>
            <img src={company.logo} alt={company.fullName} style={{ height: '7mm', width: 'auto' }} />
          </div>
          <div className="font-semibold" style={{ fontSize: '8pt', marginTop: '3mm' }}>
            {lang === 'vi' ? 'Quét để lưu danh bạ' : 'Scan to save contact'}
          </div>
          <div className="text-white/75" style={{ fontSize: '6.3pt', marginTop: '0.6mm' }}>
            {companyName(lang)}
            {card.website && (
              <>
                <br />
                {displayWebsite(card.website)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
