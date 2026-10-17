import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import tw from 'twin.macro'
import type { CollectionDef, Field } from '../../../src/cms/fields'
import { ApiError, api, formatDateTime, parseDate, timeAgo, type CmsSchema, type DocMeta, type DocStatus } from '../api'
import { Arrow, Back, Plus, Search } from '../components/icons'
import { Alert, Button, Modal, Toast } from '../components/ui'
import { FieldEditor, FormEnvProvider } from './FieldEditor'
import { useRefOptions } from './DocEditor'
import { GROUPS, STATUS, emptyFromFields, useSchema } from './model'

const editLink = (d: DocMeta) => `/editar?rota=${encodeURIComponent(d.route)}&doc=${encodeURIComponent(d.key)}`
const sectionLink = (id: string) => `/conteudo/${id}`
const PAGE_SIZE = 20

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const pending = (d: DocMeta) => d.status !== 'publicado'
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "Artigo "Bali em 10 dias"" vira só "Bali em 10 dias" dentro da lista de artigos. */
const countOf = (n: number, def: CollectionDef) => `${n} ${n === 1 ? def.itemLabel.toLowerCase() : def.label.toLowerCase()}`

const titleOf = (d: DocMeta) => d.label.match(/^[^"]*"(.*)"$/)?.[1] ?? d.label

function useContent() {
  const schema = useSchema()
  const [list, setList] = useState<DocMeta[] | null>(null)
  const reload = useCallback(() => api.contentList().then(setList), [])
  useEffect(() => {
    reload()
  }, [reload])
  return { schema, list, reload }
}

/** O que cada seção tem: partes da página e listas de itens (artigos, páginas…). */
function sectionsOf(schema: CmsSchema, list: DocMeta[]) {
  const order = (key: string) => schema.docs.findIndex((x) => x.key === key)
  return GROUPS.map((g) => {
    const docs = list.filter((d) => !d.collection && d.group === g.id).sort((a, b) => order(a.key) - order(b.key))
    const cols = schema.collections.filter((c) => c.group === g.id).map((c) => ({ def: c, items: list.filter((d) => d.collection === c.key) }))
    const all = [...docs, ...cols.flatMap((c) => c.items)]
    return { ...g, docs, cols, pending: all.filter(pending).length }
  }).filter((g) => g.docs.length || g.cols.length)
}

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

function StatusChip({ d }: { d: DocMeta }) {
  const s = STATUS[d.status]
  return (
    <span
      css={[
        tw`shrink-0 rounded-full px-2.5 py-1 font-sans text-[11px] font-semibold`,
        s.tone === 'ok' && tw`bg-mist text-pine-800`,
        s.tone === 'draft' && tw`bg-[#FFF4EC] text-sun-600`,
        s.tone === 'new' && tw`bg-[#EEF4FF] text-[#3538CD]`,
        s.tone === 'out' && tw`bg-[#FEF3F2] text-[#B42318]`,
      ]}
    >
      {d.scheduledAt ? 'Agendado' : s.label}
    </span>
  )
}

function DocRow({ d, title, extra, drag, onTop }: {
  d: DocMeta
  title?: string
  extra?: string
  drag?: { onStart: () => void; onDrop: () => void }
  onTop?: () => void
}) {
  const [over, setOver] = useState(false)
  return (
    <div
      draggable={!!drag}
      onDragStart={drag?.onStart}
      onDragOver={drag ? (e) => { e.preventDefault(); setOver(true) } : undefined}
      onDragLeave={drag ? () => setOver(false) : undefined}
      onDrop={drag ? (e) => { e.preventDefault(); setOver(false); drag.onDrop() } : undefined}
      css={[
        tw`flex items-center gap-2 rounded-2xl bg-white shadow-card transition duration-300 hover:(-translate-y-0.5 shadow-lift)`,
        over && tw`ring-2 ring-sun-500`,
      ]}
    >
      <Link to={editLink(d)} tw="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 no-underline">
        {drag && <span aria-hidden="true" tw="cursor-grab font-sans text-[14px] text-muted/60">⠿</span>}
        <span tw="min-w-0 flex-1">
          <span tw="line-clamp-2 font-sans text-[14px] font-medium leading-snug text-ink">{title ?? d.label}</span>
          <span tw="block truncate font-sans text-[11.5px] text-muted">
            {extra && <>{extra} · </>}
            {d.status === 'publicado' ? `No ar ${d.publishedAt ? timeAgo(d.publishedAt) : ''}` : `Rascunho ${timeAgo(d.draftUpdatedAt)}${d.draftUpdatedBy ? ` · ${d.draftUpdatedBy}` : ''}`}
            {d.editingBy.length > 0 && <span tw="ml-2 font-semibold text-sun-600">✋ {d.editingBy.join(', ')} editando</span>}
          </span>
        </span>
        <StatusChip d={d} />
      </Link>
      {onTop ? (
        <button
          type="button" onClick={onTop} title="Levar para o topo da lista (aparece primeiro no site)"
          tw="mr-2 shrink-0 cursor-pointer rounded-full border-0 bg-transparent px-2.5 py-1.5 font-sans text-[12px] font-semibold text-pine-800 hover:bg-mist"
        >
          ↑ Topo
        </button>
      ) : (
        <Link to={editLink(d)} aria-hidden="true" tabIndex={-1} tw="mr-4 shrink-0 text-pine-800"><Arrow width={16} height={16} /></Link>
      )}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label tw="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-card focus-within:ring-2 focus-within:ring-pine-700/30">
      <Search tw="shrink-0 text-muted" />
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        tw="w-full min-w-0 border-0 bg-transparent font-sans text-[15px] text-ink outline-none placeholder:text-muted/70 focus-visible:(ring-0 ring-offset-0)"
      />
    </label>
  )
}


function ChangedToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button" onClick={onToggle}
      css={[tw`cursor-pointer rounded-full border-0 px-4 py-2.5 font-sans text-[13px] font-semibold transition`, on ? tw`bg-sun-500 text-white shadow-[0_10px_24px_-10px_rgba(240,122,42,.8)]` : tw`bg-white text-pine-900 shadow-card hover:bg-mist`]}
    >
      Só o que tem mudança para publicar
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Novo item                                                           */
/* ------------------------------------------------------------------ */

/** Nova página, artigo ou página de produto: pede só o essencial (nome, endereço e escolhas obrigatórias). */
function NewItem({ def, onClose, onCreated }: { def: CollectionDef; onClose: () => void; onCreated: (d: DocMeta) => void }) {
  const { refOptions, reloadRef } = useRefOptions()
  const required = Object.entries(def.fields).filter(([k, f]) => k !== def.idField && k !== def.titleField && f.kind === 'ref' && !f.optional)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [touchedSlug, setTouchedSlug] = useState(false)
  const [extra, setExtra] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const toSlug = (s: string) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)

  const create = async () => {
    setError(null)
    try {
      const item = { ...emptyFromFields(def.fields), [def.titleField]: title, [def.idField]: slug, ...extra }
      onCreated(await api.createItem(def.key, item))
    } catch (err) {
      setError(err instanceof ApiError ? [err.message, ...err.problems.map((p) => p.message)].join(' ') : 'Não deu para criar.')
    }
  }

  const prefix = def.route.replace('{id}', '')
  return (
    <Modal title={`Novo: ${def.itemLabel.toLowerCase()}`} onClose={onClose} width={520}>
      <FormEnvProvider value={{ problems: {}, pickImage: async () => null, refOptions, reloadRef }}>
        <div tw="flex flex-col gap-4">
          <FieldEditor field={{ kind: 'text', label: 'Título' }} value={title} path="title" onChange={(v) => { setTitle(String(v ?? '')); if (!touchedSlug) setSlug(toSlug(String(v ?? ''))) }} />
          <div>
            <FieldEditor field={{ kind: 'slug', label: 'Endereço' }} value={slug} path="slug" onChange={(v) => { setTouchedSlug(true); setSlug(String(v ?? '')) }} />
            <p tw="m-0 mt-1 font-sans text-[12px] text-muted">Fica assim no site: {prefix}<strong>{slug || '…'}</strong>. Depois de criado, não muda.</p>
          </div>
          {required.map(([k, f]) => (
            <FieldEditor key={k} field={f as Field} value={extra[k]} path={k} onChange={(v) => setExtra((e) => ({ ...e, [k]: v }))} />
          ))}
          {error && <Alert>{error}</Alert>}
          <div tw="flex flex-wrap-reverse justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="sun" disabled={!title.trim() || !slug || required.some(([k]) => !extra[k])} onClick={create}>Criar e começar a escrever</Button>
          </div>
        </div>
      </FormEnvProvider>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Lista em bloco único, como uma caixa de e-mail                      */
/* ------------------------------------------------------------------ */

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/** Data curta, como nas caixas de e-mail: "14:32", "Ontem", "17 out", "3 mar 2025". */
function shortDate(iso: string) {
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  const d = onlyDate ? new Date(`${iso}T12:00:00`) : parseDate(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return onlyDate ? 'Hoje' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (sameDay(d, yesterday)) return 'Ontem'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''}`
}

/** Itens com "Data de publicação" mostram essa data; os outros, quando foram ao ar ou a última edição. */
function rowDate(d: DocMeta): { text: string; hint: string } {
  if (d.date) return { text: shortDate(d.date), hint: `Data de publicação: ${d.date.split('-').reverse().join('/')}` }
  if (d.status === 'novo' || !d.publishedAt) return { text: shortDate(d.draftUpdatedAt), hint: `Rascunho editado ${timeAgo(d.draftUpdatedAt)}` }
  return { text: shortDate(d.publishedAt), hint: `No ar desde ${formatDateTime(d.publishedAt)}` }
}

const onTouch = { '@media (hover: none)': tw`hidden` }
const onMouse = { '@media (hover: hover)': tw`hidden` }

function InboxRow({ d, title, extra, drag, onTop }: {
  d: DocMeta
  title?: string
  extra?: string
  drag?: { onStart: () => void; onDrop: () => void }
  onTop?: () => void
}) {
  const [over, setOver] = useState(false)
  const [menu, setMenu] = useState(false)
  const date = rowDate(d)
  const changed = pending(d)
  const sub = [extra, d.editingBy.length ? `✋ ${d.editingBy.join(', ')} editando` : null].filter(Boolean).join(' · ')
  return (
    <div
      className="group"
      draggable={!!drag}
      onDragStart={drag?.onStart}
      onDragOver={drag ? (e) => { e.preventDefault(); setOver(true) } : undefined}
      onDragLeave={drag ? () => setOver(false) : undefined}
      onDrop={drag ? (e) => { e.preventDefault(); setOver(false); drag.onDrop() } : undefined}
      css={[
        tw`relative flex items-center gap-3 border-0 border-t border-solid border-line px-4 transition-colors first:border-t-0 hover:bg-cream sm:px-5`,
        over && tw`bg-[#FFF4EC]`,
      ]}
    >
      <span
        title={changed ? 'Tem mudança esperando para ir para o ar' : undefined}
        css={[tw`h-2 w-2 shrink-0 rounded-full`, changed ? tw`bg-sun-500` : tw`bg-transparent`]}
      />
      <Link to={editLink(d)} tw="flex min-w-0 flex-1 items-center gap-3 py-3.5 no-underline">
        <span tw="min-w-0 flex-1">
          <span css={[tw`line-clamp-2 font-sans text-[14.5px] leading-snug text-ink sm:line-clamp-1`, changed ? tw`font-semibold` : tw`font-normal`]}>{title ?? d.label}</span>
          {sub && <span tw="mt-0.5 block truncate font-sans text-[12px] text-muted">{sub}</span>}
        </span>
        {(d.status !== 'publicado' || d.scheduledAt) && <StatusChip d={d} />}
      </Link>

      {(drag || onTop) && (
        <span tw="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100" css={onTouch}>
          {drag && <span aria-hidden="true" title="Arraste para mudar a ordem" tw="cursor-grab px-1 font-sans text-[15px] text-muted">⠿</span>}
          {onTop && (
            <button
              type="button" onClick={onTop} title="Levar para o topo da lista (aparece primeiro no site)"
              tw="cursor-pointer rounded-full border-0 bg-white px-2.5 py-1 font-sans text-[12px] font-semibold text-pine-800 shadow-card hover:bg-mist"
            >
              ↑ Topo
            </button>
          )}
        </span>
      )}

      <span title={date.hint} css={[tw`w-[58px] shrink-0 text-right font-sans text-[12.5px]`, changed ? tw`font-semibold text-ink` : tw`text-muted`]}>
        {date.text}
      </span>

      {onTop && (
        <span tw="relative shrink-0" css={onMouse} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMenu(false) }}>
          <button
            type="button" aria-label="Mais opções" onClick={() => setMenu((m) => !m)}
            tw="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent font-sans text-[16px] text-muted hover:bg-mist"
          >
            ⋯
          </button>
          {menu && (
            <span tw="absolute right-0 top-9 z-10 rounded-2xl bg-white p-1.5 shadow-lift">
              <button
                type="button" onClick={() => { setMenu(false); onTop() }}
                tw="block w-max cursor-pointer rounded-xl border-0 bg-transparent px-3.5 py-2.5 text-left font-sans text-[13.5px] text-ink hover:bg-mist"
              >
                ↑ Levar para o topo
              </button>
            </span>
          )}
        </span>
      )}
    </div>
  )
}

