import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import tw from 'twin.macro'
import type { Fields } from '../../../src/cms/fields'
import { ApiError, api, formatDateTime, parseDate, timeAgo, type VersionItem } from '../api'
import { Back, Close } from '../components/icons'
import { Alert, Button, Stamp } from '../components/ui'
import { FieldEditor, FormEnvProvider } from './FieldEditor'
import { usePickImage } from './Media'
import { STATUS, definitionOf, isCollection, pathLabels, useSchema } from './model'
import type { DocSession } from './session'

/* ------------------------------------------------------------------ */
/* Opções das listas de outras partes do site (destinos, assuntos…)    */
/* ------------------------------------------------------------------ */

export function useRefOptions() {
  const [docs, setDocs] = useState<Record<string, Record<string, unknown> | 'loading'>>({})
  const loading = useRef(new Set<string>())
  return useCallback(
    (source: string, list: string, valueField: string, labelField: string) => {
      const d = docs[source]
      if (!d) {
        if (!loading.current.has(source)) {
          loading.current.add(source)
          api.getDoc(source).then((full) => setDocs((all) => ({ ...all, [source]: full.draft }))).catch(() => {})
        }
        return null
      }
      if (d === 'loading') return null
      const items = (d[list] as Record<string, unknown>[] | undefined) ?? []
      return items.map((x) => ({ value: String(x[valueField]), label: String(x[labelField] ?? x[valueField]) }))
    },
    [docs],
  )
}

/* ------------------------------------------------------------------ */
/* O que mudou (resumo antes de publicar)                              */
/* ------------------------------------------------------------------ */

function changedPaths(a: unknown, b: unknown, path = '', out: string[] = []): string[] {
  if (out.length > 12) return out
  if (JSON.stringify(a) === JSON.stringify(b)) return out
  const isObj = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v)
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) {
      changedPaths((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], path ? `${path}.${k}` : k, out)
    }
  } else if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    a.forEach((x, i) => changedPaths(x, b[i], path ? `${path}.${i}` : String(i), out))
  } else out.push(path)
  return out
}

export function changeSummary(fields: Fields, draft: unknown, published: unknown): string[] {
  if (!published) return ['Conteúdo novo']
  const paths = changedPaths(published, draft)
  const labels = paths.map((p) => pathLabels(fields, draft, p).join(' › ') || 'Conteúdo')
  return [...new Set(labels)].slice(0, 8)
}

/* ------------------------------------------------------------------ */
/* Carimbo de passaporte ao publicar                                   */
/* ------------------------------------------------------------------ */

