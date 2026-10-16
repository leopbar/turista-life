import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import tw from 'twin.macro'
import { recsPage as page, type RecCategory } from '../pagesContent'
import { RecCard, SoonCard } from '../components/Recommendations'
import { Container, CtaBand, PageHero, Section, PlaneTrail } from '../components/ui'
import { Check } from '../components/icons'

const ALL = 'todas'
const visible = (g: RecCategory) => g.items.filter((i) => !i.hidden)
const fromHash = (hash: string) => (page.categories.some((c) => c.id === hash.slice(1)) ? hash.slice(1) : ALL)

export function RecommendationsPage() {
  const { hash } = useLocation()
  const [active, setActive] = useState(() => fromHash(hash))
  const listRef = useRef<HTMLDivElement>(null)

  /* links com #categoria (ex.: vindos da busca) já abrem filtrados */
  useEffect(() => setActive(fromHash(hash)), [hash])

  const choose = (id: string) => {
    setActive(id)
    window.history.replaceState(window.history.state, '', id === ALL ? window.location.pathname : `#${id}`)
    const top = listRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const shown = active === ALL ? page.categories : page.categories.filter((c) => c.id === active)
  const chips = [{ id: ALL, label: 'Todas' }, ...page.categories]

  return (
    <>
      <PageHero {...page.hero} />

      {/* Filtro por categoria */}
      <nav aria-label="Filtrar por categoria" tw="sticky top-20 z-30 border-b border-line bg-cream/95 backdrop-blur-md">
        <Container tw="flex gap-2 overflow-x-auto py-3 [scrollbar-width: none]">
          {chips.map((c) => {
            const on = c.id === active
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => choose(c.id)}
                css={[
                  tw`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-sans text-[13px] font-medium ring-1 transition`,
                  on ? tw`bg-pine-800 text-white ring-pine-800` : tw`bg-white text-pine-900 ring-line hover:(ring-pine-800)`,
                ]}
              >
                {c.label}
              </button>
            )
          })}
        </Container>
      </nav>

      <Section tone="cream">
        <Container tw="grid gap-12 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-start">
          <div ref={listRef} tw="flex scroll-mt-40 flex-col gap-14">
            {shown.map((g) => (
              <section key={g.id} id={g.id} tw="scroll-mt-40" aria-labelledby={`${g.id}-t`}>
                <h2 id={`${g.id}-t`} tw="flex items-center gap-3 font-serif text-[1.7rem] font-bold text-ink">
                  {g.title}
                  <span aria-hidden="true" tw="h-px flex-1 bg-line" />
                </h2>
                <div tw="mt-6 grid gap-5 md:grid-cols-2">
                  {visible(g).length ? visible(g).map((item, i) => <RecCard key={item.title} item={item} index={i} wide={visible(g).length === 1} />) : <SoonCard category={g} />}
                </div>
              </section>
            ))}
            <p tw="rounded-xl bg-mist p-4 font-sans text-[12.5px] leading-relaxed text-muted">{page.disclosure}</p>
          </div>

          <aside tw="flex flex-col gap-5 lg:sticky lg:top-40">
            <div tw="relative overflow-hidden rounded-[20px] bg-pine-800 p-7 text-white shadow-lift">
              <PlaneTrail tw="absolute -right-3 -top-1 w-28 text-white/10" />
              <p tw="font-script text-[26px] leading-none text-sun-500">Dica da Laura</p>
              <h2 tw="mt-2 font-serif text-[22px] font-bold leading-snug">{page.tips.title}</h2>
              <ul tw="mt-5 flex flex-col gap-3">
                {page.tips.items.map((t) => (
                  <li key={t} tw="flex gap-2.5 font-sans text-[13px] leading-relaxed text-white/90">
                    <Check tw="mt-1 shrink-0 text-sun-500" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <figure tw="relative mx-auto w-[220px] rotate-[3deg] bg-white p-3 pb-12 shadow-card">
              <img src={import.meta.env.BASE_URL + 'images/v-bangkok.jpg'} alt="Laura em Bangkok, na Tailândia" tw="aspect-square w-full object-cover" />
              <figcaption tw="absolute bottom-3 left-4 font-script text-[20px] text-pine-900">Bangkok, Tailândia</figcaption>
            </figure>
          </aside>
        </Container>
      </Section>

      <CtaBand {...page.cta} />
    </>
  )
}
