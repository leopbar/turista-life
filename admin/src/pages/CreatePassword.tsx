import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { ApiError, api } from '../api'
import { firstName, useAuth } from '../auth'
import { Back, Shield } from '../components/icons'
import { Brand } from '../components/Shell'
import { Alert, Button, Field, PasswordInput, Rule, Stamp, StrengthMeter, Toast } from '../components/ui'

/**
 * Criar a senha: no primeiro acesso (obrigatório, com a senha provisória) ou depois, em "Minha senha".
 * Depois de salva, ninguém consegue ver a senha nova, nem o administrador.
 */
export function CreatePassword({ firstAccess }: { firstAccess: boolean }) {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  if (!user) return null

  const rules = {
    length: next.length >= 12,
    different: next.length > 0 && next !== current,
    match: next.length > 0 && next === confirm,
  }
  const ready = current.length > 0 && rules.length && rules.different && rules.match

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!ready) return
    setError(null)
    setSending(true)
    try {
      const me = await api.changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      if (firstAccess) {
        setUser(me.user)
        navigate('/', { replace: true })
      } else {
        setDone(true)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setSending(false)
    }
  }

  const form = (
    <form onSubmit={submit} noValidate tw="flex flex-col gap-5">
      <Field label={firstAccess ? 'Senha provisória (a que você recebeu)' : 'Senha atual'}>
        {(id) => <PasswordInput id={id} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />}
      </Field>
      <Field label="Senha nova">
        {(id) => <PasswordInput id={id} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}
      </Field>
      <StrengthMeter password={next} />
      <Field label="Repita a senha nova">
        {(id) => <PasswordInput id={id} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
      </Field>

      <ul tw="m-0 flex list-none flex-col gap-2 p-0">
        <Rule ok={rules.length}>Pelo menos 12 caracteres</Rule>
        <Rule ok={rules.different}>Diferente da {firstAccess ? 'senha provisória' : 'senha atual'}</Rule>
        <Rule ok={rules.match}>As duas senhas novas iguais</Rule>
      </ul>
      <p tw="-mt-1 font-sans text-[12.5px] leading-relaxed text-muted">
        Dica: uma frase fácil de lembrar e difícil de adivinhar, como <em>Mochila-azul-no-Vietna-2026</em>. Senhas que já vazaram na internet são recusadas.
      </p>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" variant="sun" disabled={!ready || sending} tw="w-full py-3.5 text-[15px]">
        {sending ? 'Salvando…' : firstAccess ? 'Criar minha senha e entrar' : 'Salvar senha nova'}
      </Button>
    </form>
  )

  if (!firstAccess) {
    return (
      <div tw="mx-auto max-w-[520px]">
        <button onClick={() => navigate(-1)} tw="mb-6 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-sans text-[14px] text-muted hover:text-pine-900">
          <Back width={18} height={18} /> Voltar
        </button>
        <h1 tw="font-serif text-[2.2rem] font-bold text-ink">Minha senha</h1>
        <p tw="mb-8 mt-2 font-sans text-[14.5px] text-muted">Ao salvar, você continua aqui, e qualquer outro aparelho em que você esteja logado é desconectado.</p>
        <div tw="rounded-[28px] bg-white p-8 shadow-card">{form}</div>
        {done && <Toast message="Senha nova salva!" onDone={() => setDone(false)} />}
      </div>
    )
  }

  return (
    <div tw="min-h-screen bg-cream px-6 py-12" style={{ backgroundImage: 'radial-gradient(rgba(11,48,46,.045) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
      <div tw="mx-auto flex max-w-[960px] items-center justify-between">
        <Brand />
        <button onClick={() => logout()} tw="cursor-pointer border-0 bg-transparent font-sans text-[13.5px] text-muted underline hover:text-pine-900">Sair</button>
      </div>
      <div tw="mx-auto mt-12 grid max-w-[960px] items-start gap-12 lg:grid-cols-[1fr_440px]">
        <div tw="relative pt-4">
          <Stamp top="Primeiro acesso" main="BOAS-VINDAS" bottom="Turista Life" rotate={-6} />
          <h1 tw="mt-8 font-serif text-[2.6rem] font-bold leading-[1.1] text-ink">{firstName(user)}, agora a senha é sua.</h1>
          <p tw="mt-4 max-w-[420px] font-sans text-[15px] leading-relaxed text-muted">
            A senha provisória serviu só para abrir a porta. Crie a sua senha: depois de salva, ela fica guardada de um jeito que
            ninguém consegue ver, nem o administrador.
          </p>
          <div tw="mt-8 flex max-w-[420px] items-start gap-3 rounded-2xl bg-mist p-4">
            <Shield tw="mt-0.5 shrink-0 text-pine-700" />
            <p tw="m-0 font-sans text-[13px] leading-relaxed text-pine-900">
              Nunca envie a sua senha para ninguém. A equipe da Turista Life nunca vai pedir a sua senha.
            </p>
          </div>
        </div>
        <div css={[tw`rounded-[28px] bg-white p-8 shadow-lift`]}>{form}</div>
      </div>
    </div>
  )
}
