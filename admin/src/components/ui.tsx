import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import tw, { styled } from 'twin.macro'
import { Check, Close, Eye, EyeOff } from './icons'
import { api } from '../api'

/* ------------------------------------------------------------------ */
/* Botões                                                              */
/* ------------------------------------------------------------------ */

type Variant = 'sun' | 'pine' | 'ghost' | 'danger'

export const Button = styled('button', { shouldForwardProp: (p) => p !== 'variant' })<{ variant?: Variant }>(({ variant = 'pine' }) => [
  tw`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-semibold transition-all duration-200 cursor-pointer border-0`,
  tw`focus-visible:(outline-none ring-2 ring-offset-2 ring-sun-500)`,
  tw`disabled:(opacity-50 cursor-not-allowed)`,
  variant === 'sun' && tw`bg-sun-500 text-white shadow-[0_10px_24px_-10px_rgba(240,122,42,.8)] hover:enabled:bg-sun-600`,
  variant === 'pine' && tw`bg-pine-800 text-white hover:enabled:bg-pine-700`,
  variant === 'ghost' && tw`bg-transparent text-pine-800 border-[1.5px] border-solid border-pine-800/25 hover:enabled:(border-pine-800 bg-white)`,
  variant === 'danger' && tw`bg-[#B42318] text-white hover:enabled:bg-[#912018]`,
])

/* ------------------------------------------------------------------ */
/* Campos                                                              */
/* ------------------------------------------------------------------ */

const inputCss = tw`w-full rounded-2xl border-[1.5px] border-solid border-line bg-white px-4 py-3.5 font-sans text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:(border-pine-700 ring-4 ring-pine-700/10)`

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div tw="flex flex-col gap-1.5">
      <label htmlFor={id} tw="font-sans text-[13px] font-semibold text-pine-900">{label}</label>
      {children(id)}
      {hint && <p tw="font-sans text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => <input css={inputCss} {...props} />

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false)
  return (
    <div tw="relative">
      <input css={[inputCss, tw`pr-12`]} type={show ? 'text' : 'password'} spellCheck={false} autoCapitalize="off" {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
        tw="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:(bg-mist text-pine-800)"
      >
        {show ? <EyeOff width={19} height={19} /> : <Eye width={19} height={19} />}
      </button>
    </div>
  )
}

