import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import tw from 'twin.macro'
import { api, type DocMeta } from '../api'
import { Close } from '../components/icons'
import { Button } from '../components/ui'
import { DocEditor } from './DocEditor'
import { usePickImage } from './Media'
import { GROUPS, STATUS, definitionOf, pathLabels, previewUrl, useSchema } from './model'
import { useDocSession } from './session'

type Target = { key: string; path: string; kind: 'text' | 'image' | 'link' }
type Rect = { top: number; left: number; width: number; height: number }
type Pending = { kind: 'text'; path: string; rect: Rect } | { kind: 'image'; path: string } | null

/** Páginas que dá para abrir na pré-visualização. */
function usePages(list: DocMeta[] | null) {
  return useMemo(() => {
    const seen = new Map<string, string>()
    const add = (route: string, label: string) => !seen.has(route) && seen.set(route, label)
    add('/', 'Página inicial')
    for (const g of GROUPS) {
      for (const d of list ?? []) {
        if (d.group !== g.id || d.key.startsWith('layout.') || d.group === 'geral') continue
        if (d.collection) add(d.route, d.label)
        else if (d.key.endsWith('.page')) add(d.route, GROUPS.find((x) => x.id === d.group)?.label ?? d.label)
      }
    }
    for (const d of list ?? []) if (d.key === 'blog.destinations') add('/blog', 'Blog')
    return [...seen.entries()].map(([route, label]) => ({ route, label }))
  }, [list])
}

