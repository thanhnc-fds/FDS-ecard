import { Fragment, lazy, Suspense, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { BadgeCheck, ChevronRight, Globe, Mail, MapPin, Phone, UserPlus } from 'lucide-react'
import { TelegramIcon, ZaloIcon } from '@/components/brand-icons'
import { company, getMapUrl, getOffice } from '@/config/company'
import type { CardData } from '@/lib/card'
import { cardTitle, companyName, officeAddress, officeLabel, STRINGS, type Lang } from '@/lib/i18n'
import { formatVnPhone, toNationalPhone } from '@/lib/phone'
import { displayWebsite, telegramLink, zaloUrl } from '@/lib/social'
import { cn } from '@/lib/utils'
import { Avatar } from './avatar'

/**
 * Danh thiếp (dùng chung cho trang khách xem và khung xem trước ở trang tạo).
 *
 *  ┌ logo ─────────────── VI|EN ┐   thanh trắng, logo nhỏ bên trái
 *  ├━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤   vạch màu thương hiệu xanh → cam
 *  │ (ảnh)  Tên / chức danh / cty│   ảnh + tên nằm ngang: tiết kiệm chiều cao
 *  │ 📞 số điện thoại  [Zalo][✈] │   danh sách full chiều ngang, kẻ mảnh
 *  │ ✉  email                    │
 *  │ 📍 địa chỉ                  │
 *  │ ┌ khối xanh ─────────────┐  │   khối thương hiệu: QR + Lưu danh bạ
 *  │ │ [QR]  [+ Lưu danh bạ]  │  │
 *  └─┴────────────────────────┴──┘
 */

// Thư viện QR tải riêng, card hiện ngay rồi QR xuất hiện sau một chút
const QrCode = lazy(() => import('@/components/qr-code'))

type Icon = ComponentType<SVGProps<SVGSVGElement>>
type Chip = { key: string; icon: Icon; label: string; href: string; className: string }
type Row = { key: string; icon: Icon; label: string; value: string; href: string; external?: boolean; chips?: Chip[] }

function getRows(card: CardData, lang: Lang): Row[] {
  const office = getOffice(card.office)
  const rows: Row[] = []
  if (card.phone) {
    const chips: Chip[] = []
    if (card.zalo) {
      chips.push({
        key: 'zalo',
        icon: ZaloIcon,
        label: 'Zalo',
        href: zaloUrl(toNationalPhone(card.phone)),
        className: 'bg-[#0068FF]/10 text-[#0068FF] hover:bg-[#0068FF] hover:text-white [&_svg]:size-6',
      })
    }
    const telegram = telegramLink(card)
    if (telegram) {
      chips.push({
        key: 'telegram',
        icon: TelegramIcon,
        label: 'Telegram',
        href: telegram,
        className: 'bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9] hover:text-white [&_svg]:size-4',
      })
    }
    rows.push({
      key: 'phone',
      icon: Phone,
      label: STRINGS[lang].phone,
      value: formatVnPhone(card.phone),
      href: `tel:${card.phone}`,
      chips,
    })
  }
  if (card.email)
    rows.push({ key: 'email', icon: Mail, label: 'Email', value: card.email, href: `mailto:${card.email}` })
  if (card.website) {
    rows.push({
      key: 'website',
      icon: Globe,
      label: 'Website',
      value: displayWebsite(card.website),
      href: card.website,
      external: true,
    })
  }
  rows.push({
    key: 'address',
    icon: MapPin,
    label: officeLabel(office, lang),
    value: officeAddress(office, lang),
    href: getMapUrl(office),
    external: true,
  })
  return rows
}

function withBreakHints(value: string): ReactNode {
  const parts = value.split(/(?<=@)|(?=\/)/)
  return parts.length === 1
    ? value
    : parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))
}

function external(isExternal?: boolean) {
  return isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}
}

export type CardViewProps = {
  card: CardData
  /** Nội dung mã QR (link danh thiếp). Bỏ trống → hiện ô QR mờ */
  qrValue?: string
  /** Dữ liệu từ kho của công ty (link rút gọn) → hiện dấu xác minh */
  verified?: boolean
  /** Chạm vào mã QR (ví dụ để phóng to) */
  onQrClick?: () => void
  /** Lưu liên hệ vào danh bạ điện thoại (file .vcf) */
  onSaveContact?: () => void
  /** Ngôn ngữ hiển thị */
  lang?: Lang
  /** Có truyền → hiện nút chuyển VI/EN nhỏ ở góc */
  onLangChange?: (lang: Lang) => void
  className?: string
}

