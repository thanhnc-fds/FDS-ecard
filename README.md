# Danh thiếp điện tử FDS

Công cụ tạo danh thiếp điện tử cho nhân viên FDS. **Chỉ có frontend**: không server, không database.

## Chạy local

```bash
npm install
npm run dev        # mở http://localhost:5173/create
```

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` | Build ra thư mục `dist/` (web tĩnh, dùng để deploy) |
| `npm run preview` | Chạy thử bản build |
| `npm test` | Chạy test các hàm lõi (SĐT, slug, mã hoá link, vCard) |
| `npm run lint` / `npm run format` | Kiểm tra / định dạng code |

## Các trang

| Đường dẫn | Mô tả |
|---|---|
| `/create` | Trang tạo danh thiếp (form + xem trước + link + QR) |
| `/<slug>` | **Link rút gọn**: đọc dữ liệu từ `public/cards/<slug>.json`, có ảnh và dấu xác minh |
| `/card#<dữ liệu>` | **Link trực tiếp**: dữ liệu nén ngay trong URL (kể cả ảnh Drive), dùng được ngay |
| `/print`, `/print/<slug>` | **Bản in danh thiếp giấy** 90×54mm (2 mặt, lề xén 3mm) → In → Lưu PDF |

## Thay thông tin công ty

Mọi thông tin cố định nằm trong **`src/config/company.ts`**: tên, website, địa chỉ (hỗ trợ nhiều văn phòng), màu thương hiệu.

Logo nằm trong `public/`:

| File | Dùng ở đâu |
|---|---|
| `fds_logo.png` | File gốc (1149×451, 541KB). Không dùng trực tiếp vì quá nặng |
| `logo-fds.webp` | Bản tối ưu (480px, ~32KB): đầu danh thiếp, header, giữa mã QR |
| `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Icon tab trình duyệt / màn hình chính điện thoại |
| `manifest.webmanifest` | Thông tin khi thêm vào màn hình chính |
| `_headers` | Cấu hình cache cho Cloudflare Pages (dùng khi deploy) |

Ảnh bìa nửa trên danh thiếp: đặt ảnh vào `public/` rồi điền `cover` trong `src/config/company.ts`. Bỏ trống thì hiện logo trên nền sáng.

## Ảnh đại diện (link Google Drive)

Nhân viên tải ảnh lên Google Drive, bật chia sẻ **"Bất kỳ ai có đường liên kết"** rồi dán link vào trang tạo. Danh thiếp chỉ lưu mã file nên link trực tiếp vẫn ngắn mà vẫn có ảnh. Trang tạo thử tải ảnh ngay và báo nếu link sai hoặc chưa bật chia sẻ.

Web tự đổi link chia sẻ sang `lh3.googleusercontent.com/d/<mã file>=s320-c-rj` (ảnh vuông 320px, JPEG ~20KB). Xử lý trong `src/lib/avatar-url.ts`.

- Ảnh lỗi (chưa chia sẻ, file bị xoá) → card tự hiện chữ viết tắt.
- Ảnh được tải về nhúng vào file danh bạ .vcf, và được service worker lưu lại để xem khi không có mạng.
- Đổi ảnh mà giữ link: trên Drive chọn "Quản lý phiên bản" → tải ảnh mới lên.
- Dạng link `lh3` Google không công bố chính thức. Nếu sau này Google đổi, chỉ cần sửa `driveImageUrl()`; dữ liệu cũ chỉ lưu mã file nên vẫn dùng được.

## Bấm để liên hệ

Mỗi dòng thông tin trên card bấm được: số điện thoại → gọi luôn, email → mở app mail, website → mở web, địa chỉ → Google Maps. Cuối dòng số điện thoại có 2 nút nhỏ:

| Nút | Link | Bấm trên điện thoại |
|---|---|---|
| Zalo | `https://zalo.me/0…` | Mở app Zalo, đúng người theo số điện thoại |
| Telegram | `https://t.me/<username>`, không có username thì `https://t.me/+84…` | Mở app Telegram |

Zalo và Telegram bật/tắt riêng ở trang tạo. Telegram theo số điện thoại chỉ mở được nếu người đó để mục "Ai có thể tìm tôi bằng số điện thoại" là Mọi người (mặc định của Telegram).

## Lưu danh bạ

Nút **Lưu danh bạ** tạo file `.vcf` (vCard 3.0) ngay trên máy người xem, không gửi đi đâu. File gồm họ tên, chức danh, công ty, SĐT, email, website, địa chỉ, Telegram, ảnh đại diện và link danh thiếp.

