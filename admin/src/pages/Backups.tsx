import { useEffect, useState } from 'react'
import 'twin.macro'
import { ApiError, api, formatDateTime, parseDate, type SystemStatus } from '../api'
import { Shield } from '../components/icons'
import { Alert, Button } from '../components/ui'

// Hora local, como no resto do painel (o servidor manda em UTC).
const when = (iso: string) => parseDate(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(', ', ' às ')

/** Backups (só administradores): o servidor faz um por dia; aqui você baixa uma cópia para guardar fora. */
export function Backups() {
  const [list, setList] = useState<{ name: string; sizeBytes: number; createdAt: string }[] | null>(null)
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const load = () => {
    api.backups().then(setList).catch(() => setList([]))
    api.status().then(setStatus).catch(() => {})
  }
  useEffect(load, [])

  const download = (name: string) => {
    // Download comum do navegador (o cookie de sessão vai junto).
    window.location.href = `/api/system/backups/${encodeURIComponent(name)}`
    setTimeout(load, 1500)
  }

  return (
    <div tw="mx-auto max-w-[820px]">
      <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Backup</h1>
      <p tw="mt-2 font-sans text-[14.5px] leading-relaxed text-muted">
        Todo dia, de madrugada, o servidor guarda uma cópia de tudo (textos, fotos, usuários e histórico): os últimos 30 dias e um por mês, por 12 meses.
        Como essas cópias ficam no próprio servidor, <strong>baixe uma por mês</strong> e guarde em outro lugar (computador, pen drive ou nuvem).
      </p>

      <div tw="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 shadow-card">
        <Shield tw="text-pine-700" />
        <div tw="flex-1 font-sans text-[14px] text-ink">
          {status?.lastBackupDownloadAt ? <>Última cópia baixada em <strong>{formatDateTime(status.lastBackupDownloadAt)}</strong>.</> : 'Nenhuma cópia baixada ainda.'}
        </div>
        <Button
          variant="sun" disabled={busy}
          onClick={async () => {
            setBusy(true)
            setError(null)
            try {
              const b = await api.createBackup()
              download(b.name)
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'Não deu para criar o backup.')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Preparando…' : 'Baixar uma cópia agora'}
        </Button>
      </div>
      {error && <div tw="mt-3"><Alert>{error}</Alert></div>}

      <div tw="mt-4 rounded-2xl bg-mist p-4 font-sans text-[13px] leading-relaxed text-pine-900">
        {status?.emailAlerts
          ? '✉️ Os alertas de segurança também chegam por e-mail (Gmail configurado).'
          : '✉️ Os alertas de segurança aparecem só aqui no painel. Para receber por e-mail, configure o Gmail no servidor (veja o README do servidor).'}
      </div>

      <h2 tw="mb-3 mt-10 font-serif text-[1.4rem] font-bold text-ink">Cópias guardadas no servidor</h2>
      <ul tw="m-0 flex list-none flex-col gap-2 p-0">
        {list?.length === 0 && <li tw="font-sans text-[13.5px] text-muted">Ainda nenhuma. A primeira sai hoje de madrugada.</li>}
        {list?.map((b) => (
          <li key={b.name} tw="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-line">
            <span tw="font-sans text-[13.5px] text-ink">{when(b.createdAt)}</span>
            <span tw="font-sans text-[12px] text-muted">{(b.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
            <Button variant="ghost" tw="px-3 py-1.5 text-[12px]" onClick={() => download(b.name)}>Baixar</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