/** Aviso de erro com a voz da Laura: o que aconteceu e o que fazer. */
export const Alert = ({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    css={[
      tw`rounded-2xl px-4 py-3 font-sans text-[13.5px] leading-relaxed`,
      tone === 'error' ? tw`bg-[#FEF3F2] text-[#912018]` : tw`bg-mist text-pine-900`,
    ]}
  >
    {children}
  </div>
)

/* ------------------------------------------------------------------ */
/* Força da senha (o servidor dá a palavra final: tamanho e vazamentos) */
/* ------------------------------------------------------------------ */

export function passwordScore(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length
  const unique = new Set(p).size
  if (p.length < 12 || unique < 5) return 1
  let score = 2
  if (p.length >= 16 || kinds >= 3) score = 3
  if (p.length >= 20 && kinds >= 2 && unique >= 10) score = 4
  return score as 2 | 3 | 4
}

const STRENGTH = [
  { label: '', color: '#E2E6E1' },
  { label: 'Fraca', color: '#D92D20' },
  { label: 'Ok', color: '#F79009' },
  { label: 'Boa', color: '#1E6A64' },
  { label: 'Excelente', color: '#15803D' },
]

export function StrengthMeter({ password }: { password: string }) {
  // A regra de verdade fica no servidor (lista de senhas vazadas, nome no meio…): pergunta a ele.
  const [problem, setProblem] = useState<{ for: string; text: string | null } | null>(null)
  useEffect(() => {
    if (password.length < 12) return
    const t = setTimeout(() => {
      api.checkPassword(password).then((r) => setProblem({ for: password, text: r.problem })).catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [password])
  const refused = problem?.for === password && problem.text
  if (refused) {
    return (
      <div tw="flex flex-col gap-1" aria-live="polite">
        <div tw="flex items-center gap-3">
          <div tw="flex flex-1 gap-1.5">
            {[1, 2, 3, 4].map((i) => <span key={i} tw="h-1.5 flex-1 rounded-full" style={{ background: i === 1 ? STRENGTH[1].color : '#E2E6E1' }} />)}
          </div>
          <span tw="w-[72px] text-right font-sans text-[12px] font-semibold" style={{ color: STRENGTH[1].color }}>Recusada</span>
        </div>
        <p tw="m-0 font-sans text-[12px] text-[#B42318]">{refused}</p>
      </div>
    )
  }
  const score = passwordScore(password)
  return (
    <div tw="flex items-center gap-3" aria-live="polite">
      <div tw="flex flex-1 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} tw="h-1.5 flex-1 rounded-full transition-colors duration-300" style={{ background: i <= score ? STRENGTH[score].color : '#E2E6E1' }} />
        ))}
      </div>
      <span tw="w-[72px] text-right font-sans text-[12px] font-semibold" style={{ color: STRENGTH[score].color }}>
        {STRENGTH[score].label}
      </span>
    </div>
  )
}

export function Rule({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li css={[tw`flex items-center gap-2 font-sans text-[13px] transition-colors`, ok ? tw`text-pine-700` : tw`text-muted`]}>
      <span css={[tw`grid h-5 w-5 place-items-center rounded-full transition`, ok ? tw`bg-pine-700 text-white` : tw`bg-line text-transparent`]}>
        <Check width={13} height={13} strokeWidth={2.6} />
      </span>
      {children}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Carimbo de passaporte (assinatura visual do painel)                 */
/* ------------------------------------------------------------------ */

export function Stamp({ top, main, bottom, color = '#F07A2A', rotate = -8, className, big = false }: {
  top: string; main: string; bottom?: string; color?: string; rotate?: number; className?: string; big?: boolean
}) {
  return (
    <div
      className={className}
      aria-hidden="true"
      tw="inline-flex select-none flex-col items-center justify-center rounded-[14px] px-4 py-2 font-sans uppercase"
      style={{ border: `2.5px solid ${color}`, color, transform: `rotate(${rotate}deg)`, boxShadow: `inset 0 0 0 3px transparent, inset 0 0 0 4.5px ${color}40` }}
    >
      <span tw="text-[9px] font-semibold tracking-[.22em]">{top}</span>
      <span css={[tw`font-serif font-bold leading-none tracking-wide`, big ? tw`text-[46px]` : tw`text-[22px]`]}>{main}</span>
      {bottom && <span tw="mt-0.5 text-[9px] font-semibold tracking-[.18em]">{bottom}</span>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Janela (modal) e gaveta lateral                                     */
/* ------------------------------------------------------------------ */

function useEscape(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, active])
}

export function Modal({ title, onClose, children, dismissable = true, width = 480 }: {
  title: string; onClose: () => void; children: ReactNode; dismissable?: boolean; width?: number
}) {
  useEscape(onClose, dismissable)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div tw="fixed inset-0 z-50 grid place-items-center bg-pine-950/45 p-4 backdrop-blur-[3px]" onMouseDown={(e) => dismissable && e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} tw="w-full rounded-[28px] bg-cream p-5 shadow-lift outline-none sm:p-7" style={{ maxWidth: width }}>
        <div tw="mb-5 flex items-start justify-between gap-4">
          <h2 tw="font-serif text-[1.5rem] font-bold leading-tight text-ink">{title}</h2>
          {dismissable && (
            <button onClick={onClose} aria-label="Fechar" tw="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:bg-mist">
              <Close width={20} height={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Drawer({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose)
  return (
    <div tw="fixed inset-0 z-40 flex justify-end bg-pine-950/30 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-label={title} tw="flex h-full w-full max-w-[460px] flex-col overflow-y-auto bg-cream p-8 shadow-lift">
        <div tw="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 tw="font-serif text-[1.6rem] font-bold leading-tight text-ink">{title}</h2>
            {subtitle && <p tw="mt-1 font-sans text-[13.5px] text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fechar" tw="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:bg-mist">
            <Close width={20} height={20} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Aviso rápido no canto ("Pronto!")                                   */
/* ------------------------------------------------------------------ */

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div role="status" tw="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-pine-900 px-5 py-3 font-sans text-[14px] font-medium text-white shadow-lift">
      <span tw="grid h-6 w-6 place-items-center rounded-full bg-sun-500"><Check width={14} height={14} strokeWidth={2.6} /></span>
      {message}
    </div>
  )
}

export function Spinner() {
  return (
    <div tw="grid min-h-screen place-items-center bg-cream">
      <p tw="animate-pulse font-script text-[34px] text-pine-800">Turista Life…</p>
    </div>
  )
}