- **iPhone (Safari):** hiện bảng xem trước liên hệ → "Tạo liên hệ mới" → lưu vào Danh bạ (đồng bộ iCloud nếu bật).
- **Android (Chrome):** tải file về → bấm thông báo/file vừa tải → app Danh bạ mở ra → chọn tài khoản lưu (thường là Google).
- **Máy tính:** file nằm trong thư mục Tải về, mở bằng Outlook / Danh bạ Windows / Contacts (macOS).
- **Mở trong Zalo, Facebook, Messenger…:** trình duyệt trong app có thể không tải được file. Sau khi bấm, card hiện hướng dẫn "Mở bằng trình duyệt".

## Bố cục danh thiếp

Card gọn cỡ điện thoại (máy tính cũng hiện cỡ này, căn giữa), trong `src/components/card/card-view.tsx`:

1. Thanh trên: logo bên trái, nút VI/EN bên phải, dưới là vạch màu thương hiệu xanh → cam
2. Ảnh đại diện + tên, chức danh, công ty nằm ngang
3. Thông tin liên hệ chiếm hết chiều ngang, bấm từng dòng để gọi / gửi mail / mở web / chỉ đường
4. Khối xanh thương hiệu: mã QR (bấm để phóng to) + nút **Lưu danh bạ**

Có hiệu ứng nhẹ khi mở card, rê chuột và bấm; tự tắt nếu điện thoại bật "Giảm chuyển động". Khung xem trước ở trang tạo bấm thử được như card thật.

## Song ngữ Việt – Anh

- Người xem dùng điện thoại tiếng Việt thấy bản tiếng Việt, còn lại thấy bản tiếng Anh. Có nút VI/EN nhỏ ở góc card. Muốn mở sẵn bản tiếng Anh thì thêm `?lang=en` vào link.
- Nhân viên nhập thêm **Chức danh tiếng Anh** (không bắt buộc). Tên công ty, nhãn và địa chỉ văn phòng tiếng Anh nằm trong `src/config/company.ts` (`fullNameEn`, `labelEn`, `addressEn`).
- File danh bạ (.vcf) cũng theo ngôn ngữ của người lưu.

## Mở danh thiếp khi không có mạng

Bản build có service worker: khuôn mẫu ở `sw/sw-template.js`, được `vite.config.ts` điền danh sách file và xuất ra `dist/sw.js`.

- Mở danh thiếp một lần khi có mạng, lần sau mở được khi mất mạng (kể cả từ icon trên màn hình chính).
- Có mạng thì luôn lấy dữ liệu mới nhất. Mạng chậm quá 3,5 giây thì dùng bản đã lưu.
- Chỉ chạy trên HTTPS hoặc localhost, và **không chạy khi `npm run dev`**. Muốn thử thì dùng `npm run build` rồi `npm run preview`.

## Danh thiếp giấy

Ở trang tạo, bấm **Mở bản in**. Trang in có 2 mặt khổ 90×54mm, chọn được có hoặc không lề xén 3mm, bản tiếng Việt hoặc tiếng Anh. Bấm **In / Lưu PDF** rồi chọn "Lưu dưới dạng PDF", lề "Không", tỉ lệ 100%. Gửi file PDF cho nhà in.

## Kích hoạt link rút gọn cho nhân viên

1. Nhân viên vào `/create`, điền thông tin rồi bấm **Tải file dữ liệu**, nhận được `<slug>.json`
2. Admin đặt file vào `public/cards/`
3. Local: link chạy ngay. Production: chạy sau khi deploy lại

Muốn sửa thông tin: bấm **Mở file dữ liệu** để mở lại file JSON, sửa, tải file mới rồi ghi đè file cũ. Link và QR giữ nguyên.

Mỗi nhân viên là một file riêng, không có file danh sách tổng, nên người ngoài không tải được toàn bộ danh bạ công ty.

## Cấu trúc

```
src/
  config/company.ts        thông tin công ty (cố định)
  lib/                     hàm lõi, không phụ thuộc giao diện (có test)
    card.ts                kiểu dữ liệu + kiểm tra dữ liệu từ bên ngoài
    card-form.ts           schema form (chỉ trang tạo dùng)
    codec.ts               mã hoá/giải mã link trực tiếp
    phone.ts, social.ts    chuẩn hoá SĐT VN, Telegram, website
    vcard.ts               tạo file .vcf
  components/card/         giao diện danh thiếp (dùng chung cho xem trước và trang thật)
  components/qr-code.tsx   mã QR có logo (tải riêng khi cần)
  pages/create/            trang tạo
  pages/card-*.tsx         trang danh thiếp khách xem
public/cards/              dữ liệu link rút gọn (mỗi nhân viên 1 file)
```
