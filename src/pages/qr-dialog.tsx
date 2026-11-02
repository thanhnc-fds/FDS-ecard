/**
 * Mã QR phóng to (chạm vào QR trên danh thiếp) — để người khác quét từ màn hình điện thoại.
 * Tải riêng (lazy) khi cần.
 */
import QrCode from '@/components/qr-code'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  title: string
  description: string
}

export default function QrDialog({ open, onOpenChange, value, title, description }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] gap-3 p-5 text-center sm:max-w-sm">
        <DialogTitle className="text-lg">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {/* QR to nhất có thể: vừa chiều ngang màn hình, tối đa 320px */}
        <div className="mx-auto mt-1 w-full max-w-[346px] rounded-2xl border bg-white p-3 shadow-sm">
          <QrCode value={value} size={320} className="aspect-square h-auto! w-full!" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
