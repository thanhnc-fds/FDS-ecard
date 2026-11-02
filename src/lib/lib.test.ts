import { describe, expect, it } from 'vitest'
import { company } from '@/config/company'
import { getInitials, parseCardData, type CardData } from './card'
import { cardFormSchema, emptyFormValues, formToCard } from './card-form'
import { decodeCard, encodeCard } from './codec'
import { formatVnPhone, normalizeVnPhone, toNationalPhone } from './phone'
import { isValidSlug, slugify } from './slug'
import { normalizeTelegram, normalizeWebsite, telegramLink } from './social'
import { buildVCard, escapeVCardText, foldLine } from './vcard'
import { driveImageUrl, getDriveId, parseAvatarLink } from './avatar-url'

const DRIVE_ID = '1BuAhG2rGTQapo9TKMadgbxCtCdfkfy4y'
const DRIVE_IMG = `https://lh3.googleusercontent.com/d/${DRIVE_ID}=s320-c-rj`

const sample: CardData = {
  slug: 'nguyen-van-duc',
  name: 'Nguyễn Văn Đức',
  title: 'Trưởng phòng Kinh doanh',
  phone: '+84909123456',
  email: 'duc.nguyen@fadosolution.com',
  telegram: 'ducnguyen',
  zalo: true,
  website: company.website,
  office: company.offices[0].id,
}

describe('slugify', () => {
  it('bỏ dấu tiếng Việt, kể cả chữ đ/Đ', () => {
    expect(slugify('Nguyễn Văn Đức')).toBe('nguyen-van-duc')
    expect(slugify('  Trần   Thị Ánh-Nguyệt  ')).toBe('tran-thi-anh-nguyet')
    expect(slugify('Lê Hoàng (Sales) #1')).toBe('le-hoang-sales-1')
  })
  it('kiểm tra slug hợp lệ và chặn tên dành riêng', () => {
    expect(isValidSlug('nguyen-van-a')).toBe(true)
    expect(isValidSlug('a')).toBe(false)
    expect(isValidSlug('Nguyen')).toBe(false)
    expect(isValidSlug('nguyen--a')).toBe(false)
    expect(isValidSlug('create')).toBe(false)
    expect(isValidSlug('card')).toBe(false)
  })
})

