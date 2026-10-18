import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import tw, { type TwStyle } from 'twin.macro'
import { ApiError, api, parseDate, type HistoryItem, type RestorePreviewItem, type RestoreTarget } from '../api'
import { Alert, Button, Modal, Toast } from '../components/ui'
import { PublishedStamp, changeDetails } from './DocEditor'
import { definitionOf, useSchema } from './model'

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

/** Uma versão do site: tudo o que foi publicado no mesmo instante (ex.: uma restauração que mexeu em várias partes). */
type SiteVersion = { id: number; keys: string[]; labels: string[]; action: string; createdAt: string; createdBy: string | null }

function versionsOf(items: HistoryItem[]): SiteVersion[] {
  const out: SiteVersion[] = []
  for (const h of items) {
    const last = out[out.length - 1]
    if (last && last.createdAt === h.createdAt && last.createdBy === h.createdBy) {
      if (!last.labels.includes(h.label)) last.labels.push(h.label)
      last.keys.push(h.key)
    } else out.push({ id: h.id, keys: [h.key], labels: [h.label], action: h.action, createdAt: h.createdAt, createdBy: h.createdBy })
  }
  return out
}

/** Para onde voltar: uma versão (e quantas vieram depois dela) ou o conteúdo original (version null). */
type Choice = { version: SiteVersion | null; later: number }

const VERSION_BUTTON = tw`cursor-pointer whitespace-nowrap rounded-full border-0 bg-white px-2.5 py-1 font-sans text-[12px] font-semibold text-sun-600 shadow-card hover:bg-[#FFF4EC]`
const LIVE = tw`shrink-0 rounded-full bg-pine-800 px-2.5 py-1 font-sans text-[11px] font-semibold text-white`

/** Uma versão: o que mudou primeiro, quem e quando embaixo; as ações ficam discretas. A mais nova é a que está no ar. */
function Entry({ v, live, onChoose }: { v: SiteVersion; live: boolean; onChoose: () => void }) {
  return (
    <li className="group" tw="flex flex-wrap items-center gap-x-3 gap-y-2 border-0 border-t border-solid border-line px-4 py-3.5 transition-colors first:border-t-0 hover:bg-cream sm:(flex-nowrap px-5)">
      <span tw="min-w-0 flex-1 basis-[200px]">
        <span tw="line-clamp-2 font-sans text-[14.5px] font-medium leading-snug text-ink sm:line-clamp-1">{v.labels.join(', ')}</span>
        <span tw="mt-0.5 block truncate font-sans text-[12px] text-muted">
          por {v.createdBy ?? 'sistema'}<span tw="sm:hidden"> · {timeOf(v.createdAt)}</span>
        </span>
      </span>
      {live && <span css={LIVE}>No ar agora</span>}
      <ActionChip action={v.action} />
      <span tw="hidden w-[44px] shrink-0 text-right sm:block font-sans text-[12.5px] tabular-nums text-muted">{timeOf(v.createdAt)}</span>
      <span tw="flex w-full shrink-0 items-center justify-end gap-1 sm:(w-auto opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100)" css={{ '@media (hover: none)': tw`opacity-100` }}>
        <Link to={`/editar?doc=${encodeURIComponent(v.keys[0])}`} tw="rounded-full px-2.5 py-1 font-sans text-[12px] font-semibold text-pine-800 no-underline hover:bg-mist">
          Abrir
        </Link>
        {!live && (
          <button type="button" onClick={onChoose} title="O site inteiro fica exatamente como estava logo depois desta versão" css={VERSION_BUTTON}>
            ↺ Voltar para esta versão
          </button>
        )}
      </span>
    </li>
  )
}

