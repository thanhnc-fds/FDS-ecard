import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/card'

type Props = {
  name: string
  src?: string
  className?: string
}

/** Bảng màu nền cho avatar chữ (kiểu Telegram/Google): mỗi tên luôn ra cùng một màu */
const PALETTE = [
  ['#FF885E', '#FF516A'], // đỏ cam
  ['#FFCD6A', '#FFA85C'], // cam
  ['#E0A2F3', '#D669ED'], // tím
  ['#A0DE7E', '#54CB68'], // xanh lá
  ['#53EDD6', '#28C9B7'], // xanh ngọc
  ['#72D5FD', '#2A9EF1'], // xanh dương
  ['#FFA8A8', '#FF719A'], // hồng
] as const

function avatarColors(name: string): readonly [string, string] {
  let hash = 0
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  return PALETTE[hash % PALETTE.length]
}

/**
 * Ảnh đại diện tròn. Chưa có ảnh → chữ viết tắt trên nền màu theo tên (giống Telegram/Google).
 * Ảnh lỗi (link Drive chưa bật chia sẻ, mất mạng…) → cũng quay về chữ viết tắt.
 * Kích thước chữ viết tắt lấy theo `text-*` truyền qua className.
 */
export function Avatar({ name, src: rawSrc, className }: Props) {
  const initials = getInitials(name)
  const [from, to] = avatarColors(name)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const src = rawSrc && rawSrc !== failedSrc ? rawSrc : undefined
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-300 text-white',
        className,
      )}
      style={initials && !src ? { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` } : undefined}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
          draggable={false}
        />
      ) : initials ? (
        <span className="font-semibold tracking-wide drop-shadow-sm">{initials}</span>
      ) : (
        <UserRound className="size-1/2" />
      )}
    </div>
  )
}
