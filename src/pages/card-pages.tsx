import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router'
import { Loader2 } from 'lucide-react'
import type { CardData } from '@/lib/card'
import { fetchCardBySlug } from '@/lib/cards-store'
import { decodeCard } from '@/lib/codec'
import { shortLink } from '@/lib/links'
import { CardScreen } from './card-screen'
import { MessageScreen } from './message-screen'

/** /card#<dữ liệu> — link trực tiếp, dữ liệu nằm ngay trong URL */
export function DirectCardPage() {
  const { hash } = useLocation()
  const card = decodeCard(hash.replace(/^#/, ''))

  if (!card) {
    return <MessageScreen kind="invalid" />
  }
  return <CardScreen card={card} cardUrl={window.location.href} />
}

type SlugState = { slug: string } & (
  { status: 'loading' } | { status: 'found'; card: CardData } | { status: 'not-found' } | { status: 'error' }
)

/** /<slug> — link rút gọn, dữ liệu lấy từ public/cards/<slug>.json */
export function ShortCardPage() {
  const { slug = '' } = useParams()
  const [state, setState] = useState<SlugState>({ slug, status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetchCardBySlug(slug, controller.signal)
      .then((result) => setState({ slug, ...result }))
      .catch(() => {
        /* bị huỷ khi chuyển trang */
      })
    return () => controller.abort()
  }, [slug])

  // Khi đổi slug, bỏ qua kết quả cũ cho tới khi có kết quả mới
  const current: SlugState = state.slug === slug ? state : { slug, status: 'loading' }

  switch (current.status) {
    case 'loading':
      return (
        <main className="flex min-h-dvh items-center justify-center bg-slate-100">
          <Loader2 className="text-brand size-8 animate-spin" aria-label="Loading" />
        </main>
      )
    case 'found':
      return <CardScreen card={current.card} verified cardUrl={shortLink(slug)} />
    case 'not-found':
      return <MessageScreen kind="notFound" />
    case 'error':
      return <MessageScreen kind="error" />
  }
}
