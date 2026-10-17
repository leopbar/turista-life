import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import tw from 'twin.macro'
import type { Field } from '../../../src/cms/fields'
import { Camera, Close, Plus } from '../components/icons'
import { GROUPS, emptyValue, itemTitle, useSchema } from './model'

/* ------------------------------------------------------------------ */
/* Contexto do formulário: erros, campo em foco, fotos e referências  */
/* ------------------------------------------------------------------ */

export type FormEnv = {
  problems: Record<string, string>
  focusPath?: string
  pickImage: (current: string) => Promise<string | null>
  refOptions: (source: string, list: string, valueField: string, labelField: string) => { value: string; label: string }[] | null
  reloadRef?: (source: string) => Promise<void>
}

const Env = createContext<FormEnv>({ problems: {}, pickImage: async () => null, refOptions: () => [] })
export const FormEnvProvider = Env.Provider

/** Foto do conteúdo vista dentro do painel (servida pela cópia do site em /site/). */
export const assetUrl = (v: string) => (v ? `/site/${v.replace(/^\/+/, '').split('#')[0]}` : '')

/* ------------------------------------------------------------------ */
/* Peças visuais                                                       */
/* ------------------------------------------------------------------ */

const input = tw`w-full rounded-xl border-[1.5px] border-solid border-line bg-white px-3.5 py-2.5 font-sans text-[14px] text-ink outline-none transition placeholder:text-muted/60 focus:(border-pine-700 ring-4 ring-pine-700/10)`

function Label({ htmlFor, children, help, optional }: { htmlFor?: string; children: ReactNode; help?: string; optional?: boolean }) {
  return (
    <div tw="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} tw="font-sans text-[12.5px] font-semibold text-pine-900">
        {children} {optional && <span tw="font-normal text-muted">(opcional)</span>}
      </label>
      {help && <span tw="text-right font-sans text-[11px] text-muted">{help}</span>}
    </div>
  )
}

function useFocus(path: string) {
  const { focusPath } = useContext(Env)
  const ref = useRef<HTMLDivElement>(null)
  const focused = focusPath === path
  useEffect(() => {
    if (!focused || !ref.current) return
    ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    ref.current.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true })
  }, [focused])
  return { ref, focused }
}

function Shell({ path, children }: { path: string; children: ReactNode }) {
  const { problems } = useContext(Env)
  const { ref, focused } = useFocus(path)
  const problem = problems[path]
  return (
    <div
      ref={ref}
      data-path={path}
      css={[tw`rounded-2xl transition-shadow duration-500`, focused && tw`ring-4 ring-sun-500/40 ring-offset-4 ring-offset-cream`]}
    >
      {children}
      {problem && <p tw="mt-1.5 font-sans text-[12px] font-medium text-[#B42318]">{problem}</p>}
    </div>
  )
}

function AutoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [props.value])
  return <textarea ref={ref} rows={1} css={[input, tw`resize-none leading-relaxed`]} {...props} />
}

/* ------------------------------------------------------------------ */
/* Um campo qualquer                                                   */
/* ------------------------------------------------------------------ */

