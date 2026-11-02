import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** File trong /public cần lưu sẵn để mở danh thiếp khi không có mạng */
const OFFLINE_PUBLIC_FILES = ['logo-fds.webp', 'favicon.png', 'manifest.webmanifest']

/** Trang chỉ nhân viên dùng (có mạng) → không bắt khách tải sẵn */
const SKIP_PRECACHE = /(create-page|print-page)/

/**
 * Tạo dist/sw.js từ sw/sw-template.js: điền danh sách file cần lưu sẵn + mã phiên bản.
 * Mã phiên bản đổi khi bất kỳ file nào đổi → điện thoại tự cập nhật bản mới.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: 'fds-offline-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const builtFiles = Object.keys(bundle).filter((f) => /\.(js|css|woff2)$/.test(f) && !SKIP_PRECACHE.test(f))
      const precache = ['/index.html', ...OFFLINE_PUBLIC_FILES.map((f) => `/${f}`), ...builtFiles.map((f) => `/${f}`)]

      const hash = createHash('sha256').update(precache.join('\n'))
      for (const f of OFFLINE_PUBLIC_FILES) hash.update(fs.readFileSync(path.resolve('public', f)))
      const version = hash.digest('hex').slice(0, 12)

      const template = fs.readFileSync(path.resolve('sw/sw-template.js'), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache, null, 2)),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), offlineServiceWorker()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
