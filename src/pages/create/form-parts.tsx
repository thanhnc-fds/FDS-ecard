import type { ComponentType, ReactNode, SVGProps } from 'react'
import { CircleAlert } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Section({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6', className)}>
      <div className="mb-5 flex items-start gap-3">
        <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-slate-700">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p id={hintId} role="alert" className="text-destructive flex items-center gap-1 text-xs">
          <CircleAlert className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Ô nhập có phần chữ cố định phía trước, ví dụ "@" hoặc "ecard.fds.vn/" */
export function InputGroup({
  prefix,
  children,
  invalid,
}: {
  prefix: ReactNode
  children: ReactNode
  invalid?: boolean
}) {
  return (
    <div
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/50 flex h-10 items-center overflow-hidden rounded-lg border bg-white transition-colors focus-within:ring-3',
        invalid && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
      )}
    >
      <span className="flex h-full max-w-[50%] shrink-0 items-center truncate border-r bg-slate-50 px-3 text-sm text-slate-500">
        {prefix}
      </span>
      <div className="min-w-0 flex-1 [&_input]:h-full [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none [&_input]:ring-0 [&_input]:focus-visible:ring-0">
        {children}
      </div>
    </div>
  )
}