describe('số điện thoại', () => {
  it.each([
    ['0909123456', '+84909123456'],
    ['0909.123.456', '+84909123456'],
    ['0909 123 456', '+84909123456'],
    ['+84 909 123 456', '+84909123456'],
    ['84909123456', '+84909123456'],
    ['(028) 3823 4567', '+842838234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeVnPhone(input)).toBe(expected)
  })
  it.each(['', '12345', '0109123456', '090912345', '09091234567', 'abc0909123456', '+1 202 555 0100'])(
    'từ chối %s',
    (input) => expect(normalizeVnPhone(input)).toBeNull(),
  )
  it('định dạng hiển thị', () => {
    expect(formatVnPhone('+84909123456')).toBe('0909 123 456')
    expect(formatVnPhone('+842838234567')).toBe('028 3823 4567')
    expect(toNationalPhone('+84909123456')).toBe('0909123456')
  })
})

describe('telegram & website', () => {
  it.each(['ducnguyen', '@ducnguyen', 't.me/ducnguyen', 'https://t.me/ducnguyen/'])('telegram %s', (input) => {
    expect(normalizeTelegram(input)).toBe('ducnguyen')
  })
  it('từ chối username sai', () => {
    expect(normalizeTelegram('abc')).toBeNull()
    expect(normalizeTelegram('1abcde')).toBeNull()
    expect(normalizeTelegram('bad name')).toBeNull()
  })
  it('website: thêm https, chặn link nguy hiểm', () => {
    expect(normalizeWebsite('fadosolution.com')).toBe('https://fadosolution.com')
    expect(normalizeWebsite('http://abc.vn/path/')).toBe('http://abc.vn/path')
    expect(normalizeWebsite('javascript:alert(1)')).toBeNull()
    expect(normalizeWebsite('localhost')).toBeNull()
    expect(normalizeWebsite('')).toBeNull()
  })
})

describe('link trực tiếp (encode/decode)', () => {
  it('mã hoá rồi giải mã giữ nguyên dữ liệu (trừ slug)', () => {
    expect(decodeCard(encodeCard(sample))).toEqual({ ...sample, slug: '' })
  })
  it('Telegram theo số điện thoại', () => {
    const card = { ...sample, telegram: undefined, telegramPhone: true }
    expect(decodeCard(encodeCard(card))?.telegramPhone).toBe(true)
    expect(telegramLink(card)).toBe('https://t.me/+84909123456')
    expect(telegramLink(sample)).toBe('https://t.me/ducnguyen')
    expect(telegramLink({ ...sample, telegram: undefined })).toBeNull()
  })
  it('giữ đúng trạng thái "không có website"', () => {
    const decoded = decodeCard(encodeCard({ ...sample, website: undefined }))
    expect(decoded?.website).toBeUndefined()
  })
  it('link đủ ngắn để tạo QR', () => {
    expect(encodeCard(sample).length).toBeLessThan(400)
  })
  it('ảnh Drive đi kèm link trực tiếp, chỉ tốn thêm mã file', () => {
    const withPhoto = encodeCard({ ...sample, avatar: DRIVE_IMG })
    expect(decodeCard(withPhoto)?.avatar).toBe(DRIVE_IMG)
    expect(withPhoto.length - encodeCard(sample).length).toBeLessThan(70)
  })
  it('link ảnh khác (https) cũng đi kèm', () => {
    const avatar = 'https://fadosolution.com/team/a.jpg'
    expect(decodeCard(encodeCard({ ...sample, avatar }))?.avatar).toBe(avatar)
  })
  it('trả về null với dữ liệu hỏng thay vì lỗi', () => {
    expect(decodeCard('')).toBeNull()
    expect(decodeCard('khong-hop-le')).toBeNull()
    expect(decodeCard(encodeCard(sample).slice(0, 20))).toBeNull()
  })
})

describe('parseCardData (dữ liệu từ bên ngoài)', () => {
  it('chuẩn hoá lại và bỏ giá trị nguy hiểm', () => {
    const card = parseCardData({
      ...sample,
      phone: '0909 123 456',
      website: 'javascript:alert(1)',
      avatar: 'data:text/html;base64,PHNjcmlwdD4=',
      office: 'khong-ton-tai',
    })
    expect(card?.phone).toBe('+84909123456')
    expect(card?.website).toBeUndefined()
    expect(card?.avatar).toBeUndefined()
    expect(card?.office).toBe(company.offices[0].id)
  })
  it('ảnh: chỉ nhận link https, chuẩn hoá link Drive', () => {
    expect(parseCardData({ ...sample, avatar: 'data:image/jpeg;base64,AAAA' })?.avatar).toBeUndefined()
    expect(parseCardData({ ...sample, avatar: `https://drive.google.com/file/d/${DRIVE_ID}/view` })?.avatar).toBe(
      DRIVE_IMG,
    )
    expect(parseCardData({ ...sample, avatar: 'http://abc.vn/a.jpg' })?.avatar).toBeUndefined()
    expect(parseCardData({ ...sample, avatar: 'javascript:alert(1)' })?.avatar).toBeUndefined()
  })
  it('từ chối thiếu field bắt buộc', () => {
    expect(parseCardData({ ...sample, email: 'sai-email' })).toBeNull()
    expect(parseCardData({ ...sample, name: '   ' })).toBeNull()
    expect(parseCardData(null)).toBeNull()
  })
})

describe('form', () => {
  it('báo lỗi tiếng Việt', () => {
    const result = cardFormSchema.safeParse({ ...emptyFormValues, phone: '123' })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((i) => i.message)
    expect(messages).toContain('Vui lòng nhập họ và tên')
    expect(messages).toContain('Số điện thoại Việt Nam không hợp lệ')
  })
  it('form hợp lệ → dữ liệu chuẩn', () => {
    const values = {
      ...emptyFormValues,
      name: '  Nguyễn   Văn Đức ',
      title: 'Trưởng phòng Kinh doanh',
      phone: '0909.123.456',
      email: 'Duc.Nguyen@fadosolution.com',
      telegramOn: true,
      telegram: '@ducnguyen',
      slug: 'nguyen-van-duc',
    }
    expect(cardFormSchema.safeParse(values).success).toBe(true)
    expect(formToCard(values)).toEqual(sample)
    // Bật Telegram, không có username → mở theo số điện thoại
    expect(formToCard({ ...values, telegram: '' })).toMatchObject({ telegram: undefined, telegramPhone: true })
    // Tắt Telegram → bỏ qua username
    expect(formToCard({ ...values, telegramOn: false })).toMatchObject({
      telegram: undefined,
      telegramPhone: undefined,
    })
  })
  it('chữ viết tắt', () => {
    expect(getInitials('Nguyễn Văn Đức')).toBe('NĐ')
    expect(getInitials('An')).toBe('AN')
    expect(getInitials('')).toBe('')
  })
})

describe('vCard', () => {
  it('escape ký tự đặc biệt', () => {
    expect(escapeVCardText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
  })
  it('gập dòng ≤ 75 byte, không cắt đôi ký tự có dấu', () => {
    const folded = foldLine('NOTE:' + 'ễ'.repeat(60))
    const encoder = new TextEncoder()
    for (const line of folded.split('\r\n')) expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
    expect(folded.replace(/\r\n /g, '')).toBe('NOTE:' + 'ễ'.repeat(60))
  })
  it('có đủ thông tin và ảnh', () => {
    const vcf = buildVCard(sample, {
      office: company.offices[0],
      cardUrl: 'https://example.com/nguyen-van-duc',
      photo: 'data:image/jpeg;base64,' + 'A'.repeat(200),
    })
    const unfolded = vcf.replace(/\r\n /g, '')
    expect(vcf.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true)
    expect(unfolded).toContain('FN:Nguyễn Văn Đức')
    expect(unfolded).toContain('TEL;TYPE=CELL,VOICE:+84909123456')
    expect(unfolded).toContain('X-SOCIALPROFILE;TYPE=telegram:https://t.me/ducnguyen')
    expect(unfolded).toContain('PHOTO;ENCODING=b;TYPE=JPEG:' + 'A'.repeat(200))
    expect(vcf.endsWith('END:VCARD\r\n')).toBe(true)
  })
})

describe('song ngữ', () => {
  const bilingual: CardData = { ...sample, titleEn: 'Sales Manager' }
  it('link trực tiếp giữ chức danh tiếng Anh', () => {
    expect(decodeCard(encodeCard(bilingual))?.titleEn).toBe('Sales Manager')
  })
  it('vCard tiếng Anh dùng chức danh và địa chỉ tiếng Anh', () => {
    const office = company.offices[0]
    const en = buildVCard(bilingual, { office, lang: 'en', cardUrl: 'https://x.vn/a' }).replace(/\r\n /g, '')
    expect(en).toContain('TITLE:Sales Manager')
    expect(en).toContain('NOTE:Digital business card: https://x.vn/a')
    if (office.addressEn) expect(en).toContain(escapeVCardText(office.addressEn))
    const vi = buildVCard(bilingual, { office, lang: 'vi' }).replace(/\r\n /g, '')
    expect(vi).toContain('TITLE:Trưởng phòng Kinh doanh')
  })
  it('thiếu bản tiếng Anh → dùng tiếng Việt', () => {
    const en = buildVCard(sample, { office: company.offices[0], lang: 'en' }).replace(/\r\n /g, '')
    expect(en).toContain('TITLE:Trưởng phòng Kinh doanh')
  })
})

describe('link ảnh đại diện', () => {
  it('nhận các dạng link Google Drive', () => {
    const links = [
      `https://drive.google.com/file/d/${DRIVE_ID}/view?usp=sharing`,
      `https://drive.google.com/file/d/${DRIVE_ID}/view?usp=drive_link`,
      `https://drive.google.com/file/u/1/d/${DRIVE_ID}/view`,
      `https://drive.google.com/open?id=${DRIVE_ID}`,
      `https://drive.google.com/uc?export=view&id=${DRIVE_ID}`,
      `https://drive.google.com/thumbnail?id=${DRIVE_ID}&sz=w1000`,
      `https://lh3.googleusercontent.com/d/${DRIVE_ID}=w400`,
      `  https://drive.google.com/file/d/${DRIVE_ID}/view  `,
    ]
    for (const link of links) expect(parseAvatarLink(link)).toEqual({ ok: true, url: DRIVE_IMG })
  })
  it('nhận ra mã file từ link ảnh chuẩn', () => {
    expect(getDriveId(driveImageUrl(DRIVE_ID))).toBe(DRIVE_ID)
    expect(getDriveId('https://example.com/a.jpg')).toBeNull()
  })
  it('báo lỗi rõ ràng: thư mục, tài liệu, link sai', () => {
    expect(parseAvatarLink('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv')).toEqual({
      ok: false,
      reason: 'folder',
    })
    expect(parseAvatarLink('https://docs.google.com/document/d/1AbC/edit')).toEqual({ ok: false, reason: 'notImage' })
    expect(parseAvatarLink('http://abc.vn/a.jpg')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseAvatarLink('anh cua toi')).toEqual({ ok: false, reason: 'invalid' })
  })
})
