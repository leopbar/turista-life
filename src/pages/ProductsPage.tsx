import { useState, type FormEvent } from 'react'
import tw from 'twin.macro'
import { productsPage as page, type CatalogItem } from '../pagesContent'
import { BookCover } from '../components/Products'
import { Button, Container, CtaBand, Eyebrow, Lead, PageHero, Section, SmartLink, Title } from '../components/ui'
import { Arrow, Check } from '../components/icons'

type Filter = (typeof page.filters)[number]['id']

const statusLabel: Record<CatalogItem['status'], string> = {
  available: 'Disponível',
  soon: 'Em breve',
  planned: 'Em produção',
  free: 'Grátis',
}

export function ProductsPage() {
  const [filter, setFilter] = useState<Filter>('todos')
  const groups = page.categories
    .filter((c) => filter === 'todos' || c.id === filter)
    .map((c) => ({ ...c, items: page.catalog.filter((p) => p.category === c.id) }))
  const f = page.featured

  return (
    <>
      <PageHero {...page.hero} />

      {/* Destaque: e-book */}
      <Section tone="cream">
        <Container tw="grid items-center gap-12 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div tw="relative rounded-[24px] bg-mist py-12" className="group">
            <BookCover cover={f.cover} large />
            <span tw="absolute top-5 left-5 rounded-full bg-sun-500 px-3 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-white">
              Mais vendido
            </span>
          </div>

          <div tw="flex flex-col gap-5">
            <Eyebrow>{f.kind}</Eyebrow>
            <Title>{f.title}</Title>
            <p tw="font-script text-[24px] leading-snug text-sun-600">{f.promise}</p>
            <Lead>{f.text}</Lead>

            <div tw="grid gap-6 pt-2 md:grid-cols-2">
              <div>
                <h3 tw="font-sans text-[13px] font-semibold uppercase tracking-[.14em] text-pine-800">É para você se</h3>
                <ul tw="mt-3 flex flex-col gap-2.5">
                  {f.forWho.map((t) => (
                    <li key={t} tw="flex gap-2 font-sans text-[13.5px] leading-relaxed text-muted">
                      <Check tw="mt-1 shrink-0 text-sun-500" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 tw="font-sans text-[13px] font-semibold uppercase tracking-[.14em] text-pine-800">O que você vai encontrar</h3>
                <ol tw="mt-3 flex flex-col gap-2.5">
                  {f.chapters.map((c, i) => (
                    <li key={c} tw="flex gap-3 font-sans text-[13.5px] leading-relaxed text-ink">
                      <span tw="font-serif text-[15px] font-bold text-sun-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span> {c}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div tw="mt-2 flex flex-wrap items-center gap-4">
              <Button variant="sun" href={f.cta.href}>
                {f.cta.label} <Arrow />
              </Button>
              <span tw="inline-flex items-center gap-2 font-sans text-[13px] font-medium text-pine-700">
                <Check /> {f.guarantee}
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Catálogo com filtro */}
      <Section tone="mist">
        <Container tw="flex flex-col gap-8">
          <div tw="flex flex-wrap items-end justify-between gap-6">
            <div tw="flex flex-col gap-3">
              <Eyebrow>Catálogo</Eyebrow>
              <Title>Todos os materiais</Title>
            </div>
            <div role="tablist" aria-label="Filtrar produtos" tw="flex flex-wrap gap-2">
              {page.filters.map((opt) => (
                <button
                  key={opt.id}
                  role="tab"
                  aria-selected={filter === opt.id}
                  onClick={() => setFilter(opt.id)}
                  css={[
                    tw`rounded-full px-4 py-2 font-sans text-[13px] font-medium transition`,
                    filter === opt.id ? tw`bg-pine-800 text-white` : tw`bg-white text-pine-900 hover:bg-white/70`,
                  ]}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {groups.map((g, i) => (
            <div key={g.id} css={[tw`flex flex-col gap-5`, i > 0 && tw`mt-4 border-t border-line pt-10`]}>
              <div tw="flex flex-col gap-1.5">
                <h3 tw="font-serif text-[24px] font-bold leading-tight text-pine-900">{g.title}</h3>
                <p tw="max-w-[560px] font-sans text-[14px] leading-relaxed text-muted">{g.text}</p>
              </div>
              <div tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((p) => (
                  <CatalogCard key={p.id} item={p} />
                ))}
              </div>
            </div>
          ))}
        </Container>
      </Section>

      {/* Materiais gratuitos, separados dos produtos pagos */}
      <Section tone="cream">
        <Container tw="flex flex-col gap-8">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>{page.freeSection.eyebrow}</Eyebrow>
            <Title>{page.freeSection.title}</Title>
            <Lead>{page.freeSection.text}</Lead>
          </div>
          <div tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.free.map((p) => (
              <CatalogCard key={p.id} item={p} />
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="white" id="faq" tw="scroll-mt-24">
        <Container tw="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div tw="flex flex-col gap-4">
            <Eyebrow>Dúvidas</Eyebrow>
            <Title>Perguntas frequentes</Title>
          </div>
          <div tw="flex flex-col divide-y divide-line border-y border-line">
            {page.faq.map((item) => (
              <details key={item.q} className="group" tw="py-5">
                <summary tw="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-[15px] font-semibold text-pine-900 [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span aria-hidden="true" tw="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-pine-800 transition group-open:rotate-45">+</span>
                </summary>
                <p tw="mt-3 max-w-[640px] font-sans text-[14px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand {...page.cta} />
    </>
  )
}

function CatalogCard({ item }: { item: CatalogItem }) {
  const waitlist = item.status === 'soon' || item.status === 'planned'
  return (
    <article id={item.id} className="group" tw="flex scroll-mt-28 flex-col rounded-[18px] bg-white p-5 shadow-card transition duration-300 hover:(-translate-y-1 shadow-lift)">
      <div tw="relative rounded-xl bg-cream py-6">
        <BookCover cover={item.cover} />
        <span
          css={[
            tw`absolute top-3 right-3 rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider`,
            item.status === 'free' ? tw`bg-pine-800 text-white` : item.status === 'available' ? tw`bg-white text-pine-800 ring-1 ring-line` : tw`bg-sun-500 text-white`,
          ]}
        >
          {statusLabel[item.status]}
        </span>
      </div>
      <p tw="mt-5 font-sans text-[13px] text-muted">{item.kind}</p>
      <h3 tw="mt-0.5 font-sans text-[16px] font-semibold leading-snug text-ink">{item.title}</h3>
      <p tw="mt-2 font-sans text-[13px] leading-relaxed text-muted">{item.text}</p>
      <div tw="mt-auto pt-5">
        {waitlist ? (
          <Waitlist product={item.title} notify={item.notify} />
        ) : (
          <SmartLink
            href={item.href!}
            tw="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pine-900 px-4 py-3 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-pine-700"
          >
            {item.status === 'free' ? 'Quero receber' : 'Saiba mais'} <Arrow />
          </SmartLink>
        )}
      </div>
    </article>
  )
}

function Waitlist({ product, notify }: { product: string; notify?: string }) {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true) // TODO: enviar para a lista de e-mails da Laura com a tag do produto
  }
  if (sent) return <p tw="rounded-xl bg-mist p-3 text-center font-sans text-[13px] text-pine-900">{notify ?? `Combinado! Você recebe um aviso quando o ${product} sair.`}</p>
  const id = `wl-${product.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <form onSubmit={submit} tw="flex items-center rounded-full bg-cream p-1 pl-4 ring-1 ring-line focus-within:ring-pine-800">
      <label htmlFor={id} tw="sr-only">Seu e-mail para ser avisado</label>
      <input id={id} type="email" required placeholder="Seu e-mail" tw="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none" />
      <button type="submit" tw="rounded-full bg-sun-500 px-4 py-2.5 font-sans text-[12px] font-semibold text-white hover:bg-sun-600">Me avise</button>
    </form>
  )
}