export function FieldEditor({ field: f, value, onChange, path, nested = false }: {
  field: Field; value: unknown; onChange: (v: unknown) => void; path: string; nested?: boolean
}) {
  const id = useId()
  const env = useContext(Env)

  if (f.kind === 'object') return <ObjectEditor field={f} value={value} onChange={onChange} path={path} nested={nested} />
  if (f.kind === 'list') return <ListEditor field={f} value={value} onChange={onChange} path={path} />
  if (f.kind === 'blocks') return <BlocksEditor field={f} value={value} onChange={onChange} path={path} />

  const str = typeof value === 'string' ? value : ''
  const setText = (v: string) => onChange(f.optional && v === '' ? undefined : v)

  let control: ReactNode
  switch (f.kind) {
    case 'text':
      control = f.long || str.length > 90
        ? <AutoTextarea id={id} value={str} maxLength={f.max} onChange={(e) => setText(e.target.value)} />
        : <input id={id} css={input} value={str} maxLength={f.max} onChange={(e) => setText(e.target.value)} />
      break
    case 'url': {
      const ok = !str || /^(https?:\/\/|mailto:)\S+$/i.test(str) || (str.startsWith('/') && !str.startsWith('//')) || str.startsWith('#')
      control = (
        <>
          <input id={id} css={input} value={str} placeholder="https://… ou /pagina-do-site" onChange={(e) => setText(e.target.value.trim())} />
          {!ok && <p tw="mt-1 font-sans text-[12px] text-sun-600">Use um link que comece com https://, mailto: ou uma página do site (ex.: /produtos).</p>}
        </>
      )
      break
    }
    case 'image':
      control = (
        <div tw="flex items-center gap-4">
          <button
            type="button"
            onClick={async () => {
              const picked = await env.pickImage(str)
              if (picked !== null) onChange(picked)
            }}
            tw="relative h-[84px] w-[128px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-0 bg-mist p-0 ring-1 ring-line transition hover:ring-2 hover:ring-sun-500"
            aria-label={`Trocar ${f.label}`}
          >
            {str ? <img src={assetUrl(str)} alt="" tw="h-full w-full object-cover" /> : <Camera tw="text-muted" />}
          </button>
          <div tw="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={async () => {
                const picked = await env.pickImage(str)
                if (picked !== null) onChange(picked)
              }}
              tw="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border-0 bg-sun-500 px-4 py-2 font-sans text-[12.5px] font-semibold text-white hover:bg-sun-600"
            >
              <Camera width={16} height={16} /> {str ? 'Trocar foto' : 'Escolher foto'}
            </button>
            {f.optional && str && (
              <button type="button" onClick={() => onChange(undefined)} tw="cursor-pointer self-start border-0 bg-transparent p-0 font-sans text-[12px] text-muted underline">
                Tirar a foto
              </button>
            )}
          </div>
        </div>
      )
      break
    case 'number':
      control = (
        <input
          id={id} type="number" css={[input, tw`max-w-[200px]`]} value={typeof value === 'number' ? value : ''} min={f.min} max={f.max}
          onChange={(e) => onChange(e.target.value === '' ? (f.optional ? undefined : 0) : Number(e.target.value))}
        />
      )
      break
    case 'bool':
      control = (
        <button
          id={id} type="button" role="switch" aria-checked={!!value} onClick={() => onChange(!value)}
          tw="inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 font-sans text-[13.5px] text-ink"
        >
          <span css={[tw`relative h-6 w-11 rounded-full transition`, value ? tw`bg-pine-700` : tw`bg-line`]}>
            <span css={[tw`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all`, value ? tw`left-[22px]` : tw`left-0.5`]} />
          </span>
          {value ? 'Sim' : 'Não'}
        </button>
      )
      return (
        <Shell path={path}>
          <div tw="flex items-center justify-between gap-4 rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-line">
            <span tw="font-sans text-[13px] font-semibold text-pine-900">{f.label}</span>
            {control}
          </div>
        </Shell>
      )
    case 'select':
      control = f.options.length <= 4 ? (
        <div role="radiogroup" tw="flex flex-wrap gap-2">
          {f.options.map((o) => (
            <button
              key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
              css={[tw`cursor-pointer rounded-full border-0 px-3.5 py-2 font-sans text-[12.5px] font-medium ring-1 transition`, value === o.value ? tw`bg-pine-800 text-white ring-pine-800` : tw`bg-white text-pine-900 ring-line hover:ring-pine-700`]}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <select id={id} css={input} value={str} onChange={(e) => onChange(e.target.value || undefined)}>
          {f.optional && <option value="">—</option>}
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )
      break
    case 'ref': {
      const options = env.refOptions(f.source, f.list, f.valueField, f.labelField)
      control = (
        <>
          <select id={id} css={input} value={str} onChange={(e) => onChange(e.target.value || undefined)}>
            {(f.optional || !str) && <option value="">{f.optional ? '—' : 'Escolha…'}</option>}
            {options === null && str && <option value={str}>{str}</option>}
            {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <RefHint source={f.source} />
        </>
      )
      break
    }
    case 'video': {
      control = (
        <div tw="flex items-center gap-3">
          {str && <img src={`https://i.ytimg.com/vi/${str}/default.jpg`} alt="" tw="h-[45px] w-[60px] shrink-0 rounded-lg object-cover" />}
          <input
            id={id} css={input} value={str} placeholder="Cole o link do vídeo"
            onChange={(e) => {
              const raw = e.target.value.trim()
              const m = raw.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{6,20})/)
              setText(m ? m[1] : raw)
            }}
          />
        </div>
      )
      break
    }
    case 'slug':
      control = (
        <input
          id={id} css={input} value={str}
          onChange={(e) => setText(e.target.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+/, ''))}
        />
      )
      break
    case 'date':
      control = <input id={id} type="date" css={[input, tw`max-w-[200px]`]} value={str} onChange={(e) => setText(e.target.value)} />
      break
    case 'coords': {
      const [lat, lon] = Array.isArray(value) ? (value as number[]) : [0, 0]
      control = (
        <div tw="flex gap-3">
          <input aria-label="Latitude" type="number" step="0.01" css={input} value={lat} onChange={(e) => onChange([Number(e.target.value), lon])} />
          <input aria-label="Longitude" type="number" step="0.01" css={input} value={lon} onChange={(e) => onChange([lat, Number(e.target.value)])} />
        </div>
      )
      break
    }
  }

  return (
    <Shell path={path}>
      <Label htmlFor={id} help={f.help} optional={f.optional}>{f.label}</Label>
      {control}
    </Shell>
  )
}

