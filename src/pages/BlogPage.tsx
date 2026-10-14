import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import tw from 'twin.macro'
import { ArticleCard } from '../blog/BlogUI'
import { articles, articlesOf, blogCategories, blogCountries, blogPage as page, destinationById, type CategoryId } from '../blog/blogData'
import { Container, Eyebrow, PageHero, Section, Title } from '../components/ui'
import { Arrow, Check, Close } from '../components/icons'

const ALL = 'todos'

export function BlogPage() {
  const [params, setParams] = useSearchParams()
  const country = params.get('pais') ?? ALL
  const category = (params.get('assunto') ?? ALL) as CategoryId | typeof ALL
  const listRef = useRef<HTMLDivElement>(null)

  const set = (key: 'pais' | 'assunto', value: string) => {
    const next = new URLSearchParams(params)
    if (value === ALL) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true, preventScrollReset: true })
    const top = listRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const shown = useMemo(
    () =>
      articles.filter(
        (a) => (country === ALL || destinationById(a.destination)!.country === country) && (category === ALL || a.category === category),
      ),
    [country, category],
  )
  const filtering = country !== ALL || category !== ALL
  const clear = () => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true })
  /** Quantos artigos existem para uma combinação de país e assunto (para mostrar no filtro). */
  const countFor = (c: string, cat: string) =>
    articles.filter((a) => (c === ALL || destinationById(a.destination)!.country === c) && (cat === ALL || a.category === cat)).length
  const [featured, ...rest] = shown

  return (
    <>
      <PageHero {...page.hero} />

      {/* Destinos, organizados por país */}
      <Section tone="white">
        <Container tw="flex flex-col gap-8">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>Por destino</Eyebrow>
            <Title>Escolha para onde você vai</Title>
          </div>
          <div tw="grid gap-8 lg:grid-cols-3">
            {blogCountries.map((c) => (
              <div key={c.id} tw="flex flex-col gap-3">
                <h3 tw="flex items-center gap-3 font-sans text-[12px] font-semibold uppercase tracking-[.16em] text-pine-800">
                  {c.name} <span aria-hidden="true" tw="h-px flex-1 bg-line" />
                </h3>
                <ul tw="flex flex-col gap-3">
                  {c.destinations.map((d) => (
                    <li key={d.id}>
                      <Link
                        to={`/blog/destino/${d.id}`}
                        className="group"
                        tw="relative flex h-[120px] items-end overflow-hidden rounded-[18px] no-underline shadow-card"
                      >
                        <img src={d.image} alt="" loading="lazy" tw="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: d.position ?? '50% 50%' }} />
                        <span aria-hidden="true" tw="absolute inset-0 bg-gradient-to-r from-pine-950/85 via-pine-950/45 to-transparent" />
                        <span tw="relative flex w-full items-end justify-between gap-3 p-4 text-white">
                          <span>
                            <span tw="block font-serif text-[1.5rem] font-bold leading-none">{d.name}</span>
                            <span tw="mt-1.5 block font-sans text-[12px] text-white/80">
                              {articlesOf(d.id).length} {articlesOf(d.id).length === 1 ? 'artigo' : 'artigos'} · {d.tagline}
                            </span>
                          </span>
                          <span tw="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition group-hover:bg-sun-500">
                            <Arrow />
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Filtros: dois botões; no celular cada um abre um painel por baixo, no computador uma lista */}
      <nav aria-label="Filtrar artigos" tw="sticky top-20 z-30 border-y border-line bg-cream/95 backdrop-blur-md">
        <Container tw="flex flex-wrap items-center gap-2 py-3">
          <FilterMenu
            label="País"
            allLabel="Todos os países"
            value={country}
            onChange={(v) => set('pais', v)}
            options={blogCountries.map((c) => ({ id: c.id, label: c.name, count: countFor(c.id, category) }))}
            total={countFor(ALL, category)}
          />
          <FilterMenu
            label="Assunto"
            allLabel="Todos os assuntos"
            value={category}
            onChange={(v) => set('assunto', v)}
            options={blogCategories.map((c) => ({ id: c.id, label: c.label, count: countFor(country, c.id) }))}
            total={countFor(country, ALL)}
          />
          {filtering && (
            <button type="button" onClick={clear} tw="ml-1 font-sans text-[13px] font-semibold text-pine-800 underline-offset-2 hover:underline">
              Limpar
            </button>
          )}
        </Container>
      </nav>

      <Section tone="cream">
        <Container>
          <div ref={listRef} tw="scroll-mt-48">
            <p tw="mb-6 font-sans text-[13px] text-muted" aria-live="polite">
              {shown.length} {shown.length === 1 ? 'artigo' : 'artigos'}
            </p>
            {shown.length === 0 ? (
              <div tw="rounded-[20px] border-[1.5px] border-dashed border-pine-800/25 bg-white/60 p-8 text-center">
                <p tw="font-script text-[26px] leading-none text-sun-600">Em breve</p>
                <p tw="mt-2 font-sans text-[14px] text-muted">Ainda não tem artigo sobre esse assunto neste país. A cada destino novo, entram mais.</p>
              </div>
            ) : (
              <div tw="flex flex-col gap-6">
                {featured && <ArticleCard article={featured} featured />}
                <div tw="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((a) => (
                    <ArticleCard key={a.slug} article={a} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  )
}

type Option = { id: string; label: string; count: number }

/** Botão "País ▾" / "Assunto ▾": mostra o valor escolhido e abre a lista de opções com a contagem de artigos. */
function FilterMenu({ label, allLabel, value, options, total, onChange }: {
  label: string; allLabel: string; value: string; options: Option[]; total: number; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const active = options.find((o) => o.id === value)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    // Computador: clicar fora da lista fecha.
    const onDown = (e: MouseEvent) => {
      if (!(e.target instanceof Node) || boxRef.current?.contains(e.target) || sheetRef.current?.contains(e.target)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    // No celular o painel cobre a tela: trava a rolagem da página por baixo.
    const mobile = window.matchMedia('(max-width: 639px)').matches
    if (mobile) document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
      document.body.style.overflow = ''
    }
  }, [open])

  const choose = (v: string) => {
    onChange(v)
    setOpen(false)
  }
  const all: Option = { id: ALL, label: allLabel, count: total }
  const list = (
    <ul tw="flex flex-col">
      {[all, ...options].map((o) => {
        const on = o.id === value
        const empty = o.count === 0 && !on
        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={empty}
              aria-pressed={on}
              onClick={() => choose(o.id)}
              css={[
                tw`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left font-sans text-[15px] transition sm:(py-2.5 text-[14px])`,
                on ? tw`bg-mist font-semibold text-pine-900` : tw`text-ink hover:bg-cream`,
                empty && tw`cursor-not-allowed opacity-40 hover:bg-transparent`,
              ]}
            >
              <span>
                {o.label} <span tw="font-normal text-muted">({o.count})</span>
              </span>
              {on && <Check tw="shrink-0 text-sun-600" />}
            </button>
          </li>
        )
      })}
    </ul>
  )


  return (
    <div ref={boxRef} tw="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        css={[
          tw`inline-flex items-center gap-2 rounded-full py-2 pl-4 pr-3 font-sans text-[13px] font-medium ring-1 transition`,
          active ? tw`bg-pine-800 text-white ring-pine-800` : tw`bg-white text-pine-900 ring-line hover:ring-pine-800`,
        ]}
      >
        <span css={active ? tw`text-white/70` : tw`text-muted`}>{label}:</span>
        <span tw="font-semibold">{active ? active.label : 'Todos'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" css={[tw`transition-transform`, open && tw`rotate-180`]}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* Computador: lista logo abaixo do botão */}
          <div id={id} role="dialog" aria-label={`Filtrar por ${label.toLowerCase()}`} tw="absolute left-0 top-full z-50 mt-2 hidden w-72 rounded-[18px] bg-white p-2 shadow-lift ring-1 ring-line sm:block">
            {list}
          </div>
          {/* Celular: painel por baixo, fora da barra fixa (o desfoque dela prenderia o painel) */}
          {createPortal(
            <div tw="fixed inset-0 z-[60] sm:hidden">
              <div aria-hidden="true" onClick={() => setOpen(false)} tw="absolute inset-0 bg-pine-950/45" />
              <div ref={sheetRef} role="dialog" aria-modal="true" aria-label={`Filtrar por ${label.toLowerCase()}`} tw="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[24px] bg-white px-4 pb-8 pt-3 shadow-lift">
                <span aria-hidden="true" tw="mx-auto mb-3 block h-1 w-10 rounded-full bg-line" />
                <div tw="mb-2 flex items-center justify-between px-2">
                  <p tw="font-serif text-[1.3rem] font-bold text-ink">{label}</p>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" tw="grid h-10 w-10 place-items-center rounded-full text-pine-900 hover:bg-mist">
                    <Close />
                  </button>
                </div>
                {list}
              </div>
            </div>,
            document.body,
          )}
        </>
      )}
    </div>
  )
}
