import { useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import tw from 'twin.macro'
import { ArticleCard } from '../blog/BlogUI'
import { articles, articlesOf, blogCategories, blogCountries, blogPage as page, destinationById, type CategoryId } from '../blog/blogData'
import { Container, Eyebrow, PageHero, Section, Title } from '../components/ui'
import { Arrow } from '../components/icons'

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

      {/* Filtros */}
      <nav aria-label="Filtrar artigos" tw="sticky top-20 z-30 border-y border-line bg-cream/95 backdrop-blur-md">
        <Container tw="flex flex-col gap-2 py-3">
          <Chips
            label="País"
            value={country}
            onChange={(v) => set('pais', v)}
            options={[{ id: ALL, label: 'Todos os países' }, ...blogCountries.map((c) => ({ id: c.id, label: c.name }))]}
          />
          <Chips
            label="Assunto"
            value={category}
            onChange={(v) => set('assunto', v)}
            options={[{ id: ALL, label: 'Todos os assuntos' }, ...blogCategories]}
          />
        </Container>
      </nav>

      <Section tone="cream">
        <Container>
          <div ref={listRef} tw="scroll-mt-48">
            <p tw="mb-6 font-sans text-[13px] text-muted" aria-live="polite">
              {shown.length} {shown.length === 1 ? 'artigo' : 'artigos'}
              {filtering && (
                <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true })} tw="ml-3 font-semibold text-pine-800 underline-offset-2 hover:underline">
                  Limpar filtros
                </button>
              )}
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

function Chips({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div tw="flex items-center gap-3">
      <span tw="hidden w-16 shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-muted sm:block">{label}</span>
      <div role="group" aria-label={label} tw="flex gap-2 overflow-x-auto [scrollbar-width: none] lg:(flex-wrap overflow-visible)">
        {options.map((o) => {
          const on = o.id === value
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              css={[
                tw`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 font-sans text-[12.5px] font-medium ring-1 transition`,
                on ? tw`bg-pine-800 text-white ring-pine-800` : tw`bg-white text-pine-900 ring-line hover:(ring-pine-800)`,
              ]}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