/**
 * Embaixo de uma escolha que vem de outra lista: onde cadastrar um item novo (abre em outra aba,
 * para não perder o que já foi digitado aqui) e o botão para trazer a lista de novo.
 */
function RefHint({ source }: { source: string }) {
  const schema = useSchema()
  const { reloadRef } = useContext(Env)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const def = schema?.docs.find((d) => d.key === source)
  if (!def) return null
  const where = `${GROUPS.find((g) => g.id === def.group)?.label ?? ''} → ${def.label}`
  const href = `/editar?rota=${encodeURIComponent(def.route)}&doc=${encodeURIComponent(source)}`

  const reload = async () => {
    if (!reloadRef) return
    setState('busy')
    try {
      await reloadRef(source)
      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
    }
  }

  return (
    <div tw="mt-1.5 flex flex-wrap items-start justify-between gap-x-3 gap-y-1 font-sans text-[12px] leading-snug text-muted">
      <p tw="m-0 min-w-0 flex-1 basis-[240px]">
        Não achou na lista? Cadastre em{' '}
        <a href={href} target="_blank" rel="noopener" tw="font-semibold text-pine-800 underline underline-offset-2">{where} ↗</a>{' '}
        (abre em outra aba). Publique lá antes de publicar aqui.
      </p>
      {reloadRef && (
        <button
          type="button"
          onClick={reload}
          disabled={state === 'busy'}
          tw="shrink-0 cursor-pointer rounded-full border-0 bg-white px-3 py-1 font-sans text-[12px] font-medium text-pine-900 ring-1 ring-line hover:bg-cream disabled:cursor-wait"
        >
          {state === 'busy' ? 'Atualizando…' : state === 'done' ? 'Lista atualizada ✓' : state === 'error' ? 'Não deu, tente de novo' : 'Atualizar lista'}
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grupo de campos                                                     */
/* ------------------------------------------------------------------ */

function ObjectEditor({ field: f, value, onChange, path, nested }: {
  field: Extract<Field, { kind: 'object' }>; value: unknown; onChange: (v: unknown) => void; path: string; nested: boolean
}) {
  const obj = (value ?? {}) as Record<string, unknown>
  const at = (k: string) => (path ? `${path}.${k}` : k)
  const absent = f.optional && (value === undefined || value === null)

  if (absent) {
    return (
      <button
        type="button" onClick={() => onChange(emptyValue({ ...f, optional: false }))}
        tw="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border-[1.5px] border-dashed border-pine-800/30 bg-transparent px-4 py-2 font-sans text-[12.5px] font-semibold text-pine-800 hover:border-pine-800"
      >
        <Plus width={16} height={16} /> Adicionar {f.label.toLowerCase()}
      </button>
    )
  }

  const body = (
    <div tw="flex flex-col gap-4">
      {Object.entries(f.fields).map(([k, sub]) => (
        <FieldEditor
          key={k} field={sub} value={obj[k]} path={at(k)} nested
          onChange={(v) => {
            const next = { ...obj }
            if (v === undefined) delete next[k]
            else next[k] = v
            // Foto nova: o enquadramento antigo não serve mais; vale o ponto de foco da biblioteca.
            if (sub.kind === 'image' && v !== obj[k] && f.fields.position?.optional) delete next.position
            onChange(next)
          }}
        />
      ))}
    </div>
  )
  if (!nested || !f.label) return body
  return (
    <fieldset tw="m-0 min-w-0 rounded-2xl border-0 bg-cream/70 p-4 ring-1 ring-line">
      <legend tw="float-left mb-3 flex w-full items-center justify-between font-sans text-[12px] font-semibold uppercase tracking-[.1em] text-sun-600">
        {f.label}
        {f.optional && (
          <button type="button" onClick={() => onChange(undefined)} tw="cursor-pointer border-0 bg-transparent font-sans text-[11px] normal-case tracking-normal text-muted underline">
            tirar
          </button>
        )}
      </legend>
      <div tw="clear-both">{body}</div>
    </fieldset>
  )
}

/* ------------------------------------------------------------------ */
/* Listas (com arrastar e soltar)                                      */
/* ------------------------------------------------------------------ */

function move<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function ItemCard({ title, index, total, onMove, onRemove, onDropAt, children, defaultOpen }: {
  title: string; index: number; total: number; onMove: (to: number) => void; onRemove: () => void; onDropAt: (from: number) => void
  children: ReactNode; defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [confirm, setConfirm] = useState(false)
  const [over, setOver] = useState(false)
  useEffect(() => {
    if (!confirm) return
    const t = setTimeout(() => setConfirm(false), 3000)
    return () => clearTimeout(t)
  }, [confirm])
  const btn = tw`grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent font-sans text-[14px] text-muted hover:(bg-mist text-pine-900) disabled:(cursor-default opacity-30 hover:bg-transparent)`
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onDropAt(Number(e.dataTransfer.getData('text/plain'))) }}
      css={[tw`rounded-2xl bg-white ring-1 ring-line transition`, over && tw`ring-2 ring-sun-500`]}
    >
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
        tw="flex cursor-grab items-center gap-1 py-1.5 pl-2 pr-1.5 active:cursor-grabbing"
      >
        <span aria-hidden="true" tw="px-1 font-sans text-[14px] text-muted/60">⠿</span>
        <button type="button" onClick={() => setOpen((o) => !o)} tw="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent py-1.5 text-left">
          <span css={[tw`text-[10px] text-muted transition-transform`, open && tw`rotate-90`]}>▶</span>
          <span tw="truncate font-sans text-[13.5px] font-medium text-ink">{title}</span>
        </button>
        <button type="button" css={btn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Subir">↑</button>
        <button type="button" css={btn} disabled={index === total - 1} onClick={() => onMove(index + 1)} aria-label="Descer">↓</button>
        <button
          type="button" onClick={() => (confirm ? onRemove() : setConfirm(true))} aria-label="Remover"
          css={[btn, confirm && tw`w-auto bg-[#FEF3F2] px-2 text-[11.5px] font-semibold text-[#B42318] hover:(bg-[#FEE4E2] text-[#B42318])`]}
        >
          {confirm ? 'Remover?' : <Close width={16} height={16} />}
        </button>
      </div>
      {open && <div tw="border-0 border-t border-solid border-line p-4">{children}</div>}
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      tw="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border-[1.5px] border-dashed border-pine-800/30 bg-transparent px-4 py-2 font-sans text-[12.5px] font-semibold text-pine-800 transition hover:(border-pine-800 bg-white)"
    >
      <Plus width={16} height={16} /> {label}
    </button>
  )
}

function ListEditor({ field: f, value, onChange, path }: { field: Extract<Field, { kind: 'list' }>; value: unknown; onChange: (v: unknown) => void; path: string }) {
  const list = Array.isArray(value) ? value : []
  const [fresh, setFresh] = useState<number | null>(null)
  const { focusPath } = useContext(Env)
  const simple = f.of.kind !== 'object' && f.of.kind !== 'list' && f.of.kind !== 'blocks'
  const at = (i: number) => (path ? `${path}.${i}` : String(i))

  return (
    <Shell path={path}>
      <Label help={f.help} optional={f.optional}>{f.label}</Label>
      <div tw="flex flex-col gap-2">
        {list.map((item, i) =>
          simple ? (
            <div key={i} tw="flex items-start gap-1.5">
              <div tw="flex-1">
                <FieldEditor field={{ ...f.of, label: '' }} value={item} path={at(i)} onChange={(v) => onChange(list.map((x, j) => (j === i ? v ?? '' : x)))} />
              </div>
              <button type="button" disabled={i === 0} onClick={() => onChange(move(list, i, i - 1))} aria-label="Subir" tw="mt-1.5 grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-mist disabled:opacity-30">↑</button>
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remover" tw="mt-1.5 grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:(bg-[#FEF3F2] text-[#B42318])"><Close width={15} height={15} /></button>
            </div>
          ) : (
            <ItemCard
              key={i} index={i} total={list.length} title={itemTitle(f, item, i)}
              defaultOpen={fresh === i || !!focusPath?.startsWith(`${at(i)}.`) || focusPath === at(i)}
              onMove={(to) => onChange(move(list, i, to))}
              onDropAt={(from) => from !== i && onChange(move(list, from, i))}
              onRemove={() => onChange(list.filter((_, j) => j !== i))}
            >
              <FieldEditor field={f.of} value={item} path={at(i)} nested onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} />
            </ItemCard>
          ),
        )}
        <AddButton
          label={`Adicionar ${(f.itemLabel ?? 'item').toLowerCase()}`}
          onClick={() => {
            setFresh(list.length)
            onChange([...list, emptyValue(f.of)])
          }}
        />
      </div>
    </Shell>
  )
}

function BlocksEditor({ field: f, value, onChange, path }: { field: Extract<Field, { kind: 'blocks' }>; value: unknown; onChange: (v: unknown) => void; path: string }) {
  const list = (Array.isArray(value) ? value : []) as { type: string }[]
  const [picking, setPicking] = useState(false)
  const [fresh, setFresh] = useState<number | null>(null)
  const { focusPath } = useContext(Env)
  const at = (i: number) => (path ? `${path}.${i}` : String(i))

  return (
    <Shell path={path}>
      <Label help={f.help}>{f.label}</Label>
      <div tw="flex flex-col gap-2">
        {list.map((item, i) => {
          const variant = f.variants[item.type]
          return (
            <ItemCard
              key={i} index={i} total={list.length} title={itemTitle(f, item, i)}
              defaultOpen={fresh === i || !!focusPath?.startsWith(`${at(i)}.`)}
              onMove={(to) => onChange(move(list, i, to))}
              onDropAt={(from) => from !== i && onChange(move(list, from, i))}
              onRemove={() => onChange(list.filter((_, j) => j !== i))}
            >
              {variant ? (
                <FieldEditor
                  field={{ kind: 'object', label: '', fields: variant.fields }}
                  value={item} path={at(i)}
                  onChange={(v) => onChange(list.map((x, j) => (j === i ? { ...(v as object), type: item.type } : x)))}
                />
              ) : (
                <p tw="font-sans text-[13px] text-muted">Bloco desconhecido.</p>
              )}
            </ItemCard>
          )
        })}
        {picking ? (
          <div tw="flex flex-wrap gap-2 rounded-2xl bg-white p-3 ring-1 ring-line">
            {Object.entries(f.variants).map(([type, v]) => (
              <button
                key={type} type="button"
                onClick={() => {
                  setPicking(false)
                  setFresh(list.length)
                  onChange([...list, { ...(emptyValue({ kind: 'object', label: '', fields: v.fields }) as object), type }])
                }}
                tw="cursor-pointer rounded-full border-0 bg-mist px-3.5 py-2 font-sans text-[12.5px] font-medium text-pine-900 hover:(bg-sun-500 text-white)"
              >
                {v.label}
              </button>
            ))}
            <button type="button" onClick={() => setPicking(false)} tw="cursor-pointer border-0 bg-transparent font-sans text-[12px] text-muted underline">cancelar</button>
          </div>
        ) : (
          <AddButton label={`Adicionar ${(f.itemLabel ?? 'bloco').toLowerCase()}`} onClick={() => setPicking(true)} />
        )}
      </div>
    </Shell>
  )
}
