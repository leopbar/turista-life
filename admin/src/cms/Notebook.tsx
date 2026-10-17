import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api, parseDate, type HistoryItem } from '../api'
import { Alert, Button, Modal, Toast } from '../components/ui'
import { PublishedStamp } from './DocEditor'

const ACTION: Record<string, string> = { publicado: 'publicou', restaurado: 'voltou uma versão de', removido: 'tirou do site' }

const dayLabel = (iso: string) => {
  const s = parseDate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Caderno de viagem do site: cada publicação é uma linha, cada dia uma página. Dá para voltar no tempo. */
export function Notebook() {
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [back, setBack] = useState<HistoryItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stamp, setStamp] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const load = () => api.history().then(setItems).catch(() => setItems([]))
  useEffect(() => {
    load()
  }, [])

  const days: { day: string; items: HistoryItem[] }[] = []
  for (const h of items ?? []) {
    const day = dayLabel(h.createdAt)
    if (days[days.length - 1]?.day !== day) days.push({ day, items: [] })
    days[days.length - 1].items.push(h)
  }

  const restore = async () => {
    if (!back) return
    setBusy(true)
    setError(null)
    try {
      // Um segundo antes da mudança escolhida: o site volta a ser como era antes dela.
      const at = new Date(parseDate(back.createdAt).getTime() - 1000).toISOString()
      const r = await api.restoreSite(at)
      setBack(null)
      setStamp(true)
      setToast(`${r.changed} ${r.changed === 1 ? 'parte voltou' : 'partes voltaram'} a ser como antes`)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não deu para voltar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div tw="mx-auto max-w-[860px]">
      <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Caderno de viagem do site</h1>
      <p tw="mt-2 font-sans text-[14.5px] text-muted">
        Cada publicação fica anotada aqui por um ano. Se algo deu errado, dá para voltar o site inteiro para como ele estava antes de uma mudança.
      </p>

      <div tw="mt-10 flex flex-col gap-10">
        {items?.length === 0 && <p tw="font-sans text-[14px] text-muted">Nenhuma publicação ainda. A primeira vai aparecer aqui.</p>}
        {days.map(({ day, items }) => (
          <section key={day} tw="relative rounded-[26px] bg-white p-7 shadow-card">
            <span aria-hidden="true" tw="absolute -top-3 left-8 h-6 w-24 rotate-[-2deg] bg-[#E9DFC9]/90" />
            <h2 tw="m-0 mb-4 font-script text-[30px] font-normal leading-none text-sun-600">{day}</h2>
            <ol tw="m-0 flex list-none flex-col p-0">
              {items.map((h) => (
                <li key={h.id} tw="flex flex-wrap items-center gap-x-4 gap-y-1 border-0 border-b border-dashed border-line py-3 font-sans text-[14px] last:border-b-0">
                  <span tw="w-[52px] shrink-0 tabular-nums text-muted">{parseDate(h.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span tw="min-w-0 flex-1 text-ink">
                    <strong tw="font-semibold">{h.createdBy ?? 'Alguém'}</strong> {ACTION[h.action] ?? h.action} <em tw="not-italic text-pine-800">{h.label}</em>
                  </span>
                  <Link to={`/editar?doc=${encodeURIComponent(h.key)}`} tw="font-sans text-[12.5px] text-pine-800 underline">abrir</Link>
                  <button type="button" onClick={() => setBack(h)} tw="cursor-pointer border-0 bg-transparent font-sans text-[12.5px] font-semibold text-sun-600 underline">
                    voltar para antes disto
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {back && (
        <Modal title="Voltar o site no tempo?" onClose={() => setBack(null)}>
          <p tw="m-0 font-sans text-[14.5px] leading-relaxed text-muted">
            O site inteiro volta a ser como era em <strong>{parseDate(back.createdAt).toLocaleString('pt-BR')}</strong>, logo antes de "{back.label}".
            Tudo o que foi publicado depois sai do ar, mas continua no caderno: dá para trazer de volta.
          </p>
          {error && <div tw="mt-4"><Alert>{error}</Alert></div>}
          <div tw="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBack(null)}>Cancelar</Button>
            <Button variant="danger" disabled={busy} onClick={restore}>{busy ? 'Voltando…' : 'Voltar o site'}</Button>
          </div>
        </Modal>
      )}
      {stamp && <PublishedStamp onDone={() => setStamp(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
