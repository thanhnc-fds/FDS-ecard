import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { getOffice, company } from '@/config/company'
import { fetchImageAsDataUrl } from '@/lib/avatar-url'
import type { CardData } from '@/lib/card'
import { downloadText } from '@/lib/download'
import { cardTitle, companyName, type Lang } from '@/lib/i18n'
import { slugify } from '@/lib/slug'
import { buildVCard } from '@/lib/vcard'

const QrDialog = lazy(() => import('./qr-dialog'))

/** Trình duyệt nhúng trong app (Zalo, Facebook, Messenger, Instagram, TikTok, LINE, WeChat) */
const IN_APP_BROWSER = /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|TikTok|musical_ly|Line\/|MicroMessenger/i

/**
 * Các thao tác trên danh thiếp, dùng chung cho trang khách xem và khung xem trước:
 *  - Lưu danh bạ (.vcf, kèm ảnh Drive đã tải sẵn)
 *  - Phóng to mã QR
 */
export function useCardActions({ card, cardUrl, lang }: { card: CardData; cardUrl?: string; lang: Lang }) {
  const [qrOpen, setQrOpen] = useState(false)
  const [qrLoaded, setQrLoaded] = useState(false)
  // Mở trong trình duyệt của Zalo/Facebook… → có thể không tải được file, hiện hướng dẫn
  const [inAppHint, setInAppHint] = useState(false)

  // Ảnh dạng link (Drive): tải sẵn về để nhúng vào file danh bạ, bấm lưu là có ngay
  const photo = useRef<Promise<string | null> | null>(null)
  useEffect(() => {
    photo.current = card.avatar ? fetchImageAsDataUrl(card.avatar) : null
  }, [card.avatar])

  async function saveContact() {
    const vcf = buildVCard(card, {
      office: getOffice(card.office),
      cardUrl,
      lang,
      photo: photo.current ? await photo.current : null,
    })
    const fileName = card.slug || slugify(card.name) || 'danh-thiep'
    downloadText(vcf, `${fileName}.vcf`, 'text/vcard;charset=utf-8')
    if (IN_APP_BROWSER.test(navigator.userAgent)) setInAppHint(true)
  }

  function openQr() {
    setQrLoaded(true)
    setQrOpen(true)
  }

  const qrDialog =
    qrLoaded && cardUrl ? (
      <Suspense fallback={null}>
        <QrDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          value={cardUrl}
          title={card.name || company.shortName}
          description={[cardTitle(card, lang), companyName(lang)].filter(Boolean).join(' · ')}
        />
      </Suspense>
    ) : null

  return { saveContact, openQr: cardUrl ? openQr : undefined, qrDialog, inAppHint }
}