/** Prévia no aviso: cada parte que muda, com o que está no ar e o que vai ficar. */
function Preview({ items }: { items: RestorePreviewItem[] }) {
  const schema = useSchema()
  return (
    <div tw="mt-4 max-h-[46vh] overflow-y-auto rounded-2xl bg-cream p-4">
      <p tw="m-0 font-sans text-[13px] font-semibold text-pine-900">Como o site vai ficar:</p>
      <ul tw="m-0 mt-2 flex list-none flex-col gap-3 p-0">
        {items.map((it) => {
          const def = schema && definitionOf(schema, it.key)
          const details = it.target === null ? [] : it.current === null || !def ? null : changeDetails(def.fields, it.current, it.target)
          return (
            <li key={it.key} tw="font-sans text-[13px] text-ink">
              <span tw="font-semibold">{it.label}</span>
              {it.target === null && <span tw="text-[#B42318]"> · sai do site</span>}
              {it.current === null && it.target !== null && <span tw="text-pine-800"> · volta ao site</span>}
              {details && details.length > 0 && (
                <ul tw="m-0 mt-1 flex flex-col gap-1 pl-4">
                  {details.map((d, i) => (
                    <li key={i} tw="break-words text-[12.5px] leading-snug">
                      {d.label}
                      {d.to !== undefined && (
                        <>
                          {': '}
                          {d.from !== undefined && <><s tw="text-muted">{d.from}</s>{' → '}</>}
                          <strong>{d.to}</strong>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const targetOf = (c: Choice): RestoreTarget => (c.version ? { versionId: c.version.id } : { original: true })

const dayLabel = (iso: string) => {
  const s = parseDate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Caderno de viagem do site: cada publicação é uma versão, cada dia uma página. Dá para voltar a qualquer versão. */
export function Notebook() {
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [back, setBack] = useState<Choice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [stamp, setStamp] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [preview, setPreview] = useState<RestorePreviewItem[] | null>(null)
  const load = () => api.history().then(setItems).catch(() => setItems([]))
  useEffect(() => {
    load()
  }, [])

  // Ao abrir o aviso, o servidor diz o que muda (sem mudar nada ainda).
  useEffect(() => {
    setPreview(null)
    setError(null)
    if (!back) return
    let alive = true
    api.restoreSitePreview(targetOf(back))
      .then((p) => alive && setPreview(p))
      .catch((err) => alive && setError(err instanceof ApiError ? err.message : 'Não deu para conferir o que muda.'))
    return () => {
      alive = false
    }
  }, [back])

  const versions = versionsOf(items ?? [])
  const days: { day: string; items: { v: SiteVersion; index: number }[] }[] = []
  versions.forEach((v, index) => {
    const day = dayLabel(v.createdAt)
    if (days[days.length - 1]?.day !== day) days.push({ day, items: [] })
    days[days.length - 1].items.push({ v, index })
  })

  const restore = async () => {
    if (!back) return
    setBusy(true)
    setError(null)
    try {
      const r = await api.restoreSite(targetOf(back))
      setBack(null)
      setStamp(true)
      setToast(`${r.changed} ${r.changed === 1 ? 'parte voltou' : 'partes voltaram'} a ser como naquela versão`)
      load()
    } catch (err) {
      // O motivo inteiro (e que nada mudou), para não parecer que o botão não fez nada.
      const why = err instanceof ApiError ? [err.message, ...err.problems.map((p) => p.message)].join(' ') : ''
      setError(`Não deu para voltar o site, nada foi alterado. ${why}`.trim())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div tw="mx-auto max-w-[860px]">
      <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Caderno de viagem do site</h1>
      <p tw="mt-2 font-sans text-[14.5px] text-muted">
        Cada publicação vira uma versão do site e fica anotada aqui por um ano. Se algo deu errado, escolha uma versão: o site
        inteiro volta a ficar exatamente como estava nela, e tudo o que veio depois é ignorado.
      </p>

      <div tw="mt-10 flex flex-col gap-9">
        {items?.length === 0 && <p tw="font-sans text-[14px] text-muted">Nenhuma publicação ainda. A primeira vai aparecer aqui.</p>}
        {days.map(({ day, items }) => (
          <section key={day}>
            <h2 tw="m-0 mb-3 flex items-baseline gap-3 font-script text-[28px] font-normal leading-none text-sun-600">
              {day}
              <span tw="font-sans text-[12px] font-medium text-muted">{items.length} {items.length === 1 ? 'versão' : 'versões'}</span>
            </h2>
            <ol tw="m-0 list-none overflow-hidden rounded-[22px] bg-white p-0 shadow-card">
              {items.map(({ v, index }) => <Entry key={v.id} v={v} live={index === 0} onChoose={() => setBack({ version: v, later: index })} />)}
            </ol>
          </section>
        ))}
        {items && (
          <div tw="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[22px] bg-white px-4 py-3.5 shadow-card sm:(flex-nowrap px-5)">
            <span tw="min-w-0 flex-1 basis-[200px]">
              <span tw="block font-sans text-[14.5px] font-medium leading-snug text-ink">Conteúdo original</span>
              <span tw="mt-0.5 block font-sans text-[12px] text-muted">O site como era antes de qualquer edição no painel</span>
            </span>
            {versions.length === 0 ? (
              <span css={LIVE}>No ar agora</span>
            ) : (
              <span tw="flex w-full shrink-0 justify-end sm:w-auto">
                <button type="button" onClick={() => setBack({ version: null, later: versions.length })} css={VERSION_BUTTON}>
                  ↺ Voltar ao original
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {back && (
        <Modal title={back.version ? 'Voltar para esta versão?' : 'Voltar ao conteúdo original?'} onClose={() => setBack(null)}>
          <p tw="m-0 font-sans text-[14.5px] leading-relaxed text-muted">
            {back.version ? (
              <>
                O site inteiro fica exatamente como estava em <strong>{parseDate(back.version.createdAt).toLocaleString('pt-BR')}</strong>, logo
                depois de "{back.version.labels.join(', ')}".
              </>
            ) : (
              <>O site inteiro volta a ser como era antes de qualquer edição no painel.</>
            )}{' '}
            {back.later === 1 ? 'A versão que veio depois é ignorada' : `As ${back.later} versões que vieram depois são ignoradas`}: saem do ar, mas
            continuam no caderno. Rascunhos em andamento não se perdem: continuam guardados, ainda por publicar.
          </p>
          {!preview && !error && <p tw="mt-4 animate-pulse font-sans text-[13px] text-muted">Conferindo o que muda…</p>}
          {preview?.length === 0 && <div tw="mt-4"><Alert>O site já está igual ao que era nesse momento. Não há nada para voltar.</Alert></div>}
          {preview && preview.length > 0 && <Preview items={preview} />}
          {error && <div tw="mt-4"><Alert>{error}</Alert></div>}
          <div tw="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBack(null)}>Cancelar</Button>
            <Button variant="danger" disabled={busy || !preview?.length} onClick={restore}>{busy ? 'Voltando…' : 'Voltar o site'}</Button>
          </div>
        </Modal>
      )}
      {stamp && <PublishedStamp onDone={() => setStamp(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