export function PublishedStamp({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900)
    return () => clearTimeout(t)
  }, [onDone])
  const day = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '')
  return (
    <div tw="pointer-events-none fixed inset-0 z-[70] grid place-items-center" aria-live="polite">
      <div className="stamp-in">
        <Stamp top="Publicado ✓" main={day} bottom="Turista Life" rotate={-12} big tw="bg-cream/95 px-8 py-4" />
      </div>
      <style>{`
        .stamp-in { animation: stamp-in 1.9s cubic-bezier(.2,.9,.3,1.2) both; }
        @keyframes stamp-in {
          0% { transform: scale(2.6); opacity: 0; }
          18% { transform: scale(.94); opacity: 1; }
          26% { transform: scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: scale(1) translateY(-12px); }
        }
        @media (prefers-reduced-motion: reduce) { .stamp-in { animation: none; } }
      `}</style>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Caderno de versões de um documento                                  */
/* ------------------------------------------------------------------ */

const ACTION_LABEL: Record<string, string> = { original: 'Conteúdo original', publicado: 'Publicado', restaurado: 'Restaurado', removido: 'Saiu do site' }

function Versions({ docKey, onRestored }: { docKey: string; onRestored: () => void }) {
  const [items, setItems] = useState<VersionItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api.versions(docKey).then(setItems).catch(() => setItems([]))
  }, [docKey])
  return (
    <div tw="flex flex-col gap-2">
      <p tw="m-0 font-sans text-[13px] text-muted">Cada publicação fica guardada por um ano. Voltar para uma versão publica ela na hora.</p>
      {error && <Alert>{error}</Alert>}
      {items?.map((v, i) => (
        <div key={v.id} tw="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-line">
          <div>
            <p tw="m-0 font-sans text-[13.5px] font-medium text-ink">
              {ACTION_LABEL[v.action] ?? v.action} {i === 0 && <span tw="ml-1 rounded-full bg-mist px-2 py-0.5 text-[11px] text-pine-800">no ar</span>}
            </p>
            <p tw="m-0 font-sans text-[11.5px] text-muted">{formatDateTime(v.createdAt)} · {v.createdBy ?? 'sistema'}</p>
          </div>
          {i > 0 && v.data && (
            <Button
              variant="ghost" tw="px-3 py-1.5 text-[12px]"
              onClick={async () => {
                try {
                  await api.restoreVersion(docKey, v.id)
                  onRestored()
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Não deu para voltar.')
                }
              }}
            >
              Voltar para esta
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Seções da página: ligar, desligar e reordenar                       */
/* ------------------------------------------------------------------ */

type LayoutValue = { sections: { id: string; visible: boolean }[] }

function LayoutEditor({ fields, value, onChange }: { fields: Fields; value: LayoutValue; onChange: (v: LayoutValue) => void }) {
  const [drag, setDrag] = useState<number | null>(null)
  const sectionField = fields.sections
  const idField = sectionField?.kind === 'list' && sectionField.of.kind === 'object' ? sectionField.of.fields.id : undefined
  const label = (id: string) => (idField?.kind === 'select' ? idField.options.find((o) => o.value === id)?.label : undefined) ?? id
  const list = value.sections ?? []
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return
    const next = [...list]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    onChange({ ...value, sections: next })
  }
  return (
    <div tw="flex flex-col gap-2">
      <p tw="m-0 mb-2 font-sans text-[13px] text-muted">Arraste para mudar a ordem. Desligada, a seção some do site (o conteúdo dela continua guardado).</p>
      {list.map((s, i) => (
        <div
          key={s.id}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (drag !== null) move(drag, i); setDrag(null) }}
          css={[tw`flex cursor-grab items-center gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-line active:cursor-grabbing`, !s.visible && tw`opacity-60`]}
        >
          <span aria-hidden="true" tw="font-sans text-[14px] text-muted/60">⠿</span>
          <span tw="flex-1 font-sans text-[14px] font-medium text-ink">{label(s.id)}</span>
          <button
            type="button" role="switch" aria-checked={s.visible} aria-label={`${label(s.id)} aparece no site`}
            onClick={() => onChange({ ...value, sections: list.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)) })}
            css={[tw`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 transition`, s.visible ? tw`bg-pine-700` : tw`bg-line`]}
          >
            <span css={[tw`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all`, s.visible ? tw`left-[22px]` : tw`left-0.5`]} />
          </button>
          <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir" tw="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-mist disabled:opacity-30">↑</button>
          <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label="Descer" tw="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-mist disabled:opacity-30">↓</button>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Gaveta de edição de um documento                                    */
/* ------------------------------------------------------------------ */

export function DocEditor({ session, focusPath, onClose, onPublished }: {
  session: DocSession; focusPath?: string; onClose: () => void; onPublished?: () => void
}) {
  const schema = useSchema()
  const pickImage = usePickImage()
  const refOptions = useRefOptions()
  const [tab, setTab] = useState<'editar' | 'historico'>('editar')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; list: string[] } | null>(null)
  const [stamp, setStamp] = useState(false)
  const [confirm, setConfirm] = useState<'publish' | 'schedule' | 'discard' | 'remove' | null>(null)
  const [when, setWhen] = useState('')
  const { doc, draft } = session

  const def = schema && doc ? definitionOf(schema, doc.key) : undefined
  const summary = useMemo(() => (def && draft && doc ? changeSummary(def.fields, draft, doc.published) : []), [def, draft, doc])
  if (!schema || !doc || !draft || !def) {
    return <div tw="p-8 font-sans text-[14px] text-muted">{session.message ?? 'Abrindo…'}</div>
  }

  const status = STATUS[doc.status]
  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true)
    setError(null)
    try {
      if (!(await session.flush())) throw new ApiError(422, 'invalid', session.message ?? 'Confira os campos destacados.')
      await fn()
      await session.reload()
      after?.()
    } catch (err) {
      if (err instanceof ApiError) setError({ message: err.message, list: err.problems.map((p) => p.message) })
      else setError({ message: 'Algo deu errado. Tente de novo.', list: [] })
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const saveLabel = { idle: '', saving: 'Salvando rascunho…', saved: 'Rascunho salvo ✓', error: 'Não salvou: confira os campos' }[session.save]

  return (
    <FormEnvProvider value={{ problems: session.problems, focusPath, pickImage, refOptions }}>
      <div tw="flex h-full flex-col">
        <header tw="flex items-start justify-between gap-3 border-0 border-b border-solid border-line px-6 pb-4 pt-6">
          <div tw="min-w-0">
            <p tw="m-0 font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-sun-600">{isCollection(def) ? def.label : 'Editando'}</p>
            <h2 tw="m-0 mt-1 truncate font-serif text-[1.45rem] font-bold text-ink">{doc.label}</h2>
            <div tw="mt-2 flex flex-wrap items-center gap-2 font-sans text-[11.5px]">
              <span
                css={[
                  tw`rounded-full px-2.5 py-1 font-semibold`,
                  status.tone === 'ok' && tw`bg-mist text-pine-800`,
                  status.tone === 'draft' && tw`bg-[#FFF4EC] text-sun-600`,
                  status.tone === 'new' && tw`bg-[#EEF4FF] text-[#3538CD]`,
                  status.tone === 'out' && tw`bg-[#FEF3F2] text-[#B42318]`,
                ]}
              >
                {status.label}
              </span>
              {doc.scheduledAt && <span tw="rounded-full bg-pine-800 px-2.5 py-1 font-semibold text-white">Agendado: {formatDateTime(doc.scheduledAt)}</span>}
              <span tw="text-muted">{saveLabel}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" tw="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:bg-mist">
            <Close width={20} height={20} />
          </button>
        </header>

        {session.editingBy.length > 0 && (
          <div tw="mx-6 mt-4 rounded-xl bg-[#FFF4EC] px-4 py-2.5 font-sans text-[13px] text-sun-600">
            ✋ {session.editingBy.join(' e ')} {session.editingBy.length > 1 ? 'estão' : 'está'} editando esta parte agora. Combinem antes para não apagar o trabalho uma da outra.
          </div>
        )}

        <nav tw="flex gap-1 px-6 pt-4">
          {(['editar', 'historico'] as const).map((t) => (
            <button
              key={t} type="button" onClick={() => setTab(t)}
              css={[tw`cursor-pointer rounded-full border-0 px-4 py-1.5 font-sans text-[13px] font-medium`, tab === t ? tw`bg-pine-800 text-white` : tw`bg-transparent text-muted hover:text-pine-900`]}
            >
              {t === 'editar' ? 'Editar' : 'Caderno de versões'}
            </button>
          ))}
        </nav>

        <div tw="flex-1 overflow-y-auto px-6 py-5">
          {doc.draftDeleted && (
            <div tw="mb-4"><Alert>Este item vai sair do site na próxima publicação. Para manter, use "Desfazer".</Alert></div>
          )}
          {tab === 'editar' ? (
            doc.key.startsWith('layout.') ? (
              <LayoutEditor fields={def.fields} value={draft as LayoutValue} onChange={(v) => session.setDraft(v as unknown as Record<string, unknown>)} />
            ) : (
              <FieldEditor field={{ kind: 'object', label: '', fields: def.fields }} value={draft} path="" onChange={(v) => session.setDraft(v as Record<string, unknown>)} />
            )
          ) : (
            <Versions key={doc.publishedAt ?? ""} docKey={doc.key} onRestored={() => { session.reload(); setStamp(true); onPublished?.() }} />
          )}
        </div>

        <footer tw="border-0 border-t border-solid border-line bg-white/70 px-6 py-4">
          {error && (
            <div tw="mb-3">
              <Alert>
                {error.message}
                {error.list.length > 0 && <ul tw="m-0 mt-1 pl-4">{error.list.map((m) => <li key={m}>{m}</li>)}</ul>}
              </Alert>
            </div>
          )}

          {confirm === 'publish' && (
            <div tw="mb-3 rounded-2xl bg-cream p-4 ring-1 ring-line">
              <p tw="m-0 font-sans text-[13px] font-semibold text-pine-900">Vai para o ar:</p>
              <ul tw="m-0 mt-1.5 pl-4 font-sans text-[13px] text-ink">
                {(doc.draftDeleted ? ['Este item sai do site'] : summary.length ? summary : ['Nenhuma mudança: o site já está assim.']).map((s) => <li key={s}>{s}</li>)}
              </ul>
              <div tw="mt-3 flex gap-2">
                <Button variant="sun" disabled={busy} onClick={() => run(() => api.publish(doc.key), () => { setStamp(true); onPublished?.() })}>
                  {busy ? 'Publicando…' : 'Publicar agora'}
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(null)}>Voltar</Button>
              </div>
            </div>
          )}

          {confirm === 'schedule' && (
            <div tw="mb-3 rounded-2xl bg-cream p-4 ring-1 ring-line">
              <label tw="font-sans text-[13px] font-semibold text-pine-900" htmlFor="when">Publicar sozinho em:</label>
              <input
                id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                tw="mt-2 block rounded-xl border-[1.5px] border-solid border-line bg-white px-3 py-2 font-sans text-[14px]"
              />
              <p tw="m-0 mt-2 font-sans text-[12px] text-muted">Vai o rascunho como estiver nessa hora. Dá para continuar editando até lá.</p>
              <div tw="mt-3 flex flex-wrap gap-2">
                <Button variant="pine" disabled={!when || busy} onClick={() => run(() => api.schedule(doc.key, new Date(when).toISOString()))}>Agendar</Button>
                {doc.scheduledAt && <Button variant="ghost" onClick={() => run(() => api.schedule(doc.key, null))}>Cancelar agendamento</Button>}
                <Button variant="ghost" onClick={() => setConfirm(null)}>Voltar</Button>
              </div>
            </div>
          )}

          {confirm === 'discard' && (
            <div tw="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#FFF4EC] p-4">
              <p tw="m-0 flex-1 font-sans text-[13px] text-ink">{doc.published ? 'Jogar fora as mudanças e voltar ao que está no ar?' : 'Apagar este rascunho? Ele nunca foi publicado.'}</p>
              <Button variant="danger" disabled={busy} onClick={() => run(() => api.discard(doc.key), () => !doc.published && onClose())}>Sim, descartar</Button>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Não</Button>
            </div>
          )}

          {confirm === 'remove' && (
            <div tw="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#FEF3F2] p-4">
              <p tw="m-0 flex-1 font-sans text-[13px] text-ink">Tirar "{doc.label}" do site? Ele sai na próxima publicação e fica no caderno de versões.</p>
              <Button variant="danger" disabled={busy} onClick={() => run(() => api.removeDoc(doc.key), () => !doc.published && onClose())}>Tirar do site</Button>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Não</Button>
            </div>
          )}

          {!confirm && (
            <div tw="flex flex-wrap items-center gap-2">
              <Button variant="sun" disabled={busy || doc.status === 'publicado'} onClick={() => setConfirm('publish')}>
                Publicar
              </Button>
              <Button variant="ghost" disabled={busy || doc.status === 'publicado'} onClick={() => { setWhen(''); setConfirm('schedule') }}>
                Agendar
              </Button>
              {(doc.status !== 'publicado' || doc.draftDeleted) && (
                <Button variant="ghost" disabled={busy} onClick={() => setConfirm('discard')}>
                  <Back width={16} height={16} /> {doc.draftDeleted ? 'Desfazer' : 'Descartar rascunho'}
                </Button>
              )}
              {doc.collection && !doc.draftDeleted && (
                <button type="button" onClick={() => setConfirm('remove')} tw="ml-auto cursor-pointer border-0 bg-transparent font-sans text-[12.5px] text-[#B42318] underline">
                  Tirar do site
                </button>
              )}
              {doc.status === 'publicado' && (
                <span tw="font-sans text-[12px] text-muted">
                  No ar desde {doc.publishedAt ? timeAgo(doc.publishedAt) : '—'}
                  {doc.publishedBy && doc.publishedAt && parseDate(doc.publishedAt) ? ` · ${doc.publishedBy}` : ''}
                </span>
              )}
            </div>
          )}
        </footer>
      </div>
      {stamp && <PublishedStamp onDone={() => setStamp(false)} />}
    </FormEnvProvider>
  )
}
