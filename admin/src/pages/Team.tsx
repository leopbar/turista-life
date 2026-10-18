import { useCallback, useEffect, useState, type FormEvent } from 'react'
import tw from 'twin.macro'
import { ApiError, api, formatDateTime, parseDate, timeAgo, type Role, type TempPassword, type User } from '../api'
import { useAuth } from '../auth'
import { Copy, Key, Plus } from '../components/icons'
import { Avatar } from '../components/Shell'
import { Alert, Button, Drawer, Field, Modal, Stamp, TextInput, Toast } from '../components/ui'

const ROLE: Record<Role, { label: string; text: string }> = {
  admin: { label: 'Administrador', text: 'Mexe em tudo e cuida da equipe.' },
  editor: { label: 'Editor', text: 'Mexe em textos e fotos. Não vê a equipe.' },
}

function status(u: User): { label: string; tone: 'ok' | 'wait' | 'off' | 'late' } {
  if (!u.isActive) return { label: 'Desativado', tone: 'off' }
  if (u.mustChangePassword) {
    const exp = u.tempPasswordExpiresAt ? parseDate(u.tempPasswordExpiresAt) : null
    if (exp && exp <= new Date()) return { label: 'Senha provisória vencida', tone: 'late' }
    return { label: `Aguardando primeiro acesso${exp ? ` · vale até ${formatDateTime(u.tempPasswordExpiresAt!)}` : ''}`, tone: 'wait' }
  }
  return { label: u.lastLoginAt ? `Último acesso ${timeAgo(u.lastLoginAt)}` : 'Ativo', tone: 'ok' }
}

const toneCss = {
  ok: tw`bg-mist text-pine-800`,
  wait: tw`bg-[#FFF4EC] text-sun-600`,
  late: tw`bg-[#FEF3F2] text-[#912018]`,
  off: tw`bg-line text-muted`,
}

/* ------------------------------------------------------------------ */
/* Senha provisória: aparece uma vez só                                */
/* ------------------------------------------------------------------ */

