import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Eye, FolderOpen, Link2, Lock, Phone, RotateCcw, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { CardView } from '@/components/card/card-view'
import { TelegramIcon, ZaloIcon } from '@/components/brand-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toaster } from '@/components/ui/sonner'
import { Switch } from '@/components/ui/switch'
import { company, getOffice } from '@/config/company'
import { LIMITS, parseCardData } from '@/lib/card'
import { cardFormSchema, cardToForm, emptyFormValues, formToCard, type CardFormValues } from '@/lib/card-form'
import type { Lang } from '@/lib/i18n'
import { shortLink, siteOrigin } from '@/lib/links'
import { formatVnPhone, normalizeVnPhone } from '@/lib/phone'
import { isValidSlug, removeVietnameseTones, slugify } from '@/lib/slug'
import { normalizeTelegram, normalizeWebsite } from '@/lib/social'
import { useCardActions } from '../use-card-actions'
import { AvatarField } from './avatar-field'
import { clearDraft, loadDraft, saveDraft } from './draft'
import { Field, InputGroup, Section } from './form-parts'
import { ResultPanel } from './result-panel'

const FIELD_LABELS: Record<keyof CardFormValues, string> = {
  name: 'Họ và tên',
  title: 'Chức danh',
  titleEn: 'Chức danh tiếng Anh',
  phone: 'Số điện thoại',
  email: 'Email',
  telegram: 'Telegram',
  zalo: 'Zalo',
  telegramOn: 'Telegram',
  website: 'Website',
  office: 'Văn phòng',
  slug: 'Đường dẫn rút gọn',
  avatar: 'Ảnh đại diện',
}

/** Khi gõ slug: bỏ dấu, chữ thường, khoảng trắng → "-" (vẫn cho gõ "-" ở cuối) */
function sanitizeSlugInput(value: string): string {
  return removeVietnameseTones(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-/, '')
    .slice(0, 50)
}