export function CardView({
  card,
  qrValue,
  verified,
  onQrClick,
  onSaveContact,
  lang = 'vi',
  onLangChange,
  className,
}: CardViewProps) {
  const t = STRINGS[lang]
  const rows = getRows(card, lang)
  const title = cardTitle(card, lang)

  return (
    <article
      className={cn('relative w-full overflow-hidden bg-white text-slate-900', className)}
      aria-label={t.cardOf(card.name)}
    >
      {/* Thanh trên: logo + ngôn ngữ */}
      <header className="flex h-14 items-center justify-between px-5">
        <img src={company.logo} alt={company.fullName} className="h-8 w-auto" />
        {onLangChange && (
          <div
            role="group"
            aria-label="Ngôn ngữ / Language"
            className="flex rounded-full bg-slate-100 p-0.5 text-[11px] font-semibold"
          >
            {(['vi', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLangChange(l)}
                aria-pressed={lang === l}
                className={cn(
                  'rounded-full px-2.5 py-0.5 uppercase transition duration-200',
                  lang === l ? 'text-brand bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </header>
      {/* Vạch thương hiệu: xanh → cam, gợi vệt tốc độ trong logo */}
      <div className="from-brand via-brand to-brand-accent h-1 bg-gradient-to-r" />

      {/* Người: ảnh + tên nằm ngang */}
      <div className="animate-rise flex items-center gap-4 px-5 pt-5">
        <Avatar
          name={card.name}
          src={card.avatar}
          className="ring-brand/10 size-[84px] text-3xl shadow-md ring-4 transition-transform duration-300 hover:scale-105"
        />
        <div className="min-w-0 flex-1">
          <h1 className={cn('text-xl leading-tight font-bold text-balance', !card.name && 'text-slate-300')}>
            {card.name || t.namePlaceholder}
          </h1>
          <p className={cn('text-brand mt-1 text-sm leading-snug font-semibold', !title && 'text-slate-300')}>
            {title || t.titlePlaceholder}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
            {companyName(lang)}
            {verified && <BadgeCheck className="text-brand size-4" aria-label={t.verified} />}
          </p>
        </div>
      </div>

      {/* Thông tin liên hệ: full chiều ngang, kẻ mảnh */}
      <ul className="mt-3 px-3">
        {rows.map((r, i) => (
          <li
            key={r.key}
            className="animate-rise flex items-center gap-1.5 border-b border-slate-100 last:border-0"
            style={{ animationDelay: `${60 + i * 50}ms` }}
          >
            <a
              href={r.href}
              aria-label={`${r.label}: ${r.value}`}
              {...external(r.external)}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 transition duration-200 hover:bg-slate-50 active:scale-[0.98]"
            >
              <span className="bg-brand/[0.07] text-brand group-hover:bg-brand flex size-9 shrink-0 items-center justify-center rounded-xl transition duration-200 group-hover:text-white">
                <r.icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1 text-[15px] leading-snug [overflow-wrap:anywhere]">
                {withBreakHints(r.value)}
              </span>
              {!r.chips?.length && (
                <ChevronRight className="size-4 shrink-0 -translate-x-1 text-slate-300 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
              )}
            </a>
            {r.chips?.map((c) => (
              <a
                key={c.key}
                href={c.href}
                aria-label={c.label}
                {...external(true)}
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-90',
                  c.className,
                )}
              >
                <c.icon />
              </a>
            ))}
          </li>
        ))}
      </ul>

      {/* Khối thương hiệu: QR + Lưu danh bạ */}
      <div
        className="animate-rise from-brand to-brand-dark relative m-4 mt-3 flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br p-3.5"
        style={{ animationDelay: '260ms' }}
      >
        <div className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full bg-white/[0.06]" />
        <div className="bg-brand-accent/20 pointer-events-none absolute -bottom-12 left-24 size-28 rounded-full blur-2xl" />

        <button
          type="button"
          onClick={onQrClick}
          disabled={!onQrClick}
          aria-label={t.enlargeQr}
          className="relative shrink-0 rounded-xl bg-white p-1.5 shadow-lg transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:rotate-[-1.5deg] enabled:active:scale-95"
        >
          {qrValue ? (
            <Suspense fallback={<div className="size-[92px] animate-pulse rounded-lg bg-slate-100" />}>
              <QrCode value={qrValue} size={92} />
            </Suspense>
          ) : (
            <div className="size-[92px] rounded-lg bg-[repeating-linear-gradient(45deg,#f1f5f9_0_6px,#fff_6px_12px)]" />
          )}
        </button>

        <div className="relative min-w-0 flex-1">
          <p className="text-[13px] leading-snug text-white/80">{t.scanToSave}</p>
          <button
            type="button"
            onClick={onSaveContact}
            className="group text-brand mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95"
          >
            <UserPlus className="size-4 transition-transform duration-200 group-hover:scale-110" />
            {t.saveContact}
          </button>
        </div>
      </div>
    </article>
  )
}
