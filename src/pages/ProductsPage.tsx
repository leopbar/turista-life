import { useState, type FormEvent } from 'react'
import tw from 'twin.macro'
import { productsPage as page, type CatalogItem } from '../pagesContent'
import { BookCover } from '../components/Products'
import { Container, CtaBand, Eyebrow, Lead, PageHero, Section, SmartLink, Title } from '../components/ui'
import { Arrow } from '../components/icons'

const statusLabel: Record<CatalogItem['status'], string> = {
  available: 'Disponível',
  soon: 'Em breve',
  planned: 'Em produção',
  free: 'Grátis',
}

export function ProductsPage() {
  const available = page.catalog.filter((p) => p.status === 'available')
  const upcoming = page.catalog.filter((p) => p.status === 'soon' || p.status === 'planned')

  return (
    <>
      <PageHero {...page.hero} />

      {/* Disponíveis para compra: maior destaque */}
      <Section tone="mist" id="disponiveis" tw="scroll-mt-24">
        <Container tw="flex flex-col gap-8">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>{page.available.eyebrow}</Eyebrow>
            <Title>{page.available.title}</Title>
            <Lead>{page.available.text}</Lead>
          </div>
          <div tw="grid gap-6 lg:grid-cols-2">
            {available.map((p) => (
              <AvailableCard key={p.id} item={p} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Próximos lançamentos: visual mais leve, com lista de espera */}
      <Section tone="white" id="proximos" tw="scroll-mt-24">
        <Container tw="flex flex-col gap-8">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>{page.upcoming.eyebrow}</Eyebrow>
            <Title>{page.upcoming.title}</Title>
            <Lead>{page.upcoming.text}</Lead>
          </div>
          <div tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((p) => (
              <UpcomingCard key={p.id} item={p} />
            ))}
          </div>
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
              <FreeCard key={p.id} item={p} />
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

function AvailableCard({ item }: { item: CatalogItem }) {
  const button = tw`inline-flex items-center justify-center gap-2 rounded-full bg-sun-500 px-6 py-3 font-sans text-[14px] font-semibold text-white no-underline transition hover:bg-sun-600`
  return (
    <article id={item.id} className="group" tw="grid scroll-mt-28 gap-6 rounded-[22px] bg-white p-6 shadow-card ring-2 ring-transparent transition duration-300 hover:(-translate-y-1 shadow-lift ring-sun-500/30) sm:grid-cols-[200px_1fr]">
      <div tw="relative rounded-2xl bg-cream py-7">
        <BookCover cover={item.cover} />
        <span tw="absolute top-3 left-3 rounded-full bg-pine-800 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
          {statusLabel.available}
        </span>
      </div>
      <div tw="flex flex-col">
        <p tw="font-sans text-[13px] text-muted">{item.kind}</p>
        <h3 tw="mt-0.5 font-serif text-[22px] font-bold leading-tight text-pine-900">{item.title}</h3>
        <p tw="mt-2 font-sans text-[13.5px] leading-relaxed text-muted">{item.text}</p>
        <div tw="mt-auto flex flex-col items-start gap-3 pt-5">
          {item.price && (
            <p tw="flex flex-col">
              <span tw="font-sans text-[11px] uppercase tracking-[.14em] text-muted">Valor</span>
              <span tw="font-serif text-[24px] font-bold leading-tight text-pine-900">{item.price}</span>
            </p>
          )}
          <SmartLink href={item.page!} css={button}>
            {item.cta} <Arrow />
          </SmartLink>
        </div>
      </div>
    </article>
  )
}

function UpcomingCard({ item }: { item: CatalogItem }) {
  return (
    <article id={item.id} tw="flex scroll-mt-28 flex-col rounded-[18px] bg-mist/60 p-4 ring-1 ring-line">
      <div tw="relative rounded-xl bg-white/70 py-4 opacity-90">
        <BookCover cover={item.cover} />
        <span tw="absolute top-2.5 right-2.5 rounded-full bg-white px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-pine-800 ring-1 ring-line">
          {statusLabel[item.status]}
        </span>
      </div>
      <p tw="mt-4 font-sans text-[12px] text-muted">{item.kind}</p>
      <h3 tw="mt-0.5 font-sans text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
      <p tw="mt-1.5 font-sans text-[12.5px] leading-relaxed text-muted">{item.text}</p>
      <div tw="mt-auto pt-4">
        <Waitlist product={item.title} notify={item.notify} />
      </div>
    </article>
  )
}

function FreeCard({ item }: { item: CatalogItem }) {
  return (
    <article id={item.id} className="group" tw="flex scroll-mt-28 flex-col rounded-[18px] bg-white p-5 shadow-card transition duration-300 hover:(-translate-y-1 shadow-lift)">
      <div tw="relative rounded-xl bg-cream py-6">
        <BookCover cover={item.cover} />
        <span tw="absolute top-3 right-3 rounded-full bg-pine-800 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
          {statusLabel.free}
        </span>
      </div>
      <p tw="mt-5 font-sans text-[13px] text-muted">{item.kind}</p>
      <h3 tw="mt-0.5 font-sans text-[16px] font-semibold leading-snug text-ink">{item.title}</h3>
      <p tw="mt-2 font-sans text-[13px] leading-relaxed text-muted">{item.text}</p>
      <div tw="mt-auto pt-5">
        <SmartLink
          href={item.href!}
          tw="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pine-900 px-4 py-3 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-pine-700"
        >
          Quero receber <Arrow />
        </SmartLink>
      </div>
    </article>
  )
}

function Waitlist({ product, notify }: { product: string; notify?: string }) {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Opção provisória até a integração de e-mail (PRO-29): abre a página de inscrição do MailerLite.
    if (page.waitlistUrl) window.open(page.waitlistUrl, '_blank', 'noopener')
    setSent(true)
  }
  if (sent) return <p tw="rounded-xl bg-mist p-3 text-center font-sans text-[13px] text-pine-900">{notify ?? `Combinado! Você recebe um aviso quando o ${product} sair.`}</p>
  const id = `wl-${product.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <form onSubmit={submit} tw="flex items-center rounded-full bg-cream p-1 pl-4 ring-1 ring-line focus-within:ring-pine-800">
      <label htmlFor={id} tw="sr-only">Seu e-mail para ser avisado</label>
      <input id={id} type="email" required placeholder="Seu e-mail" tw="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none" />
      <button type="submit" tw="rounded-full bg-pine-800 px-4 py-2.5 font-sans text-[12px] font-semibold text-white hover:bg-pine-700">Me avise</button>
    </form>
  )
}
