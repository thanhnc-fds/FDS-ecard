import { useState } from 'react'
import { RotateCw, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { company } from '@/config/company'
import { detectLang, STRINGS } from '@/lib/i18n'

const MESSAGES = {
  invalid: { title: 'invalidTitle', desc: 'invalidDesc' },
  notFound: { title: 'notFoundTitle', desc: 'notFoundDesc' },
  error: { title: 'errorTitle', desc: 'errorDesc' },
  pageNotFound: { title: 'pageNotFoundTitle', desc: 'pageNotFoundDesc' },
} as const

type Props = {
  kind: keyof typeof MESSAGES
}

/** Trang báo lỗi cho người xem (song ngữ theo ngôn ngữ điện thoại) */
export function MessageScreen({ kind }: Props) {
  const [lang] = useState(detectLang)
  const t = STRINGS[lang]
  const { title, desc } = MESSAGES[kind]
  return (
    <main
      lang={lang}
      className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/70 p-6"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-300/50">
        <img src={company.logo} alt={company.shortName} className="mx-auto h-10 w-auto" />
        <div className="bg-brand/10 text-brand mx-auto mt-6 flex size-14 items-center justify-center rounded-2xl">
          <SearchX className="size-7" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">{t[title]}</h1>
        <p className="mt-2 text-sm text-slate-500">{t[desc]}</p>
        <div className="mt-6 flex flex-col gap-2">
          {kind === 'error' && (
            <Button onClick={() => window.location.reload()} className="h-10">
              <RotateCw />
              {t.retry}
            </Button>
          )}
          <Button variant="outline" asChild className="h-10">
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              {t.visitWebsite}
            </a>
          </Button>
        </div>
      </div>
    </main>
  )
}
