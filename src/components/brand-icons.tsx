import type { SVGProps } from 'react'
import { siTelegram, siZalo } from 'simple-icons'

type SimpleIcon = { title: string; path: string }

function createBrandIcon(icon: SimpleIcon) {
  function BrandIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d={icon.path} />
      </svg>
    )
  }
  BrandIcon.displayName = `${icon.title}Icon`
  return BrandIcon
}

export const TelegramIcon = createBrandIcon(siTelegram)
export const ZaloIcon = createBrandIcon(siZalo)
