import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import tw from 'twin.macro'
import type { CollectionDef, Field } from '../../../src/cms/fields'
import { ApiError, api, timeAgo, type DocMeta } from '../api'
import { Arrow, Plus } from '../components/icons'
import { Alert, Button, Modal, Toast } from '../components/ui'
import { FieldEditor, FormEnvProvider } from './FieldEditor'
import { useRefOptions } from './DocEditor'
import { GROUPS, STATUS, emptyFromFields, useSchema } from './model'

const editLink = (d: DocMeta) => `/editar?rota=${encodeURIComponent(d.route)}&doc=${encodeURIComponent(d.key)}`

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

function DocRow({ d, drag }: { d: DocMeta; drag?: { onStart: () => void; onDrop: () => void } }) {
  const [over, setOver] = useState(false)
  return (
    <Link
      to={editLink(d)}
      draggable={!!drag}
      onDragStart={drag?.onStart}
      onDragOver={drag ? (e) => { e.preventDefault(); setOver(true) } : undefined}
      onDragLeave={drag ? () => setOver(false) : undefined}
      onDrop={drag ? (e) => { e.preventDefault(); setOver(false); drag.onDrop() } : undefined}
      css={[
        tw`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 no-underline ring-1 ring-line transition hover:(-translate-y-0.5 shadow-card)`,
        over && tw`ring-2 ring-sun-500`,
      ]}
    >
      {drag && <span aria-hidden="true" tw="cursor-grab font-sans text-[14px] text-muted/60">⠿</span>}
      <span tw="min-w-0 flex-1">
        <span tw="block truncate font-sans text-[14px] font-medium text-ink">{d.label}</span>
        <span tw="block font-sans text-[11.5px] text-muted">
          {d.status === 'publicado' ? `No ar ${d.publishedAt ? timeAgo(d.publishedAt) : ''}` : `Rascunho ${timeAgo(d.draftUpdatedAt)}${d.draftUpdatedBy ? ` · ${d.draftUpdatedBy}` : ''}`}
          {d.editingBy.length > 0 && <span tw="ml-2 font-semibold text-sun-600">✋ {d.editingBy.join(', ')} editando</span>}
        </span>
      </span>
      <StatusChip d={d} />
      <Arrow width={16} height={16} tw="shrink-0 text-pine-800" />
    </Link>
  )
}

/** Nova página, artigo ou página de produto: pede só o essencial (nome, endereço e escolhas obrigatórias). */
function NewItem({ def, onClose, onCreated }: { def: CollectionDef; onClose: () => void; onCreated: (d: DocMeta) => void }) {
  const { refOptions, reloadRef } = useRefOptions()
  const required = Object.entries(def.fields).filter(([k, f]) => k !== def.idField && k !== def.titleField && f.kind === 'ref' && !f.optional)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [touchedSlug, setTouchedSlug] = useState(false)
  const [extra, setExtra] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const toSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70)

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

function CollectionBlock({ def, items, onChanged, startAdding = false }: { def: CollectionDef; items: DocMeta[]; onChanged: () => void; startAdding?: boolean }) {
  const navigate = useNavigate()
  const [adding, setAdding] = useState(startAdding)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const ordered = [...items].sort((a, b) => a.position - b.position)

  const drop = async (to: number) => {
    if (dragFrom === null || dragFrom === to) return
    const keys = ordered.map((d) => d.key)
    const [k] = keys.splice(dragFrom, 1)
    keys.splice(to, 0, k)
    setDragFrom(null)
    try {
      await api.order(def.key, keys)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não deu para mudar a ordem.')
    }
  }

  return (
    <div tw="flex flex-col gap-2">
      <div tw="flex items-center justify-between gap-3">
        <h3 tw="m-0 font-sans text-[13px] font-semibold uppercase tracking-[.12em] text-muted">{def.label}</h3>
        <Button variant="ghost" tw="px-3.5 py-1.5 text-[12.5px]" onClick={() => setAdding(true)}>
          <Plus width={15} height={15} /> Novo
        </Button>
      </div>
      {ordered.length > 1 && <p tw="m-0 font-sans text-[11.5px] text-muted">Arraste para mudar a ordem no site.</p>}
      {error && <Alert>{error}</Alert>}
      {ordered.map((d, i) => (
        <DocRow key={d.key} d={d} drag={{ onStart: () => setDragFrom(i), onDrop: () => drop(i) }} />
      ))}
      {!ordered.length && <p tw="m-0 font-sans text-[13px] text-muted">Nenhum ainda.</p>}
      {adding && <NewItem def={def} onClose={() => setAdding(false)} onCreated={(d) => navigate(editLink(d))} />}
    </div>
  )
}

export function ContentList() {
  const schema = useSchema()
  const [params, setParams] = useSearchParams()
  const [list, setList] = useState<DocMeta[] | null>(null)
  const [onlyChanged, setOnlyChanged] = useState(params.get('filtro') === 'mudancas')
  const [toast, setToast] = useState<string | null>(null)
  const reload = useCallback(() => api.contentList().then(setList), [])
  useEffect(() => {
    reload()
  }, [reload])

  const groups = useMemo(() => {
    if (!schema || !list) return []
    return GROUPS.map((g) => {
      const order = (key: string) => schema.docs.findIndex((x) => x.key === key)
      const docs = list
        .filter((d) => !d.collection && d.group === g.id && (!onlyChanged || d.status !== 'publicado'))
        .sort((a, b) => order(a.key) - order(b.key))
      const cols = schema.collections.filter((c) => c.group === g.id)
      return { ...g, docs, cols }
    }).filter((g) => g.docs.length || g.cols.length)
  }, [schema, list, onlyChanged])

  return (
    <div>
      <div tw="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Conteúdo</h1>
          <p tw="m-0 mt-2 font-sans text-[14.5px] text-muted">Todas as partes do site, página por página. O jeito mais fácil continua sendo tocar no próprio site, em "Editar o site".</p>
        </div>
        <button
          type="button"
          onClick={() => { setOnlyChanged((v) => !v); setParams(onlyChanged ? {} : { filtro: 'mudancas' }) }}
          css={[tw`cursor-pointer rounded-full border-0 px-4 py-2 font-sans text-[13px] font-medium`, onlyChanged ? tw`bg-sun-500 text-white` : tw`bg-white text-pine-900 ring-1 ring-line`]}
        >
          Só o que tem mudança para publicar
        </button>
      </div>

      <div tw="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
        {groups.map((g) => (
          <section key={g.id} tw="flex flex-col gap-3">
            <h2 tw="m-0 flex items-center gap-2 font-serif text-[1.5rem] font-bold text-ink">
              <span aria-hidden="true">{g.emoji}</span> {g.label}
            </h2>
            {g.docs.map((d) => <DocRow key={d.key} d={d} />)}
            {g.cols.map((c) => (
              <CollectionBlock
                key={c.key}
                def={c}
                items={(list ?? []).filter((d) => d.collection === c.key && (!onlyChanged || d.status !== 'publicado'))}
                onChanged={() => { reload(); setToast('Ordem atualizada no site') }}
                startAdding={params.get('novo') === c.key}
              />
            ))}
          </section>
        ))}
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