export function SiteEditor() {
  const schema = useSchema()
  const pickImage = usePickImage()
  const [params, setParams] = useSearchParams()
  const route = params.get('rota') ?? '/'
  const [openKey, setOpenKey] = useState<string | null>(params.get('doc'))
  const [focusPath, setFocusPath] = useState<string | undefined>(params.get('campo') ?? undefined)
  const [drawer, setDrawer] = useState(!!params.get('doc'))
  const [pending, setPending] = useState<Pending>(null)
  const [inline, setInline] = useState<{ path: string; rect: Rect } | null>(null)
  const [editing, setEditing] = useState(true)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [list, setList] = useState<DocMeta[] | null>(null)
  const [showPending, setShowPending] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const [frameSrc] = useState(() => previewUrl(route))

  const refreshList = useCallback(() => api.contentList().then(setList).catch(() => {}), [])
  useEffect(() => {
    refreshList()
  }, [refreshList])

  const send = useCallback((msg: unknown) => frame.current?.contentWindow?.postMessage(msg, location.origin), [])
  const session = useDocSession(openKey, (key, draft) => send({ type: 'cms:update', key, value: draft }))
  const pages = usePages(list)

  // Mensagens da pré-visualização (mesma origem).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return
      const msg = e.data as { type: string; targets?: Target[]; rect?: Rect; path?: string }
      if (msg.type === 'cms:route' && msg.path) {
        setParams((p) => { p.set('rota', msg.path!); return p }, { replace: true })
      } else if (msg.type === 'cms:edit' && msg.targets?.length) {
        const t = msg.targets[0]
        setOpenKey(t.key)
        setFocusPath(t.path)
        setInline(null)
        // Link (ex.: ícone de rede social): não tem texto para a caixinha rápida, abre a gaveta no campo.
        if (t.kind === 'link') setDrawer(true)
        else setPending(t.kind === 'image' ? { kind: 'image', path: t.path } : { kind: 'text', path: t.path, rect: msg.rect! })
      }
    }
    addEventListener('message', onMessage)
    return () => removeEventListener('message', onMessage)
  }, [setParams])

  // Quando o documento clicado termina de abrir, faz o que a pessoa pediu.
  useEffect(() => {
    if (!pending || !session.draft || session.doc?.key !== openKey) return
    const p = pending
    setPending(null)
    if (p.kind === 'text') setInline({ path: p.path, rect: p.rect })
    else {
      pickImage(String(session.value(p.path) ?? '')).then((v) => {
        if (v === null) return
        session.update(p.path, v)
        // Foto nova: vale o ponto de foco da biblioteca (sai o enquadramento antigo do conteúdo).
        const parent = p.path.split('.').slice(0, -1).join('.')
        const posPath = parent ? `${parent}.position` : 'position'
        if (session.value(posPath) !== undefined) session.update(posPath, undefined)
      })
    }
  }, [pending, session, openKey, pickImage])

  useEffect(() => send({ type: 'cms:mode', editing }), [editing, send])
  // Rascunho salvo: atualiza o contador de mudanças para publicar.
  useEffect(() => {
    if (session.save === 'saved') refreshList()
  }, [session.save, refreshList])

  const navigate = (r: string) => {
    send({ type: 'cms:navigate', path: r })
    setParams((p) => { p.set('rota', r); return p })
  }

  const openDoc = (key: string, path?: string) => {
    setOpenKey(key)
    setFocusPath(path)
    setInline(null)
    setDrawer(true)
  }

  const layoutKey = useMemo(() => {
    const d = schema?.docs.find((x) => x.key.startsWith('layout.') && x.route === route)
    return d?.key
  }, [schema, route])

  const changed = (list ?? []).filter((d) => d.status !== 'publicado')
  const def = schema && openKey ? definitionOf(schema, openKey) : undefined
  const frameBox = frame.current?.getBoundingClientRect()

  return (
    <div tw="-mx-4 -mb-24 -mt-6 flex h-[calc(100vh-76px)] min-h-[560px] sm:(-mx-8 -mt-10)">
      <div tw="flex min-w-0 flex-1 flex-col">
        {/* Barra de ferramentas */}
        <div tw="flex flex-wrap items-center gap-2 border-0 border-b border-solid border-line bg-white/80 px-5 py-2.5">
          <select
            value={pages.some((p) => p.route === route) ? route : ''}
            onChange={(e) => e.target.value && navigate(e.target.value)}
            aria-label="Página"
            tw="max-w-[280px] rounded-full border-[1.5px] border-solid border-line bg-white px-4 py-2 font-sans text-[13px] font-medium text-pine-900"
          >
            {!pages.some((p) => p.route === route) && <option value="">{route}</option>}
            {pages.map((p) => <option key={p.route} value={p.route}>{p.label}</option>)}
          </select>

          <div tw="flex rounded-full bg-mist p-1" role="radiogroup" aria-label="Modo">
            {[
              { v: true, label: '✎ Editar' },
              { v: false, label: '🧭 Navegar' },
            ].map((m) => (
              <button
                key={String(m.v)} type="button" role="radio" aria-checked={editing === m.v} onClick={() => setEditing(m.v)}
                css={[tw`cursor-pointer rounded-full border-0 px-3.5 py-1.5 font-sans text-[12.5px] font-medium`, editing === m.v ? tw`bg-white text-pine-900 shadow` : tw`bg-transparent text-muted`]}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div tw="flex rounded-full bg-mist p-1" role="radiogroup" aria-label="Tela">
            {(['desktop', 'mobile'] as const).map((d) => (
              <button
                key={d} type="button" role="radio" aria-checked={device === d} onClick={() => setDevice(d)}
                css={[tw`cursor-pointer rounded-full border-0 px-3.5 py-1.5 font-sans text-[12.5px] font-medium`, device === d ? tw`bg-white text-pine-900 shadow` : tw`bg-transparent text-muted`]}
              >
                {d === 'desktop' ? '🖥 Computador' : '📱 Celular'}
              </button>
            ))}
          </div>

          {layoutKey && (
            <Button variant="ghost" tw="px-3.5 py-1.5 text-[12.5px]" onClick={() => openDoc(layoutKey)}>
              ☰ Seções desta página
            </Button>
          )}

          <div tw="relative ml-auto">
            <Button variant={changed.length ? 'sun' : 'ghost'} tw="px-4 py-1.5 text-[12.5px]" onClick={() => { refreshList(); setShowPending((s) => !s) }}>
              {changed.length ? `${changed.length} ${changed.length === 1 ? 'mudança' : 'mudanças'} para publicar` : 'Tudo publicado ✓'}
            </Button>
            {showPending && (
              <div tw="absolute right-0 top-[calc(100%+8px)] z-30 w-[min(380px,calc(100vw-24px))] rounded-2xl bg-white p-3 shadow-lift">
                {changed.length === 0 && <p tw="m-2 font-sans text-[13px] text-muted">Nada esperando. O site está igual ao que você vê aqui.</p>}
                {changed.map((d) => (
                  <button
                    key={d.key} type="button"
                    onClick={() => { setShowPending(false); navigate(d.route); openDoc(d.key) }}
                    tw="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left hover:bg-mist"
                  >
                    <span tw="min-w-0">
                      <span tw="block truncate font-sans text-[13.5px] font-medium text-ink">{d.label}</span>
                      <span tw="block font-sans text-[11.5px] text-muted">{STATUS[d.status].label}{d.draftUpdatedBy ? ` · ${d.draftUpdatedBy}` : ''}</span>
                    </span>
                    <span tw="font-sans text-[12px] font-semibold text-sun-600">Abrir</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* O site */}
        <div tw="relative flex-1 overflow-hidden bg-[#E9E6DF]">
          <div css={[tw`mx-auto h-full transition-all duration-300`, device === 'mobile' ? tw`w-[390px] py-4` : tw`w-full`]}>
            <iframe
              ref={frame}
              src={frameSrc}
              title="Pré-visualização do site"
              css={[tw`h-full w-full border-0 bg-white`, device === 'mobile' && tw`rounded-[28px] shadow-lift ring-8 ring-pine-950`]}
            />
          </div>
          {editing && !drawer && !inline && (
            <p tw="pointer-events-none absolute bottom-4 left-1/2 m-0 -translate-x-1/2 rounded-full bg-pine-900/90 px-4 py-2 font-sans text-[12.5px] text-white shadow-lift">
              Toque em qualquer texto ou foto para mudar
            </p>
          )}
        </div>
      </div>

      {/* Editor rápido de um texto, em cima do site */}
      {inline && session.draft && def && frameBox && (
        <InlineEditor
          rect={inline.rect}
          frame={frameBox}
          labels={pathLabels(def.fields, session.draft, inline.path)}
          docLabel={session.doc?.label ?? ''}
          value={String(session.value(inline.path) ?? '')}
          long={String(session.value(inline.path) ?? '').length > 60}
          onChange={(v) => session.update(inline.path, v)}
          onClose={() => setInline(null)}
          onMore={() => { setDrawer(true); setInline(null) }}
          saveState={session.save}
        />
      )}

      {drawer && openKey && (
        // No celular a gaveta ocupa a tela inteira (ao lado, a pré-visualização ficaria sem espaço).
        <aside tw="fixed inset-0 z-40 w-full border-0 border-l border-solid border-line bg-cream shadow-lift md:(static z-auto h-full w-[480px] shrink-0)">
          <DocEditor
            key={openKey}
            session={session}
            focusPath={focusPath}
            onClose={() => { setDrawer(false); refreshList() }}
            onPublished={refreshList}
            onChanged={refreshList}
          />
        </aside>
      )}
    </div>
  )
}

function InlineEditor({ rect, frame, labels, docLabel, value, long, onChange, onClose, onMore, saveState }: {
  rect: Rect; frame: DOMRect; labels: string[]; docLabel: string; value: string; long: boolean
  onChange: (v: string) => void; onClose: () => void; onMore: () => void; saveState: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  const width = Math.min(Math.max(rect.width + 40, 360), 560)
  const left = Math.min(Math.max(frame.left + rect.left - 20, 12), window.innerWidth - width - 12)
  const below = frame.top + rect.top + rect.height + 12
  const top = below + 220 > window.innerHeight ? Math.max(frame.top + rect.top - 230, 90) : below
  return (
    <div role="dialog" aria-label="Editar texto" tw="fixed z-40 rounded-2xl bg-white p-4 shadow-lift ring-2 ring-sun-500" style={{ left, top, width }}>
      <div tw="mb-2 flex items-start justify-between gap-3">
        <p tw="m-0 font-sans text-[11.5px] text-muted">
          <span tw="font-semibold text-pine-900">{docLabel}</span>
          {labels.length > 0 && ` › ${labels.join(' › ')}`}
        </p>
        <button type="button" onClick={onClose} aria-label="Fechar" tw="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted hover:bg-mist">
          <Close width={16} height={16} />
        </button>
      </div>
      <textarea
        ref={ref} value={value} rows={long ? 3 : 1} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && !long && !e.shiftKey) { e.preventDefault(); onClose() } }}
        tw="w-full resize-none rounded-xl border-[1.5px] border-solid border-line bg-cream px-3 py-2.5 font-sans text-[15px] leading-relaxed text-ink outline-none focus:border-pine-700"
      />
      <div tw="mt-3 flex items-center gap-2">
        <Button variant="pine" tw="px-4 py-2 text-[12.5px]" onClick={onClose}>Pronto</Button>
        <button type="button" onClick={onMore} tw="cursor-pointer border-0 bg-transparent font-sans text-[12.5px] font-semibold text-pine-800 underline">
          Abrir esta parte inteira
        </button>
        <span tw="ml-auto font-sans text-[11.5px] text-muted">{saveState === 'saving' ? 'Salvando…' : saveState === 'saved' ? 'Rascunho salvo ✓' : ''}</span>
      </div>
    </div>
  )
}

