import tw from 'twin.macro'
import { productsPage as page, type CatalogItem } from '../pagesContent'
import { BookCover } from '../components/Products'
import { Container, CtaBand, Eyebrow, Lead, PageHero, Section, SmartLink, Title } from '../components/ui'
import { Arrow } from '../components/icons'
import { t } from '../cms/runtime'
import { Sections } from '../cms/Sections'
import { newsletter } from '../content'
import { useNewsletter } from '../newsletter'
import { NewsletterHoneypot } from '../components/NewsletterHoneypot'

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
    <Sections
      page="produtos"
      items={{
        hero: <PageHero {...page.hero} />,
        available: (
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
        ),
        upcoming: (
          <Section tone="white" id="proximos" tw="scroll-mt-24">
            <Container tw="flex flex-col gap-8">
              <div tw="flex max-w-[560px] flex-col gap-3">
                <Eyebrow>{page.upcoming.eyebrow}</Eyebrow>
                <Title>{page.upcoming.title}</Title>
                <Lead>{page.upcoming.text}</Lead>
              </div>
              <div tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((p) => (
                  <UpcomingCard key={p.id} item={p} />
                ))}
              </div>
            </Container>
          </Section>
        ),
        free: (
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
        ),
        faq: (
          <Section tone="white" id="faq" tw="scroll-mt-24">
            <Container tw="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
              <div tw="flex flex-col gap-4">
                <Eyebrow>{t('geral.faq.chamada', 'Dúvidas')}</Eyebrow>
                <Title>{t('geral.faq.titulo', 'Perguntas frequentes')}</Title>
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
        ),
        cta: <CtaBand {...page.cta} />,
      }}
    />
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
              <span tw="font-sans text-[11px] uppercase tracking-[.14em] text-muted">{t('produto.valor', 'Valor')}</span>
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
        <Waitlist product={item.title} notify={item.notify} form={item.waitlistForm} />
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
          href={item.page!}
          tw="inline-flex w-full items-center justify-center gap-2 rounded-full bg-pine-900 px-4 py-3 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-pine-700"
        >
          {item.cta} <Arrow />
        </SmartLink>
      </div>
    </article>
  )
}

function Waitlist({ product, notify, form }: { product: string; notify?: string; form?: string }) {
  const endpoint = form || page.waitlistForm
  const { status, submit } = useNewsletter(endpoint)
  const sending = status === 'sending'
  // Sem formulário no MailerLite, não dá para guardar o e-mail: melhor avisar do que fingir que deu certo.
  if (!endpoint) return <p tw="rounded-xl bg-white/70 p-3 text-center font-sans text-[13px] text-muted">{t('produtos.espera.embreve', 'Inscrições para o aviso abrem em breve.')}</p>
  if (status === 'done') return <p role="status" tw="rounded-xl bg-mist p-3 text-center font-sans text-[13px] text-pine-900">{notify ?? `Combinado! Você recebe um aviso quando o ${product} sair.`}</p>
  const id = `wl-${product.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <form onSubmit={submit} tw="relative">
      <div tw="flex items-center rounded-full bg-cream p-1 pl-4 ring-1 ring-line focus-within:ring-pine-800">
        <label htmlFor={id} tw="sr-only">{t('produtos.espera.rotulo', 'Seu e-mail para ser avisado')}</label>
        <input id={id} name="email" type="email" required autoComplete="email" aria-describedby={`${id}-feedback`} placeholder={t('geral.email.rotulo', 'Seu e-mail')} tw="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none" />
        <NewsletterHoneypot />
        <button type="submit" disabled={sending} tw="rounded-full bg-pine-800 px-4 py-2.5 font-sans text-[12px] font-semibold text-white hover:bg-pine-700 disabled:(cursor-wait opacity-70)">
          {sending ? newsletter.sending : t('produtos.espera.botao', 'Me avise')}
        </button>
      </div>
      <p id={`${id}-feedback`} role="status" tw="mt-2 px-2 font-sans text-[12px] text-sun-600 empty:hidden">
        {status === 'invalid' ? newsletter.invalid : status === 'error' ? newsletter.error : ''}
      </p>
    </form>
  )
}