const inboxCss = tw`overflow-hidden rounded-[22px] bg-white shadow-card`
const pillSelectCss = tw`min-w-0 flex-1 basis-[150px] sm:(flex-none basis-auto) cursor-pointer rounded-full border-0 bg-cream px-3.5 py-2 font-sans text-[12.5px] text-pine-900 outline-none focus:ring-2 focus:ring-pine-700/30`
const pagerBtn = tw`grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-pine-800 hover:enabled:bg-mist disabled:(cursor-default opacity-30)`

type StatusFilter = '' | DocStatus | 'agendado'
const STATUS_FILTERS: [StatusFilter, string][] = [
  ['', 'Situação: todas'], ['publicado', 'No ar'], ['alterado', 'Rascunho com mudanças'], ['novo', 'Ainda não publicado'], ['agendado', 'Agendado'], ['sair', 'Vai sair do site'],
]

function CollectionBlock({ def, items, onChanged, onToast, startAdding = false, onlyChanged }: {
  def: CollectionDef
  items: DocMeta[]
  onChanged: () => void
  onToast: (m: string) => void
  startAdding?: boolean
  onlyChanged: boolean
}) {
  const navigate = useNavigate()
  const { refOptions } = useRefOptions()
  const [adding, setAdding] = useState(startAdding)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [refFilter, setRefFilter] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)

  const ordered = useMemo(() => [...items].sort((a, b) => a.position - b.position), [items])
  // As escolhas de outras listas viram filtros (no blog: Assunto e Destino, como no site).
  const refFields = Object.entries(def.fields).filter((e): e is [string, Extract<Field, { kind: 'ref' }>] => e[1].kind === 'ref')
  const optionsOf = (f: Extract<Field, { kind: 'ref' }>) => refOptions(f.source, f.list, f.valueField, f.labelField) ?? []
  const refLabel = (k: string, v: string) => {
    const f = refFields.find(([key]) => key === k)?.[1]
    return (f && optionsOf(f).find((o) => o.value === v)?.label) ?? v
  }

  const filtering = !!q.trim() || !!status || Object.values(refFilter).some(Boolean) || onlyChanged
  const shown = ordered.filter((d) =>
    (!q.trim() || norm(titleOf(d)).includes(norm(q.trim()))) &&
    (!onlyChanged || pending(d)) &&
    (!status || (status === 'agendado' ? !!d.scheduledAt : d.status === status)) &&
    Object.entries(refFilter).every(([k, v]) => !v || d.refs?.[k] === v),
  )
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const first = current * PAGE_SIZE
  const visible = shown.slice(first, first + PAGE_SIZE)
  const big = ordered.length > 6
  useEffect(() => setPage(0), [q, status, refFilter, onlyChanged])

  const move = async (key: string, to: number, message: string) => {
    setError(null)
    try {
      await api.move(def.key, key, to)
      onChanged()
      onToast(message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não deu para mudar a ordem.')
    }
  }
  // Arrastar só vale com a lista inteira à vista (sem busca nem filtro), para a ordem fazer sentido.
  const drop = (to: number) => {
    if (dragFrom === null || dragFrom === to) return
    const key = ordered[dragFrom].key
    setDragFrom(null)
    move(key, to, 'Ordem atualizada no site')
  }

  return (
    <section tw="flex flex-col gap-3">
      <div tw="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 tw="m-0 font-script text-[32px] font-normal leading-none text-pine-800">{def.label}</h2>
          <p tw="m-0 mt-1.5 font-sans text-[13px] text-muted">{countOf(ordered.length, def)}</p>
        </div>
        <Button variant="sun" tw="px-4 py-2 text-[13px]" onClick={() => setAdding(true)}>
          <Plus width={15} height={15} /> Novo: {def.itemLabel.toLowerCase()}
        </Button>
      </div>
      {error && <Alert>{error}</Alert>}

      <div css={inboxCss}>
        {big && (
          <div tw="flex flex-wrap items-center gap-2 border-0 border-b border-solid border-line px-4 py-3 sm:px-5">
            <label tw="flex min-w-0 basis-full items-center gap-2.5 sm:(flex-1 basis-0)">
              <Search width={19} height={19} tw="shrink-0 text-muted" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo título…" aria-label="Buscar pelo título"
                tw="w-full min-w-0 border-0 bg-transparent py-1.5 font-sans text-[14.5px] text-ink outline-none placeholder:text-muted/70 focus-visible:(ring-0 ring-offset-0)"
              />
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} css={pillSelectCss} aria-label="Situação">
              {STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {refFields.map(([k, f]) => (
              <select key={k} value={refFilter[k] ?? ''} onChange={(e) => setRefFilter((r) => ({ ...r, [k]: e.target.value }))} css={pillSelectCss} aria-label={f.label}>
                <option value="">{f.label}: todos</option>
                {optionsOf(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
          </div>
        )}

        {ordered.length > 0 && (
          <div tw="flex items-center justify-between gap-3 bg-cream/60 px-4 py-1.5 font-sans text-[12px] text-muted sm:px-5">
            <span tw="min-w-0 truncate">
              {filtering
                ? plural(shown.length, 'encontrado', 'encontrados')
                : def.newestFirst ? 'Na ordem do site · mais novos primeiro' : 'Na ordem do site'}
            </span>
            <span tw="flex shrink-0 items-center gap-1">
              {shown.length > 0 && <span tw="mr-1">{first + 1}–{first + visible.length} de {shown.length}</span>}
              <button type="button" aria-label="Página anterior" css={pagerBtn} disabled={current === 0} onClick={() => setPage(current - 1)}>
                <Back width={16} height={16} />
              </button>
              <button type="button" aria-label="Próxima página" css={pagerBtn} disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                <Arrow width={16} height={16} />
              </button>
            </span>
          </div>
        )}

        {visible.map((d) => {
          const i = ordered.indexOf(d)
          const extra = refFields.map(([k]) => d.refs?.[k] && refLabel(k, d.refs[k])).filter(Boolean).join(' · ')
          return (
            <InboxRow
              key={d.key} d={d} title={titleOf(d)} extra={extra || undefined}
              drag={filtering ? undefined : { onStart: () => setDragFrom(i), onDrop: () => drop(i) }}
              onTop={i > 0 ? () => move(d.key, 0, `"${titleOf(d)}" agora é o primeiro da lista`) : undefined}
            />
          )
        })}
        {!ordered.length && <p tw="m-0 px-5 py-6 text-center font-sans text-[13.5px] text-muted">Nenhum ainda. Toque em "Novo" para começar.</p>}
        {ordered.length > 0 && !shown.length && <p tw="m-0 px-5 py-6 text-center font-sans text-[13.5px] text-muted">Nada encontrado com esses filtros.</p>}
      </div>
      {adding && <NewItem def={def} onClose={() => setAdding(false)} onCreated={(d) => navigate(editLink(d))} />}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Tela "Conteúdo": uma visão geral em cartões                         */
/* ------------------------------------------------------------------ */

type Section = ReturnType<typeof sectionsOf>[number]

/** O mesmo cartão da tela inicial: cartões-postais levemente inclinados. */
function SectionCard({ s, index }: { s: Section; index: number }) {
  const tilt = [-1.2, 0.8, -0.6, 1, -0.9, 0.7, -0.5, 0.9, -0.7, 0.6][index % 10]
  const summary = [s.docs.length ? plural(s.docs.length, 'parte da página', 'partes da página') : null, ...s.cols.map((c) => countOf(c.items.length, c.def))].filter(Boolean).join(' · ')
  return (
    <Link
      to={sectionLink(s.id)} className="group" style={{ transform: `rotate(${tilt}deg)` }}
      tw="relative flex min-h-[168px] flex-col justify-between gap-4 overflow-hidden rounded-[26px] bg-white p-6 no-underline shadow-card transition duration-300 hover:(-translate-y-1 shadow-lift)"
    >
      <span tw="grid h-12 w-12 place-items-center rounded-2xl bg-pine-800 text-white"><s.Icon width={24} height={24} /></span>
      <div>
        <h3 tw="m-0 font-serif text-[1.25rem] font-bold text-ink">{s.label}</h3>
        <p tw="m-0 mt-1 font-sans text-[13.5px] leading-snug text-muted">{summary}</p>
        {s.pending > 0 && (
          <span tw="mt-3 inline-block rounded-full bg-[#FFF4EC] px-2.5 py-1 font-sans text-[11.5px] font-semibold text-sun-600">
            {plural(s.pending, 'mudança', 'mudanças')} para publicar
          </span>
        )}
      </div>
      <Arrow tw="absolute right-6 top-7 text-pine-800 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  )
}

export function ContentList() {
  const { schema, list } = useContent()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const onlyChanged = params.get('filtro') === 'mudancas'
  const sections = useMemo(() => (schema && list ? sectionsOf(schema, list) : []), [schema, list])

  // Atalhos antigos ("/conteudo?novo=article") abrem direto a seção certa.
  const novo = params.get('novo')
  const novoGroup = novo && schema?.collections.find((c) => c.key === novo)?.group
  if (novoGroup) return <Navigate to={`${sectionLink(novoGroup)}?novo=${novo}`} replace />

  const groupOf = (d: DocMeta) => GROUPS.find((g) => g.id === d.group)
  const found = q.trim().length >= 2 && list ? list.filter((d) => norm(d.label).includes(norm(q.trim()))).slice(0, 40) : null
  const changed = list?.filter(pending) ?? []

  return (
    <div>
      <div tw="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p tw="m-0 font-sans text-[15px] text-muted">Conteúdo</p>
          <h1 tw="m-0 mt-1 font-script text-[52px] font-normal leading-[1] text-pine-900 sm:text-[64px]">O que vamos mexer?</h1>
          <p tw="m-0 mt-3 max-w-[560px] font-sans text-[14px] text-muted">Escolha uma parte do site. O jeito mais fácil continua sendo tocar no próprio site, em "Editar o site".</p>
        </div>
        <ChangedToggle on={onlyChanged} onToggle={() => setParams(onlyChanged ? {} : { filtro: 'mudancas' })} />
      </div>

      <div tw="mt-8 flex max-w-[680px]">
        <SearchInput value={q} onChange={setQ} placeholder="Procurar uma página ou artigo pelo nome…" />
      </div>

      {!list && <p tw="mt-8 font-sans text-[13px] text-muted">Carregando…</p>}

      {found && (
        <div tw="mt-6 flex max-w-[860px] flex-col gap-2">
          {found.length === 0 && <p tw="m-0 font-sans text-[13.5px] text-muted">Nada com "{q}" no nome. Para procurar dentro dos textos, use a busca da tela inicial.</p>}
          {found.map((d) => <DocRow key={d.key} d={d} extra={groupOf(d)?.label} />)}
        </div>
      )}

      {!found && list && onlyChanged && (
        <div tw="mt-8 flex max-w-[860px] flex-col gap-8">
          {changed.length === 0 && <p tw="m-0 font-sans text-[14px] text-muted">Tudo publicado. Nenhuma mudança esperando para ir para o ar. 🎉</p>}
          {sections.filter((s) => s.pending).map((s) => (
            <section key={s.id} tw="flex flex-col gap-2">
              <Link to={`${sectionLink(s.id)}?filtro=mudancas`} tw="flex items-center gap-3 font-serif text-[1.25rem] font-bold text-ink no-underline hover:text-pine-800">
                <span tw="grid h-9 w-9 place-items-center rounded-xl bg-pine-800 text-white"><s.Icon width={18} height={18} /></span>
                {s.label} <Arrow width={16} height={16} tw="text-pine-800" />
              </Link>
              {changed.filter((d) => d.group === s.id).map((d) => <DocRow key={d.key} d={d} />)}
            </section>
          ))}
        </div>
      )}

      {!found && list && !onlyChanged && (
        <div tw="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((s, i) => <SectionCard key={s.id} s={s} index={i} />)}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Uma seção                                                           */
/* ------------------------------------------------------------------ */

export function ContentSection() {
  const { secao } = useParams()
  const { schema, list, reload } = useContent()
  const [params, setParams] = useSearchParams()
  const [toast, setToast] = useState<string | null>(null)
  const onlyChanged = params.get('filtro') === 'mudancas'
  const sections = useMemo(() => (schema && list ? sectionsOf(schema, list) : []), [schema, list])
  const s = sections.find((x) => x.id === secao)

  if (schema && list && !s) return <Navigate to="/conteudo" replace />
  const docs = s?.docs.filter((d) => !onlyChanged || pending(d)) ?? []

  return (
    <div tw="mx-auto w-full max-w-[960px]">
      <Link to="/conteudo" tw="inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-pine-800 no-underline hover:underline">
        <Back width={16} height={16} /> Conteúdo
      </Link>

      {/* Atalho para as outras seções, sem voltar */}
      <nav aria-label="Seções" tw="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-3 pt-1 sm:(flex-wrap overflow-visible)">
        {sections.map((x) => (
          <Link
            key={x.id} to={sectionLink(x.id)} aria-current={x.id === secao ? 'page' : undefined}
            css={[
              tw`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 font-sans text-[13px] font-semibold no-underline transition`,
              x.id === secao ? tw`bg-pine-800 text-white` : tw`bg-white text-pine-900 shadow-card hover:bg-mist`,
            ]}
          >
            <x.Icon width={16} height={16} /> {x.label}
            {x.pending > 0 && <span tw="h-2 w-2 rounded-full bg-sun-500" title="Tem mudança para publicar" />}
          </Link>
        ))}
      </nav>

      {!s && <p tw="mt-8 font-sans text-[13px] text-muted">Carregando…</p>}
      {s && (
        <>
          <div tw="mt-6 flex flex-wrap items-end justify-between gap-4">
            <h1 tw="m-0 flex items-center gap-4 font-script text-[48px] font-normal leading-[1] text-pine-900 sm:text-[60px]">
              <span tw="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun-500 text-white"><s.Icon width={24} height={24} /></span>
              {s.label}
            </h1>
            <ChangedToggle on={onlyChanged} onToggle={() => setParams(onlyChanged ? {} : { filtro: 'mudancas' })} />
          </div>

          <div tw="mt-8 flex flex-col gap-10">
            {s.docs.length > 0 && (
              <section tw="flex flex-col gap-3">
                {s.cols.length > 0 && <h2 tw="m-0 font-script text-[32px] font-normal leading-none text-pine-800">Partes da página</h2>}
                <div css={inboxCss}>
                  {docs.map((d) => <InboxRow key={d.key} d={d} />)}
                  {!docs.length && <p tw="m-0 px-5 py-6 text-center font-sans text-[13.5px] text-muted">Nada com mudança aqui.</p>}
                </div>
              </section>
            )}
            {s.cols.map((c) => (
              <CollectionBlock
                key={c.def.key} def={c.def} items={c.items} onlyChanged={onlyChanged}
                onChanged={reload} onToast={setToast}
                startAdding={params.get('novo') === c.def.key}
              />
            ))}
          </div>
        </>
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