export default function CreatePage() {
  const [initial] = useState(loadDraft)
  const [slugTouched, setSlugTouched] = useState(initial.slugTouched)
  const [confirmReset, setConfirmReset] = useState(false)
  const [previewLang, setPreviewLang] = useState<Lang>('vi')
  const importRef = useRef<HTMLInputElement>(null)

  const {
    register,
    control,
    setValue,
    getFieldState,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: initial.values,
    mode: 'onTouched',
  })

  const watched = useWatch({ control })
  const values: CardFormValues = { ...emptyFormValues, ...watched }
  const card = formToCard(values)
  // Khung xem trước bấm thử được: gọi, Zalo, Telegram, lưu danh bạ, phóng to QR
  const previewUrl = isValidSlug(card.slug) ? shortLink(card.slug) : undefined
  const previewActions = useCardActions({ card, cardUrl: previewUrl, lang: previewLang })
  const validation = cardFormSchema.safeParse(values)
  const missing = validation.success
    ? []
    : [...new Set(validation.error.issues.map((i) => FIELD_LABELS[i.path[0] as keyof CardFormValues]))]

  useEffect(() => {
    document.title = `Tạo danh thiếp điện tử · ${company.shortName}`
  }, [])

  // Tự tạo đường dẫn theo tên cho tới khi người dùng tự sửa
  useEffect(() => {
    if (slugTouched) return
    setValue('slug', slugify(values.name), { shouldValidate: getFieldState('slug').isTouched })
  }, [values.name, slugTouched, setValue, getFieldState])

  // Lưu nháp (đợi ngừng gõ 300ms)
  const draftJson = JSON.stringify(values)
  useEffect(() => {
    const timer = setTimeout(() => saveDraft({ values: JSON.parse(draftJson), slugTouched }), 300)
    return () => clearTimeout(timer)
  }, [draftJson, slugTouched])

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const data = parseCardData(JSON.parse(await file.text()))
      if (!data) throw new Error('invalid')
      reset(cardToForm(data))
      setSlugTouched(Boolean(data.slug))
      toast.success('Đã mở file dữ liệu', { description: `${data.name} — chỉnh sửa rồi tải file mới để cập nhật` })
    } catch {
      toast.error('File không hợp lệ', { description: 'Hãy chọn file .json được tạo từ công cụ này' })
    }
  }

  function handleReset() {
    reset(emptyFormValues)
    setSlugTouched(false)
    clearDraft()
    setConfirmReset(false)
    toast.success('Đã xoá thông tin')
  }

  const host = siteOrigin().replace(/^https?:\/\//, '')

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <img src={company.logo} alt={company.shortName} className="h-7 w-auto" />
          <span className="h-6 w-px bg-slate-200" />
          <h1 className="truncate text-sm font-semibold sm:text-base">Tạo danh thiếp điện tử</h1>
          <div className="ml-auto flex gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => importRef.current?.click()}>
              <FolderOpen />
              <span className="hidden sm:inline">Mở file dữ liệu</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              <Trash2 />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void handleImport(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-6 lg:col-start-1">
          <Section icon={UserRound} title="Thông tin cá nhân">
            <div className="space-y-5">
              <Controller
                control={control}
                name="avatar"
                render={({ field }) => <AvatarField name={values.name} value={field.value} onChange={field.onChange} />}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Họ và tên" htmlFor="name" required error={errors.name?.message}>
                  <Input
                    id="name"
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    maxLength={LIMITS.name}
                    aria-invalid={!!errors.name}
                    className="h-10"
                    {...register('name')}
                  />
                </Field>
                <Field label="Chức danh" htmlFor="title" required error={errors.title?.message}>
                  <Input
                    id="title"
                    placeholder="Trưởng phòng Kinh doanh"
                    autoComplete="organization-title"
                    maxLength={LIMITS.title}
                    aria-invalid={!!errors.title}
                    className="h-10"
                    {...register('title')}
                  />
                </Field>
                <Field
                  label="Chức danh tiếng Anh"
                  htmlFor="titleEn"
                  error={errors.titleEn?.message}
                  hint="Không bắt buộc. Hiện cho người xem dùng điện thoại tiếng Anh (đối tác nước ngoài)."
                  className="sm:col-span-2"
                >
                  <Input
                    id="titleEn"
                    lang="en"
                    placeholder="Sales Manager"
                    maxLength={LIMITS.title}
                    aria-invalid={!!errors.titleEn}
                    className="h-10"
                    {...register('titleEn')}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section icon={Phone} title="Liên hệ">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Số điện thoại" htmlFor="phone" required error={errors.phone?.message}>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0909 123 456"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  className="h-10"
                  {...register('phone', {
                    onBlur: (e) => {
                      const normalized = normalizeVnPhone(e.target.value)
                      if (normalized) setValue('phone', formatVnPhone(normalized))
                    },
                  })}
                />
              </Field>
              <Field label="Email" htmlFor="email" required error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="ten@fadosolution.com"
                  autoComplete="email"
                  maxLength={LIMITS.email}
                  aria-invalid={!!errors.email}
                  className="h-10"
                  {...register('email')}
                />
              </Field>

              <Controller
                control={control}
                name="zalo"
                render={({ field }) => (
                  <label
                    htmlFor="zalo"
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 sm:col-span-2"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#0068FF]/10 text-[#0068FF]">
                      <ZaloIcon className="size-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">Liên hệ qua Zalo</span>
                      <span className="block text-xs text-slate-500">
                        Hiện nút Zalo, bấm vào mở app Zalo theo số điện thoại ở trên
                      </span>
                    </span>
                    <Switch id="zalo" checked={field.value} onCheckedChange={field.onChange} />
                  </label>
                )}
              />

              <Controller
                control={control}
                name="telegramOn"
                render={({ field }) => (
                  <div className="rounded-lg border border-slate-200 sm:col-span-2">
                    <label htmlFor="telegramOn" className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
                        <TelegramIcon className="size-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">Liên hệ qua Telegram</span>
                        <span className="block text-xs text-slate-500">Hiện nút Telegram, bấm vào mở app Telegram</span>
                      </span>
                      <Switch
                        id="telegramOn"
                        checked={field.value}
                        onCheckedChange={(on) => {
                          field.onChange(on)
                          // Tắt Telegram → bỏ username để không bị báo lỗi ở ô đã ẩn
                          if (!on) setValue('telegram', '', { shouldValidate: true })
                        }}
                      />
                    </label>
                    {field.value && (
                      <div className="border-t border-slate-100 px-3 pt-2.5 pb-3">
                        <Field
                          label="Username Telegram"
                          htmlFor="telegram"
                          error={errors.telegram?.message}
                          hint="Không bắt buộc. Để trống thì nút Telegram mở theo số điện thoại ở trên."
                        >
                          <InputGroup
                            prefix={<TelegramIcon className="size-4 text-[#229ED9]" />}
                            invalid={!!errors.telegram}
                          >
                            <Input
                              id="telegram"
                              placeholder="@username"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              aria-invalid={!!errors.telegram}
                              {...register('telegram', {
                                onBlur: (e) => {
                                  const username = normalizeTelegram(e.target.value)
                                  if (username) setValue('telegram', `@${username}`)
                                },
                              })}
                            />
                          </InputGroup>
                        </Field>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </Section>

          <Section icon={Building2} title="Công ty" description="Thông tin công ty được cố định cho toàn bộ nhân viên">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Công ty" className="sm:col-span-2">
                <div className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
                  <img src={company.logo} alt="" className="h-5 w-auto" />
                  <span className="flex-1 truncate text-sm font-medium">{company.fullName}</span>
                  <Lock className="size-3.5 text-slate-400" aria-label="Cố định" />
                </div>
              </Field>

              {company.offices.length > 1 ? (
                <Field
                  label="Văn phòng"
                  htmlFor="office"
                  hint={getOffice(values.office).address}
                  className="sm:col-span-2"
                >
                  <Controller
                    control={control}
                    name="office"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="office" className="h-10 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {company.offices.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              ) : (
                <Field label="Địa chỉ" className="sm:col-span-2">
                  <div className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="flex-1 text-sm">{company.offices[0].address}</span>
                    <Lock className="size-3.5 shrink-0 text-slate-400" aria-label="Cố định" />
                  </div>
                </Field>
              )}

              <Field
                label="Website"
                htmlFor="website"
                error={errors.website?.message}
                hint="Mặc định là website công ty, có thể đổi hoặc để trống"
                className="sm:col-span-2"
              >
                <Input
                  id="website"
                  type="url"
                  inputMode="url"
                  placeholder={company.website}
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={!!errors.website}
                  className="h-10"
                  {...register('website', {
                    onBlur: (e) => {
                      const url = normalizeWebsite(e.target.value)
                      if (url) setValue('website', url)
                    },
                  })}
                />
              </Field>
            </div>
          </Section>

          <Section icon={Link2} title="Đường dẫn rút gọn" description="Link cố định của danh thiếp, dùng để tạo mã QR">
            <Field
              label="Đường dẫn"
              htmlFor="slug"
              required
              error={errors.slug?.message}
              hint="Tự tạo theo họ tên. Không nên đổi sau khi đã in mã QR lên danh thiếp."
            >
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <InputGroup prefix={`${host}/`} invalid={!!errors.slug}>
                    <Controller
                      control={control}
                      name="slug"
                      render={({ field }) => (
                        <Input
                          id="slug"
                          placeholder="nguyen-van-a"
                          autoCapitalize="none"
                          spellCheck={false}
                          aria-invalid={!!errors.slug}
                          name={field.name}
                          ref={field.ref}
                          value={field.value}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            setSlugTouched(true)
                            field.onChange(sanitizeSlugInput(e.target.value))
                          }}
                        />
                      )}
                    />
                  </InputGroup>
                </div>
                {slugTouched && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={() => setSlugTouched(false)}
                    title="Tạo lại theo họ tên"
                  >
                    <RotateCcw />
                    <span className="hidden sm:inline">Theo tên</span>
                  </Button>
                )}
              </div>
            </Field>
          </Section>
        </form>

        {/* Xem trước: bên phải trên màn hình lớn, ngay sau form trên điện thoại */}
        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Eye className="size-4" />
            Xem trước
          </div>
          <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-300/40">
            {/* Màn hình lớn: card cao hơn màn hình thì cuộn bên trong để luôn nằm cạnh form */}
            <div className="[scrollbar-width:none] lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto">
              <CardView
                card={card}
                lang={previewLang}
                onLangChange={setPreviewLang}
                qrValue={previewUrl}
                onSaveContact={previewActions.saveContact}
                onQrClick={previewActions.openQr}
              />
              {previewActions.qrDialog}
            </div>
          </div>
        </aside>

        <div className="lg:col-start-1">
          <ResultPanel card={card} ready={validation.success} missing={missing} />
        </div>
      </main>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xoá toàn bộ thông tin?</DialogTitle>
            <DialogDescription>Thông tin đang nhập và ảnh đại diện sẽ bị xoá để tạo danh thiếp mới.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Xoá thông tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
