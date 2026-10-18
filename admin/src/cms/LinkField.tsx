import { useEffect, useMemo, useState } from 'react'
import tw, { type TwStyle } from 'twin.macro'
import { linkPages, linkSections } from '../../../src/cms/linkTargets'
import { api } from '../api'

/* ------------------------------------------------------------------ */
/* Campo de link: página do site (escolhida numa lista) ou site externo */
/* ------------------------------------------------------------------ */

type Option = { value: string; label: string }
type Group = { label: string; options: Option[] }

const isInternal = (v: string) => v.startsWith('/') || v.startsWith('#')
const EMAIL = /^[^\s@/]+@[^\s@/]+\.[a-z]{2,}$/i

/* Itens que vêm do painel (artigos, destinos…). Buscados uma vez por sessão do painel; "Atualizar lista" busca de novo. */
let cache: Promise<Group[]> | null = null

async function loadGroups(): Promise<Group[]> {
  const pending = (status: string) => (status === 'novo' ? ' (ainda não publicado)' : status === 'sair' ? ' (saindo do site)' : '')
  const [list, destinations, recs, products, countries] = await Promise.all([
    api.contentList().catch(() => []),
    ...['blog.destinations', 'recomendacoes.page', 'produtos.page', 'diario.countries'].map((k) =>
      api.getDoc(k).then((d) => d.draft as Record<string, unknown>).catch(() => ({}) as Record<string, unknown>)),
  ])
  const fromCollection = (c: string) =>
    // O painel chama os itens de 'Artigo "Título"'; dentro do grupo "Artigos do blog" basta o título.
    list.filter((d) => d.collection === c).map((d) => ({ value: d.route, label: d.label.replace(/^[^"]*"(.*)"$/, '$1') + pending(d.status) }))
  const items = (doc: Record<string, unknown>, key: string) => ((doc[key] as Record<string, unknown>[] | undefined) ?? []).filter((x) => x?.id)
  const groups: Group[] = [
    { label: 'Páginas novas', options: fromCollection('page') },
    { label: 'Artigos do blog', options: fromCollection('article') },
    { label: 'Destinos do blog', options: items(destinations, 'items').map((x) => ({ value: `/blog/destino/${x.id}`, label: String(x.name ?? x.id) })) },
    { label: 'Páginas de produto', options: fromCollection('productPage') },
    {
      label: 'Produtos › item do catálogo',
      options: [...items(products, 'catalog'), ...items(products, 'free')].map((x) => ({ value: `/produtos#${x.id}`, label: String(x.title ?? x.id) })),
    },
    { label: 'Recomendações › categoria', options: items(recs, 'categories').map((x) => ({ value: `/recomendacoes#${x.id}`, label: String(x.title ?? x.id) })) },
    { label: 'Diário › país', options: items(countries, 'items').map((x) => ({ value: `/diario#${x.id}`, label: String(x.name ?? x.id) })) },
  ]
  return groups.filter((g) => g.options.length)
}

const fixedGroups: Group[] = [
  { label: 'Páginas', options: linkPages.map(([value, label]) => ({ value, label })) },
  { label: 'Seções das páginas', options: linkSections.map(([value, label]) => ({ value, label })) },
]

function useGroups() {
  const [dynamic, setDynamic] = useState<Group[] | null>(null)
  useEffect(() => {
    let alive = true
    ;(cache ??= loadGroups()).then((g) => alive && setDynamic(g))
    return () => { alive = false }
  }, [])
  const reload = async () => {
    cache = loadGroups()
    setDynamic(await cache)
  }
  return { groups: [...fixedGroups, ...(dynamic ?? [])], loading: dynamic === null, reload }
}

const tab = (on: boolean) => [
  tw`cursor-pointer rounded-full border-0 px-3.5 py-1.5 font-sans text-[12.5px] font-semibold transition`,
  on ? tw`bg-pine-800 text-white` : tw`bg-transparent text-pine-900 hover:bg-pine-800/10`,
]

export function LinkField({ id, value, onChange, inputCss }: {
  id: string; value: string; onChange: (v: string) => void; inputCss: TwStyle
}) {
  const [mode, setMode] = useState<'site' | 'fora'>(() => (!value || isInternal(value) ? 'site' : 'fora'))
  const [filter, setFilter] = useState('')
  const { groups, loading, reload } = useGroups()
  const [reloading, setReloading] = useState(false)

  const known = useMemo(() => new Set(groups.flatMap((g) => g.options.map((o) => o.value))), [groups])
  const q = filter.trim().toLocaleLowerCase('pt-BR')
  const shown = q
    ? groups.map((g) => ({ ...g, options: g.options.filter((o) => o.value === value || `${g.label} ${o.label} ${o.value}`.toLocaleLowerCase('pt-BR').includes(q)) }))
      .filter((g) => g.options.length)
    : groups
  const other = isInternal(value) && !known.has(value) && !loading

  const external = value && !isInternal(value) ? value : ''
  const okExternal = !external || /^(https?:\/\/|mailto:)\S+$/i.test(external)

  return (
    <div tw="flex flex-col gap-2">
      <div role="tablist" aria-label="Para onde o link leva" tw="inline-flex self-start rounded-full bg-mist p-1 ring-1 ring-line">
        <button type="button" role="tab" aria-selected={mode === 'site'} css={tab(mode === 'site')} onClick={() => setMode('site')}>Página do site</button>
        <button type="button" role="tab" aria-selected={mode === 'fora'} css={tab(mode === 'fora')} onClick={() => setMode('fora')}>Site externo ou e-mail</button>
      </div>

      {mode === 'site' ? (
        <>
          <input
            css={inputCss} value={filter} onChange={(e) => setFilter(e.target.value)} type="search"
            placeholder="Buscar página, seção, artigo…" aria-label="Buscar na lista de páginas"
          />
          <select id={id} css={inputCss} value={isInternal(value) ? value : ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">{loading ? 'Carregando a lista…' : 'Escolha a página ou seção…'}</option>
            {other && <option value={value}>Outro endereço: {value}</option>}
            {shown.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => <option key={g.label + o.value} value={o.value}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
          <div tw="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-sans text-[12px] text-muted">
            <span>{isInternal(value) ? <>Endereço: <code tw="text-pine-900">{value}</code></> : q && !shown.length ? 'Nada encontrado com essa busca.' : ''}</span>
            <button
              type="button" disabled={reloading}
              onClick={async () => { setReloading(true); try { await reload() } finally { setReloading(false) } }}
              tw="cursor-pointer border-0 bg-transparent p-0 font-sans text-[12px] font-semibold text-pine-800 underline underline-offset-2 disabled:(cursor-wait opacity-60)"
            >
              {reloading ? 'Atualizando…' : 'Atualizar lista'}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            id={id} css={inputCss} value={external} placeholder="https://… ou e-mail"
            onChange={(e) => {
              const v = e.target.value.trim()
              onChange(EMAIL.test(v) && !/^mailto:/i.test(v) ? `mailto:${v}` : v)
            }}
          />
          {!okExternal && <p tw="m-0 font-sans text-[12px] text-sun-600">Use um link que comece com https:// ou um e-mail (ex.: contato@site.com).</p>}
          {isInternal(value) && <p tw="m-0 font-sans text-[12px] text-muted">Hoje o link leva a uma página do site ({value}). Cole aqui o endereço externo para trocar.</p>}
        </>
      )}
    </div>
  )
}
