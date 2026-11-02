import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 3 độ đậm: font-semibold (600) sẽ tự dùng bản 700 → bớt 1 file font cần tải
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/700.css'
import './index.css'
import { company } from '@/config/company'
import App from './App'

// Màu thương hiệu lấy từ config công ty (một nơi duy nhất để sửa)
document.documentElement.style.setProperty('--brand', company.brandColor)
document.documentElement.style.setProperty('--brand-dark', company.brandColorDark)
document.documentElement.style.setProperty('--brand-accent', company.accentColor)

// Chế độ offline: chỉ bật trên bản build (khi dev sẽ gây lỗi cập nhật nóng)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* trình duyệt không hỗ trợ / không chạy HTTPS → bỏ qua, web vẫn chạy bình thường */
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
