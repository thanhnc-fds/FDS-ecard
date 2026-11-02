/**
 * Mã QR có logo FDS ở giữa.
 * File này được tải RIÊNG (lazy) — trang danh thiếp chỉ tải khi người xem bấm "Mã QR".
 */
import { useEffect, useRef } from 'react'
import QRCodeStyling, { type Options } from 'qr-code-styling'
import { company } from '@/config/company'
import { downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'

function qrOptions(data: string, size: number, type: 'svg' | 'canvas'): Options {
  // Link ngắn → mức sửa lỗi cao nhất (H) để logo che giữa vẫn quét tốt.
  // Link dài (link trực tiếp) → mức Q + logo nhỏ hơn để QR không quá dày.
  const isLong = data.length > 120
  return {
    type,
    width: size,
    height: size,
    data,
    margin: Math.round(size * 0.04),
    image: company.logoMark,
    qrOptions: { errorCorrectionLevel: isLong ? 'Q' : 'H' },
    imageOptions: { imageSize: isLong ? 0.22 : 0.3, margin: Math.round(size * 0.012), hideBackgroundDots: true },
    // Chấm vuông: quét ổn định hơn chấm bo tròn khi có logo ở giữa (đã kiểm tra ở nhiều kích thước)
    dotsOptions: { type: 'square', color: company.brandColorDark },
    cornersSquareOptions: { type: 'extra-rounded', color: company.brandColor },
    cornersDotOptions: { type: 'dot', color: company.brandColor },
    backgroundOptions: { color: '#ffffff' },
  }
}

type Props = {
  value: string
  size?: number
  className?: string
}

/**
 * Thư viện làm tròn mỗi ô QR về số nguyên pixel → vẽ ở kích thước nhỏ (100px) thì QR bị co lại,
 * thừa viền trắng. Vì vậy luôn vẽ SVG ở độ phân giải cao rồi thu nhỏ bằng CSS (SVG không vỡ nét).
 */
const RENDER_SIZE = 600

export default function QrCode({ value, size = 240, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const qr = new QRCodeStyling(qrOptions(value, Math.max(RENDER_SIZE, size), 'svg'))
    container.replaceChildren()
    qr.append(container)
    return () => container.replaceChildren()
  }, [value, size])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Mã QR danh thiếp"
      className={cn('[&>svg]:size-full', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Tải QR: PNG 1024px (gửi chat, in nhỏ) hoặc SVG (in ấn, không vỡ nét) */
export async function downloadQr(value: string, format: 'png' | 'svg', filename: string): Promise<void> {
  const qr = new QRCodeStyling(qrOptions(value, format === 'png' ? 1024 : 512, format === 'png' ? 'canvas' : 'svg'))
  const data = await qr.getRawData(format)
  if (!data) throw new Error('Không tạo được mã QR')
  const blob = data instanceof Blob ? data : new Blob([new Uint8Array(data)], { type: `image/${format}` })
  downloadBlob(blob, `${filename}.${format}`)
}
