import { useEffect } from 'react'
import { CardView } from '@/components/card/card-view'
import { company } from '@/config/company'
import type { CardData } from '@/lib/card'
import { cardTitle, STRINGS, useViewerLang } from '@/lib/i18n'
import { useCardActions } from './use-card-actions'

type Props = {
  card: CardData
  verified?: boolean
  /** Link của danh thiếp — nội dung mã QR */
  cardUrl: string
}

/** Trang danh thiếp mà khách nhìn thấy khi mở link hoặc quét QR */
export function CardScreen({ card, verified, cardUrl }: Props) {
  const [lang, setLang] = useViewerLang()
  const t = STRINGS[lang]
  const title = cardTitle(card, lang)
  const { saveContact, openQr, qrDialog, inAppHint } = useCardActions({ card, cardUrl, lang })

  useEffect(() => {
    document.title = `${card.name} · ${title} · ${company.shortName}`
  }, [card.name, title])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/70 px-3 py-6 sm:py-10">
      <CardView
        card={card}
        verified={verified}
        qrValue={cardUrl}
        lang={lang}
        onLangChange={setLang}
        onSaveContact={saveContact}
        onQrClick={openQr}
        className="animate-card-in max-w-md rounded-3xl shadow-xl shadow-slate-300/50"
      />

      {inAppHint && (
        <p
          role="status"
          className="animate-in fade-in slide-in-from-top-2 mt-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
        >
          {t.inAppHint}
        </p>
      )}

      <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
        <img src={company.logo} alt="" className="h-4 w-auto opacity-80" />
        {t.digitalCard}
      </p>

      {qrDialog}
    </main>
  )
}
