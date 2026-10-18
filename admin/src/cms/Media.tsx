import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import tw from 'twin.macro'
import { ApiError, api, formatDateTime, type MediaItem } from '../api'
import { Camera, Check, Search } from '../components/icons'
import { Alert, Button, Drawer, Modal, Toast } from '../components/ui'
import { assetUrl } from './FieldEditor'

const MAX_MB = 25
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

/* ------------------------------------------------------------------ */
/* Envio                                                               */
/* ------------------------------------------------------------------ */

type Pending = { id: string; file: File; preview: string | null; alt: string; error?: string; sending?: boolean }

function Uploader({ onUploaded }: { onUploaded: (m: MediaItem) => void }) {
  const [pending, setPending] = useState<Pending[]>([])
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const add = (files: FileList | null) => {
    if (!files) return
    const next: Pending[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).slice(2),
      file,
      // Fotos HEIC (iPhone) o navegador não mostra; o servidor converte.
      preview: /heic|heif/i.test(file.type + file.name) ? null : URL.createObjectURL(file),
      alt: '',
      error: file.size > MAX_MB * 1024 * 1024 ? `Essa foto passa de ${MAX_MB} MB.` : undefined,
    }))
    setPending((p) => [...p, ...next])
  }

  const send = async (p: Pending) => {
    setPending((list) => list.map((x) => (x.id === p.id ? { ...x, sending: true, error: undefined } : x)))
    try {
      const m = await api.upload(p.file, p.alt)
      setPending((list) => list.filter((x) => x.id !== p.id))
      onUploaded(m)
    } catch (err) {
      setPending((list) => list.map((x) => (x.id === p.id ? { ...x, sending: false, error: err instanceof ApiError ? err.message : 'Não deu para enviar.' } : x)))
    }
  }

  return (
    <div tw="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }}
        css={[
          tw`flex w-full cursor-pointer flex-col items-center gap-2 rounded-[22px] border-2 border-dashed bg-white/60 px-6 py-8 text-center transition`,
          over ? tw`border-sun-500 bg-white` : tw`border-pine-800/25 hover:border-sun-500`,
        ]}
      >
        <span tw="grid h-12 w-12 place-items-center rounded-full bg-sun-500 text-white"><Camera /></span>
        <span tw="font-sans text-[15px] font-semibold text-pine-900">Arraste fotos para cá ou clique para escolher</span>
        <span tw="font-sans text-[12.5px] text-muted">JPG, PNG, WebP ou HEIC (iPhone), até {MAX_MB} MB. A localização e os dados da câmera são apagados.</span>
      </button>
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />

      {pending.map((p) => (
        <div key={p.id} tw="flex items-start gap-4 rounded-2xl bg-white p-3 ring-1 ring-line">
          <div tw="grid h-[72px] w-[96px] shrink-0 place-items-center overflow-hidden rounded-xl bg-mist">
            {p.preview ? <img src={p.preview} alt="" tw="h-full w-full object-cover" /> : <Camera tw="text-muted" />}
          </div>
          <div tw="flex min-w-0 flex-1 flex-col gap-2">
            <p tw="m-0 truncate font-sans text-[12px] text-muted">{p.file.name}</p>
            <input
              value={p.alt}
              maxLength={300}
              autoFocus
              placeholder="O que aparece nesta foto? (ex.: Laura na praia de Uluwatu)"
              onChange={(e) => setPending((list) => list.map((x) => (x.id === p.id ? { ...x, alt: e.target.value } : x)))}
              onKeyDown={(e) => e.key === 'Enter' && p.alt.trim() && send(p)}
              tw="w-full rounded-xl border-[1.5px] border-solid border-line bg-white px-3 py-2 font-sans text-[13.5px] outline-none focus:border-pine-700"
            />
            {p.error && <p tw="m-0 font-sans text-[12px] font-medium text-[#B42318]">{p.error}</p>}
          </div>
          <div tw="flex flex-col gap-1.5">
            <Button type="button" variant="sun" tw="px-4 py-2 text-[12.5px]" disabled={!p.alt.trim() || p.sending || !!p.error?.includes('MB')} onClick={() => send(p)}>
              {p.sending ? 'Enviando…' : 'Enviar'}
            </Button>
            <button type="button" onClick={() => setPending((list) => list.filter((x) => x.id !== p.id))} tw="cursor-pointer border-0 bg-transparent font-sans text-[12px] text-muted underline">
              cancelar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grade de fotos                                                      */
/* ------------------------------------------------------------------ */

function useMedia(trash = false) {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const reload = useCallback(() => api.media(trash).then(setItems).catch(() => setItems([])), [trash])
  useEffect(() => {
    reload()
  }, [reload])
  return { items, setItems, reload }
}

function Grid({ items, selected, onPick }: { items: MediaItem[]; selected?: string; onPick: (m: MediaItem) => void }) {
  if (!items.length) return <p tw="py-10 text-center font-sans text-[14px] text-muted">Nenhuma foto por aqui ainda.</p>
  return (
    <div tw="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPick(m)}
          className="group"
          css={[
            tw`relative cursor-pointer overflow-hidden rounded-2xl border-0 bg-white p-0 text-left shadow-card ring-1 ring-line transition hover:(-translate-y-0.5 shadow-lift)`,
            selected === m.url && tw`ring-4 ring-sun-500`,
          ]}
        >
          <img
            src={assetUrl(`cms/media/${m.id}/${m.widths[0]}.webp`)} alt={m.alt} loading="lazy" tw="aspect-[4/3] w-full object-cover"
            style={{ objectPosition: `${m.focal[0]}% ${m.focal[1]}%` }}
          />
          <span tw="block truncate px-3 py-2 font-sans text-[12px] text-ink">{m.alt}</span>
          {m.usedIn.length > 0 && (
            <span tw="absolute right-2 top-2 rounded-full bg-pine-900/85 px-2 py-0.5 font-sans text-[10.5px] font-semibold text-white">
              em uso · {m.usedIn.length}
            </span>
          )}
          {selected === m.url && <span tw="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-sun-500 text-white"><Check width={16} height={16} /></span>}
        </button>
      ))}
    </div>
  )
}

function filterItems(items: MediaItem[], q: string) {
  const n = q.trim().toLowerCase()
  return n ? items.filter((m) => (m.alt + ' ' + m.originalName).toLowerCase().includes(n)) : items
}

/* ------------------------------------------------------------------ */
/* Escolher foto (usado pelos formulários)                             */
/* ------------------------------------------------------------------ */

type PickRequest = { current: string; resolve: (v: string | null) => void }
const PickerContext = createContext<(current: string) => Promise<string | null>>(async () => null)
export const usePickImage = () => useContext(PickerContext)

export function MediaPickerHost({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<PickRequest | null>(null)
  const pick = useCallback((current: string) => new Promise<string | null>((resolve) => setReq({ current, resolve })), [])
  const close = (v: string | null) => {
    req?.resolve(v)
    setReq(null)
  }
  return (
    <PickerContext.Provider value={pick}>
      {children}
      {req && <Picker current={req.current} onClose={close} />}
    </PickerContext.Provider>
  )
}

function Picker({ current, onClose }: { current: string; onClose: (v: string | null) => void }) {
  const { items, setItems } = useMedia()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(current)
  return (
    <Modal title="Escolher foto" onClose={() => onClose(null)} width={980}>
      <div tw="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <Uploader onUploaded={(m) => { setItems((l) => [m, ...(l ?? [])]); setSelected(m.url) }} />
        <label tw="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-line">
          <Search width={18} height={18} tw="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pela descrição" tw="w-full border-0 bg-transparent font-sans text-[14px] outline-none" />
        </label>
        {items ? <Grid items={filterItems(items, q)} selected={selected} onPick={(m) => setSelected(m.url)} /> : <p tw="font-sans text-[13px] text-muted">Carregando…</p>}
        {current.startsWith('images/') && (
          <p tw="m-0 font-sans text-[12px] text-muted">A foto atual é uma das fotos originais do site. Ela continua aqui até você escolher outra.</p>
        )}
      </div>
      <div tw="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={() => onClose(null)}>Cancelar</Button>
        <Button variant="sun" disabled={!selected || selected === current} onClick={() => onClose(selected)}>Usar esta foto</Button>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Página "Fotos"                                                      */
/* ------------------------------------------------------------------ */

function FocalPicker({ m, onChange }: { m: MediaItem; onChange: (f: [number, number]) => void }) {
  return (
    <div tw="relative cursor-crosshair overflow-hidden rounded-2xl bg-mist">
      <img
        src={assetUrl(`cms/media/${m.id}/${m.widths[Math.min(1, m.widths.length - 1)]}.webp`)} alt={m.alt} tw="block w-full select-none"
        draggable={false}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onChange([Math.round(((e.clientX - r.left) / r.width) * 100), Math.round(((e.clientY - r.top) / r.height) * 100)])
        }}
      />
      <span
        aria-hidden="true"
        tw="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-solid border-white shadow-[0_0_0_2px_#F07A2A,0_4px_12px_rgba(0,0,0,.35)] transition-all"
        style={{ left: `${m.focal[0]}%`, top: `${m.focal[1]}%` }}
      />
    </div>
  )
}

function MediaDetail({ m, onClose, onChanged, onRemoved }: { m: MediaItem; onClose: () => void; onChanged: (m: MediaItem) => void; onRemoved: () => void }) {
  const [alt, setAlt] = useState(m.alt)
  const [error, setError] = useState<string | null>(null)
  const save = async (data: { alt?: string; focal?: [number, number] }) => {
    try {
      onChanged(await api.updateMedia(m.id, data))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não deu para salvar.')
    }
  }
  return (
    <Drawer title="Foto" subtitle={`${m.width}×${m.height} · ${(m.sizeBytes / 1024).toFixed(0)} KB · enviada em ${formatDateTime(m.createdAt)}`} onClose={onClose}>
      <div tw="flex flex-col gap-5">
        <div>
          <FocalPicker m={m} onChange={(focal) => save({ focal })} />
          <p tw="mt-2 font-sans text-[12.5px] text-muted">Toque no ponto mais importante da foto (o rosto, por exemplo). Em todos os recortes do site, ele fica à vista.</p>
        </div>
        <div>
          <label htmlFor="alt" tw="mb-1.5 block font-sans text-[12.5px] font-semibold text-pine-900">O que aparece nesta foto?</label>
          <textarea
            id="alt" value={alt} maxLength={300} rows={2} onChange={(e) => setAlt(e.target.value)} onBlur={() => alt.trim() && alt !== m.alt && save({ alt })}
            tw="w-full resize-none rounded-xl border-[1.5px] border-solid border-line bg-white px-3 py-2.5 font-sans text-[14px] outline-none focus:border-pine-700"
          />
        </div>
        <div>
          <p tw="mb-2 font-sans text-[12.5px] font-semibold text-pine-900">Onde ela aparece</p>
          {m.usedIn.length ? (
            <ul tw="m-0 flex list-none flex-col gap-1.5 p-0">
              {m.usedIn.map((u) => (
                <li key={u.key}>
                  <Link to={`/editar?rota=${encodeURIComponent(u.route)}&doc=${encodeURIComponent(u.key)}`} tw="font-sans text-[13.5px] text-pine-800 underline">
                    {u.label}
                  </Link>
                  <span tw="ml-2 font-sans text-[11.5px] text-muted">{u.states.includes('publicado') ? 'no ar' : 'só no rascunho'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p tw="m-0 font-sans text-[13px] text-muted">Em nenhum lugar do site ainda.</p>
          )}
        </div>
        {error && <Alert>{error}</Alert>}
        <Button
          variant="ghost"
          tw="self-start text-[#B42318]"
          onClick={async () => {
            try {
              await api.deleteMedia(m.id)
              onRemoved()
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'Não deu para apagar.')
            }
          }}
        >
          Mandar para a lixeira
        </Button>
      </div>
    </Drawer>
  )
}

export function MediaPage() {
  const [trash, setTrash] = useState(false)
  const { items, setItems, reload } = useMedia(trash)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<MediaItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <div>
      <div tw="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Fotos</h1>
          <p tw="m-0 mt-2 font-sans text-[14.5px] text-muted">Todas as fotos enviadas pelo painel. Para trocar uma foto do site, toque nela em "Editar o site".</p>
        </div>
        <div tw="flex gap-2">
          {[false, true].map((t) => (
            <button
              key={String(t)} type="button" onClick={() => { setTrash(t); setOpen(null) }}
              css={[tw`cursor-pointer rounded-full border-0 px-4 py-2 font-sans text-[13px] font-medium`, trash === t ? tw`bg-pine-800 text-white` : tw`bg-white text-pine-900 ring-1 ring-line`]}
            >
              {t ? 'Lixeira (30 dias)' : 'Biblioteca'}
            </button>
          ))}
        </div>
      </div>

      {!trash && (
        <div tw="mt-8">
          <Uploader onUploaded={(m) => { setItems((l) => [m, ...(l ?? [])]); setToast('Foto enviada!') }} />
        </div>
      )}

      <label tw="mt-8 flex max-w-[420px] items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-line">
        <Search width={18} height={18} tw="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pela descrição" tw="w-full border-0 bg-transparent font-sans text-[14px] outline-none" />
      </label>

      <div tw="mt-6">
        {items ? (
          trash ? (
            items.length ? (
              <div tw="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {filterItems(items, q).map((m) => (
                  <div key={m.id} tw="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                    <img src={`/api/media/${m.id}/trash-preview`} alt={m.alt} tw="aspect-[4/3] w-full object-cover opacity-70" />
                    <div tw="flex items-center justify-between gap-2 px-3 py-2">
                      <span tw="truncate font-sans text-[11.5px] text-muted">{m.alt}</span>
                      <button type="button" onClick={() => api.restoreMedia(m.id).then(() => { reload(); setToast('Foto de volta na biblioteca') })} tw="shrink-0 cursor-pointer border-0 bg-transparent font-sans text-[12px] font-semibold text-pine-800 underline">
                        Recuperar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p tw="py-10 text-center font-sans text-[14px] text-muted">A lixeira está vazia. Fotos apagadas ficam aqui por 30 dias.</p>
            )
          ) : (
            <Grid items={filterItems(items, q)} onPick={setOpen} />
          )
        ) : (
          <p tw="font-sans text-[13px] text-muted">Carregando…</p>
        )}
      </div>

      {open && (
        <MediaDetail
          m={open}
          onClose={() => setOpen(null)}
          onChanged={(m) => { setOpen(m); setItems((l) => l?.map((x) => (x.id === m.id ? m : x)) ?? null) }}
          onRemoved={() => { setOpen(null); reload(); setToast('Foto na lixeira') }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