function TempPasswordModal({ data, renewed, onClose }: { data: TempPassword; renewed: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState<'senha' | 'convite' | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const first = data.user.name.split(' ')[0]
  const until = formatDateTime(data.expiresAt)
  const invite =
    `Oi, ${first}! Seu acesso ao painel da Turista Life:\n\n` +
    `Endereço: ${window.location.origin}\nE-mail: ${data.user.email}\nSenha provisória: ${data.tempPassword}\n\n` +
    `Ela vale até ${until} e só serve para o primeiro acesso: lá você cria a sua própria senha.`

  async function copy(what: 'senha' | 'convite') {
    await navigator.clipboard.writeText(what === 'senha' ? data.tempPassword : invite)
    setCopied(what)
  }

  return (
    <Modal title={renewed ? `Nova senha provisória de ${first}` : `Acesso de ${first} criado`} onClose={() => (copied ? onClose() : setConfirmClose(true))} width={540}>
      <p tw="m-0 font-sans text-[14px] leading-relaxed text-muted">
        Envie o e-mail e a senha provisória para {first} por um canal de confiança (WhatsApp, por exemplo). No primeiro acesso, o painel
        pede uma senha nova, que nem você vai conseguir ver.
      </p>

      <div tw="relative mt-6 rounded-[22px] border-2 border-dashed border-sun-500/60 bg-white px-6 py-6 text-center">
        <Stamp top="Vale até" main={parseDate(data.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '')} rotate={10} tw="absolute -right-3 -top-5 bg-cream" />
        <p tw="m-0 font-sans text-[11px] font-semibold uppercase tracking-[.18em] text-muted">Senha provisória</p>
        <p tw="m-0 mt-2 select-all break-all font-mono text-[22px] font-semibold tracking-wide text-pine-900">{data.tempPassword}</p>
        <p tw="m-0 mt-2 font-sans text-[12.5px] text-muted">{data.user.email}</p>
      </div>

      <div tw="mt-5">
      <Alert tone="info">
        <strong>Ela aparece só agora.</strong> Depois que esta janela fechar, ninguém consegue ver esta senha de novo. Se ela se perder, é só gerar outra.
      </Alert>
      </div>

      <div tw="mt-5 flex flex-wrap gap-3">
        <Button variant="sun" onClick={() => copy('convite')}>
          <Copy width={18} height={18} /> {copied === 'convite' ? 'Convite copiado!' : 'Copiar convite completo'}
        </Button>
        <Button variant="ghost" onClick={() => copy('senha')}>
          {copied === 'senha' ? 'Senha copiada!' : 'Copiar só a senha'}
        </Button>
      </div>

      {confirmClose ? (
        <div tw="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-[#FFF4EC] px-4 py-3">
          <p tw="m-0 font-sans text-[13px] text-ink">Você ainda não copiou. Fechar mesmo assim?</p>
          <div tw="flex gap-2">
            <Button variant="ghost" tw="px-4 py-2" onClick={() => setConfirmClose(false)}>Não</Button>
            <Button variant="pine" tw="px-4 py-2" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      ) : (
        <div tw="mt-6 text-right">
          <Button variant="pine" onClick={() => (copied ? onClose() : setConfirmClose(true))}>Pronto</Button>
        </div>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Convidar pessoa                                                     */
/* ------------------------------------------------------------------ */

function RolePicker({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div role="radiogroup" aria-label="Papel" tw="grid grid-cols-2 gap-3">
      {(Object.keys(ROLE) as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          onClick={() => onChange(r)}
          css={[
            tw`cursor-pointer rounded-2xl border-[1.5px] border-solid bg-white p-4 text-left transition`,
            value === r ? tw`border-pine-800 ring-4 ring-pine-800/10` : tw`border-line hover:border-pine-700/50`,
          ]}
        >
          <span tw="block font-sans text-[14px] font-semibold text-ink">{ROLE[r].label}</span>
          <span tw="mt-1 block font-sans text-[12px] leading-snug text-muted">{ROLE[r].text}</span>
        </button>
      ))}
    </div>
  )
}

/** O motivo de um convite recusado, em vez de só "confira". */
function inviteProblem(err: ApiError): string {
  const fields = (err.extra.fields ?? {}) as Record<string, string>
  if (fields.email) {
    return /special-use|reserved|domain/i.test(fields.email)
      ? 'Esse e-mail não é aceito: o que vem depois do @ precisa ser um endereço de verdade (ex.: gmail.com).'
      : 'Esse e-mail não parece válido. Confira se está escrito certo.'
  }
  if (fields.name) return 'Escreva o nome da pessoa (até 80 letras).'
  return 'Confira o nome e o e-mail.'
}

function InviteDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (t: TempPassword) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('editor')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      onCreated(await api.createUser({ name, email, role }))
    } catch (err) {
      setError(err instanceof ApiError ? (err.code === 'invalid' ? inviteProblem(err) : err.message) : 'Algo deu errado.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Drawer title="Convidar pessoa" subtitle="O painel cria uma senha provisória para o primeiro acesso." onClose={onClose}>
      <form onSubmit={submit} tw="flex flex-col gap-5" noValidate>
        <Field label="Nome">{(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Laura Irigoyen" autoFocus maxLength={80} />}</Field>
        <Field label="E-mail (é o login da pessoa)">{(id) => <TextInput id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="laura@exemplo.com" maxLength={254} />}</Field>
        <div tw="flex flex-col gap-1.5">
          <span tw="font-sans text-[13px] font-semibold text-pine-900">O que a pessoa pode fazer</span>
          <RolePicker value={role} onChange={setRole} />
        </div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" variant="sun" disabled={sending || !name.trim() || !email.includes('@')} tw="mt-2 w-full py-3.5">
          {sending ? 'Criando…' : 'Criar acesso'}
        </Button>
      </form>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ */
/* Confirmações                                                        */
/* ------------------------------------------------------------------ */

type Confirm = { title: string; text: string; cta: string; danger?: boolean; run: () => Promise<unknown> }

function ConfirmModal({ c, onClose }: { c: Confirm; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={c.title} onClose={onClose}>
      <p tw="m-0 font-sans text-[14.5px] leading-relaxed text-muted">{c.text}</p>
      {error && <div tw="mt-4"><Alert>{error}</Alert></div>}
      <div tw="mt-7 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          variant={c.danger ? 'danger' : 'pine'}
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await c.run()
              onClose()
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'Algo deu errado.')
              setBusy(false)
            }
          }}
        >
          {c.cta}
        </Button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

const action = tw`inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3 py-1.5 font-sans text-[12.5px] font-semibold text-pine-800 transition hover:bg-mist`

export function Team() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[] | null>(null)
  const [inviting, setInviting] = useState(false)
  const [temp, setTemp] = useState<{ data: TempPassword; renewed: boolean } | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reload = useCallback(() => api.users().then(setUsers), [])
  useEffect(() => {
    reload()
  }, [reload])

  if (!me) return null

  const ask = (c: Confirm) => setConfirm(c)

  return (
    <div>
      <div tw="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Equipe</h1>
          <p tw="m-0 mt-2 font-sans text-[14.5px] text-muted">Quem pode entrar no painel. Acessos novos só nascem aqui.</p>
        </div>
        <Button variant="sun" onClick={() => setInviting(true)}><Plus width={18} height={18} /> Convidar pessoa</Button>
      </div>

      <div tw="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {users?.map((u) => {
          const s = status(u)
          const self = u.id === me.id
          return (
            <article key={u.id} css={[tw`flex flex-col rounded-[26px] bg-white p-6 shadow-card`, !u.isActive && tw`opacity-75`]}>
              <div tw="flex items-start gap-4">
                <Avatar name={u.name} size={52} muted={!u.isActive} />
                <div tw="min-w-0 flex-1">
                  <h2 tw="m-0 truncate font-serif text-[1.2rem] font-bold text-ink">
                    {u.name} {self && <span tw="font-sans text-[12px] font-medium text-muted">(você)</span>}
                  </h2>
                  <p tw="m-0 truncate font-sans text-[13px] text-muted">{u.email}</p>
                </div>
              </div>
              <div tw="mt-5 flex flex-wrap gap-2">
                <span tw="rounded-full bg-pine-800 px-3 py-1 font-sans text-[11.5px] font-semibold text-white">{ROLE[u.role as Role].label}</span>
                <span css={[tw`rounded-full px-3 py-1 font-sans text-[11.5px] font-semibold`, toneCss[s.tone]]}>{s.label}</span>
              </div>

              {!self && (
                <div tw="-mx-2 mt-5 flex flex-wrap gap-1 border-0 border-t border-dashed border-line pt-4">
                  {u.isActive && (
                    <>
                      <button
                        css={action}
                        onClick={() =>
                          ask({
                            title: `Nova senha provisória para ${u.name.split(' ')[0]}?`,
                            text: 'A senha atual deixa de funcionar na hora e a pessoa é desconectada. No próximo acesso, ela cria uma senha nova.',
                            cta: 'Gerar senha provisória',
                            run: () => api.tempPassword(u.id).then((t) => { setTemp({ data: t, renewed: true }); reload() }),
                          })
                        }
                      >
                        <Key width={16} height={16} /> Nova senha provisória
                      </button>
                      <button
                        css={action}
                        onClick={() => {
                          const to: Role = u.role === 'admin' ? 'editor' : 'admin'
                          ask({
                            title: `Tornar ${u.name.split(' ')[0]} ${ROLE[to].label}?`,
                            text: `${ROLE[to].text} A pessoa precisa entrar de novo para valer.`,
                            cta: `Tornar ${ROLE[to].label}`,
                            run: () => api.updateUser(u.id, { role: to }).then(() => { reload(); setToast('Papel atualizado') }),
                          })
                        }}
                      >
                        Tornar {u.role === 'admin' ? 'Editor' : 'Administrador'}
                      </button>
                      <button
                        css={[action, tw`text-[#B42318] hover:bg-[#FEF3F2]`]}
                        onClick={() =>
                          ask({
                            title: `Desativar ${u.name.split(' ')[0]}?`,
                            text: 'A pessoa sai do painel na hora e não consegue mais entrar. O histórico do que ela fez continua guardado. Dá para reativar depois.',
                            cta: 'Desativar acesso',
                            danger: true,
                            run: () => api.deactivate(u.id).then(() => { reload(); setToast('Acesso desativado') }),
                          })
                        }
                      >
                        Desativar
                      </button>
                    </>
                  )}
                  {!u.isActive && (
                    <>
                      <button css={action} onClick={() => api.activate(u.id).then(() => { reload(); setToast('Acesso reativado') })}>Reativar</button>
                      <button
                        css={[action, tw`text-[#B42318] hover:bg-[#FEF3F2]`]}
                        onClick={() =>
                          ask({
                            title: `Excluir ${u.name.split(' ')[0]} de vez?`,
                            text: 'A conta some da equipe. As anotações em Atividades continuam, com o e-mail da pessoa.',
                            cta: 'Excluir',
                            danger: true,
                            run: () => api.deleteUser(u.id).then(() => { reload(); setToast('Pessoa excluída') }),
                          })
                        }
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {inviting && (
        <InviteDrawer
          onClose={() => setInviting(false)}
          onCreated={(t) => {
            setInviting(false)
            setTemp({ data: t, renewed: false })
            reload()
          }}
        />
      )}
      {temp && <TempPasswordModal data={temp.data} renewed={temp.renewed} onClose={() => setTemp(null)} />}
      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
