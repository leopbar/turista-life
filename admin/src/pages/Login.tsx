import 'twin.macro'
import { useEffect, useState, type FormEvent } from 'react'
import { ApiError, api } from '../api'
import { useAuth } from '../auth'
import { Lock } from '../components/icons'
import { Brand, PlaneTrail } from '../components/Shell'
import { Alert, Button, Field, PasswordInput, Stamp, TextInput } from '../components/ui'

/** Rota da Laura desenhada como linha pontilhada, com os carimbos dos lugares por onde passou. */
function RouteArt() {
  return (
    <div tw="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg tw="absolute inset-0 h-full w-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" fill="none">
        <path d="M70 540 C 170 520, 160 470, 260 440 S 420 420, 400 300 S 470 140, 560 90" stroke="rgba(255,255,255,.28)" strokeWidth="2" strokeDasharray="4 9" strokeLinecap="round" />
        <circle cx="70" cy="540" r="6" fill="#F07A2A" />
        <circle cx="260" cy="440" r="5" fill="rgba(255,255,255,.6)" />
        <circle cx="400" cy="300" r="5" fill="rgba(255,255,255,.6)" />
      </svg>
      <Stamp top="Austrália" main="SYD" bottom="2022 · 2026" color="rgba(255,255,255,.55)" rotate={-10} tw="absolute left-[7%] top-[52%]" />
      <Stamp top="Indonésia" main="DPS" bottom="Bali" color="rgba(240,122,42,.85)" rotate={7} tw="absolute left-[46%] top-[40%]" />
      <Stamp top="Tailândia" main="BKK" bottom="Bangkok" color="rgba(255,255,255,.55)" rotate={-5} tw="absolute right-[10%] top-[26%]" />
      <PlaneTrail tw="absolute right-[6%] top-[8%] w-36 text-white/70" />
    </div>
  )
}

export function Login() {
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [wait, setWait] = useState(0)
  const [sending, setSending] = useState(false)

  // Contagem regressiva quando o servidor pede para esperar.
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const me = await api.login(email, password)
      setUser(me.user)
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null
      setError(apiErr?.message ?? 'Algo deu errado. Tente de novo.')
      if (apiErr?.retryAfter) setWait(apiErr.retryAfter)
      setPassword('')
    } finally {
      setSending(false)
    }
  }

  const mm = String(Math.floor(wait / 60)).padStart(2, '0')
  const ss = String(wait % 60).padStart(2, '0')

  return (
    <div tw="grid min-h-screen grid-cols-1 bg-cream lg:grid-cols-[1.1fr_1fr]">
      <section tw="relative hidden overflow-hidden bg-pine-950 p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <RouteArt />
        <div tw="relative"><Brand light /></div>
        <div tw="relative max-w-[400px]">
          <p tw="font-script text-[44px] leading-none text-sun-500">Que bom te ver de novo por aqui</p>
          <p tw="mt-5 font-sans text-[15px] leading-relaxed text-white/75">
            Daqui você cuida de cada página da Turista Life: textos, fotos, guias e o diário da viagem.
          </p>
        </div>
      </section>

      <section tw="flex items-center justify-center px-6 py-16">
        <form onSubmit={submit} tw="w-full max-w-[400px]" noValidate>
          <div tw="mb-10 lg:hidden"><Brand /></div>
          <span tw="grid h-12 w-12 place-items-center rounded-2xl bg-pine-800 text-white"><Lock /></span>
          <h1 tw="mt-6 font-serif text-[2.2rem] font-bold leading-tight text-ink">Entrar no painel</h1>
          <p tw="mt-2 font-sans text-[14.5px] text-muted">Use o e-mail e a senha que você recebeu.</p>

          <div tw="mt-8 flex flex-col gap-5">
            <Field label="E-mail">
              {(id) => <TextInput id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoFocus />}
            </Field>
            <Field label="Senha">
              {(id) => <PasswordInput id={id} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Field>

            {error && <Alert>{error}{wait > 0 && <strong tw="ml-1 tabular-nums">({mm}:{ss})</strong>}</Alert>}

            <Button type="submit" variant="sun" disabled={sending || wait > 0 || !email || !password} tw="mt-1 w-full py-3.5 text-[15px]">
              {sending ? 'Conferindo…' : 'Entrar'}
            </Button>
          </div>

          <p tw="mt-8 font-sans text-[12.5px] leading-relaxed text-muted">
            Esqueceu a senha? Peça ao administrador uma <strong>senha provisória</strong> nova. Por segurança, não existe recuperação por e-mail.
          </p>
        </form>
      </section>
    </div>
  )
}
