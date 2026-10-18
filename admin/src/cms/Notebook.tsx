import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import tw, { type TwStyle } from 'twin.macro'
import { ApiError, api, parseDate, type HistoryItem } from '../api'
import { Alert, Button, Modal, Toast } from '../components/ui'
import { PublishedStamp } from './DocEditor'

const ACTION: Record<string, { label: string; css: TwStyle }> = {
  publicado: { label: 'Publicado', css: tw`bg-mist text-pine-800` },
  restaurado: { label: 'Restaurado', css: tw`bg-[#EEF4FF] text-[#3538CD]` },
  removido: { label: 'Saiu do site', css: tw`bg-[#FEF3F2] text-[#B42318]` },
}

const timeOf = (iso: string) => parseDate(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function ActionChip({ action }: { action: string }) {
  const a = ACTION[action]
  return <span css={[tw`shrink-0 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold`, a?.css ?? tw`bg-cream text-muted`]}>{a?.label ?? action}</span>
}

/** Uma publicação: o que mudou primeiro, quem e quando embaixo; as ações ficam discretas. */
function Entry({ h, onBack }: { h: HistoryItem; onBack: () => void }) {
  return (
    <li className="group" tw="flex flex-wrap items-center gap-x-3 gap-y-2 border-0 border-t border-solid border-line px-4 py-3.5 transition-colors first:border-t-0 hover:bg-cream sm:(flex-nowrap px-5)">
      <span tw="min-w-0 flex-1 basis-[200px]">
        <span tw="line-clamp-2 font-sans text-[14.5px] font-medium leading-snug text-ink sm:line-clamp-1">{h.label}</span>
        <span tw="mt-0.5 block truncate font-sans text-[12px] text-muted">
          por {h.createdBy ?? 'sistema'}<span tw="sm:hidden"> · {timeOf(h.createdAt)}</span>
        </span>
      </span>
      <ActionChip action={h.action} />
      <span tw="hidden w-[44px] shrink-0 text-right sm:block font-sans text-[12.5px] tabular-nums text-muted">{timeOf(h.createdAt)}</span>
      <span tw="flex w-full shrink-0 items-center justify-end gap-1 sm:(w-auto opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100)" css={{ '@media (hover: none)': tw`opacity-100` }}>
        <Link to={`/editar?doc=${encodeURIComponent(h.key)}`} tw="rounded-full px-2.5 py-1 font-sans text-[12px] font-semibold text-pine-800 no-underline hover:bg-mist">
          Abrir
        </Link>
        <button
          type="button" onClick={onBack} title="Volta o site inteiro para como estava logo antes desta publicação"
          tw="cursor-pointer whitespace-nowrap rounded-full border-0 bg-white px-2.5 py-1 font-sans text-[12px] font-semibold text-sun-600 shadow-card hover:bg-[#FFF4EC]"
        >
          ↺ Voltar para antes
        </button>
      </span>
    </li>
  )
}

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

      <div tw="mt-10 flex flex-col gap-9">
        {items?.length === 0 && <p tw="font-sans text-[14px] text-muted">Nenhuma publicação ainda. A primeira vai aparecer aqui.</p>}
        {days.map(({ day, items }) => (
          <section key={day}>
            <h2 tw="m-0 mb-3 flex items-baseline gap-3 font-script text-[28px] font-normal leading-none text-sun-600">
              {day}
              <span tw="font-sans text-[12px] font-medium text-muted">{items.length} {items.length === 1 ? 'publicação' : 'publicações'}</span>
            </h2>
            <ol tw="m-0 list-none overflow-hidden rounded-[22px] bg-white p-0 shadow-card">
              {items.map((h) => <Entry key={h.id} h={h} onBack={() => setBack(h)} />)}
            </ol>
          </section>
        ))}
      </div>

      {back && (
        <Modal title="Voltar o site no tempo?" onClose={() => setBack(null)}>
          <p tw="m-0 font-sans text-[14.5px] leading-relaxed text-muted">
            O site inteiro volta a ser como era em <strong>{parseDate(back.createdAt).toLocaleString('pt-BR')}</strong>, logo antes de "{back.label}".
            Tudo o que foi publicado depois sai do ar, mas continua no caderno: dá para trazer de volta.
            Rascunhos em andamento não se perdem: continuam guardados, ainda por publicar.
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
