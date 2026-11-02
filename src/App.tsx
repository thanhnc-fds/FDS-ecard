import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Loader2 } from 'lucide-react'
import { DirectCardPage, ShortCardPage } from '@/pages/card-pages'
import { MessageScreen } from '@/pages/message-screen'

// Trang tạo được tải riêng: khách mở danh thiếp không phải tải code của form, cắt ảnh…
const CreatePage = lazy(() => import('@/pages/create/create-page'))
const PrintPage = lazy(() => import('@/pages/print/print-page'))

function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <Loader2 className="text-brand size-8 animate-spin" aria-label="Đang tải" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/card" element={<DirectCardPage />} />
          <Route path="/print" element={<PrintPage />} />
          <Route path="/print/:slug" element={<PrintPage />} />
          <Route path="/:slug" element={<ShortCardPage />} />
          <Route path="*" element={<MessageScreen kind="pageNotFound" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
