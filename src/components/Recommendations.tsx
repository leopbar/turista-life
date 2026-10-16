import { useState } from 'react'
import tw from 'twin.macro'
import { recommendations } from '../content'
import { recsPage, type RecCategory, type RecItem } from '../pagesContent'
import { Button, Container, Eyebrow, Lead, Section, SmartLink, Title } from './ui'
import { Arrow, Check, Copy, Pin, RecIcon } from './icons'

export function CouponButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* sem permissão de clipboard: o cupom continua visível para copiar manualmente */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar cupom ${code}`}
      tw="inline-flex items-center gap-2 rounded-lg border border-dashed border-sun-500 bg-sun-500/5 px-3 py-2 font-sans text-[11px] font-semibold tracking-wider text-sun-600 transition hover:bg-sun-500/10"
    >
      <span tw="font-medium normal-case tracking-normal text-sun-600/80">Cupom</span>
      {copied ? 'Copiado!' : code}
      {copied ? <Check /> : <Copy />}
    </button>
  )
}

/** Card de recomendação: foto da viagem, selo com o logo da marca, motivo, cupom e botão. */
export function RecCard({ item, category, index = 0, wide = false }: { item: RecItem; category?: string; index?: number; wide?: boolean }) {
  return (
    <article
      className="group"
      css={[
        tw`relative flex w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-card ring-1 ring-line transition duration-300 hover:(-translate-y-1 shadow-lift ring-transparent)`,
        wide && tw`md:(col-span-2 grid grid-cols-[1.1fr_1fr])`,
      ]}
    >
      <div css={[tw`relative aspect-[16/10] overflow-hidden bg-mist`, wide && tw`md:(aspect-auto h-full min-h-[320px])`]}>
        <img
          src={item.image}
          alt=""
          loading="lazy"
          tw="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          style={{ objectPosition: item.position ?? '50% 50%' }}
        />
        <span aria-hidden="true" tw="absolute inset-0 bg-gradient-to-t from-pine-950/60 via-transparent to-transparent" />
        {category && (
          <span tw="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[.12em] text-pine-900 backdrop-blur">
            {category}
          </span>
        )}
        {item.place && (
          <span tw="absolute right-4 top-4 inline-flex md:(top-auto bottom-3) items-center gap-1 font-script text-[20px] leading-none text-white [text-shadow: 0 1px 6px rgba(0,0,0,.45)]">
            <Pin width={14} height={14} /> {item.place}
          </span>
        )}
      </div>

      <div css={[tw`relative flex flex-1 flex-col px-6 pb-6 pt-11`, wide && tw`md:(px-8 py-8)`]}>
        <span
          css={[
            tw`absolute -top-8 left-5 grid h-16 min-w-[128px] place-items-center rounded-2xl bg-white px-5 shadow-card ring-1 ring-line transition duration-300 group-hover:rotate-0`,
            index % 2 ? tw`rotate-[2deg]` : tw`-rotate-2`,
            wide && tw`md:(static mb-5 self-start)`,
          ]}
        >
          {item.brand.logo ? (
            <img src={item.brand.logo} alt={item.brand.name} tw="h-8 w-auto max-w-[120px] object-contain" />
          ) : (
            <span tw="font-sans text-[13px] font-semibold leading-tight text-pine-900">{item.brand.name}</span>
          )}
        </span>

        <h3 tw="font-serif text-[1.3rem] font-bold leading-snug text-ink">{item.title}</h3>
        <p tw="mt-2 font-sans text-[13.5px] leading-relaxed text-muted">
          <span tw="font-script text-[19px] leading-none text-sun-600">Por que eu uso: </span>
          {item.why}
        </p>
        {item.perk && (
          <p tw="mt-3 inline-flex self-start rounded-lg bg-sun-500/10 px-3 py-1.5 font-sans text-[12px] font-medium text-sun-600">{item.perk}</p>
        )}
        <div css={[tw`mt-auto flex flex-wrap items-center gap-3 pt-5`, item.coupon ? tw`justify-between` : tw`justify-end`]}>
          {item.coupon && <CouponButton code={item.coupon} />}
          <SmartLink
            href={item.href}
            {...(item.href.startsWith('http') ? { rel: 'noreferrer sponsored' } : {})}
            tw="inline-flex items-center gap-2 rounded-full bg-pine-900 px-5 py-2.5 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-sun-500"
          >
            {item.cta} <Arrow />
          </SmartLink>
        </div>
      </div>
    </article>
  )
}

/** Categoria ainda sem indicação. */
export function SoonCard({ category }: { category: RecCategory }) {
  const I = RecIcon[category.icon]
  return (
    <article tw="flex flex-col items-start gap-3 rounded-[20px] border-[1.5px] border-dashed border-pine-800/25 bg-white/60 p-6">
      <span tw="grid h-12 w-12 place-items-center rounded-full bg-mist text-pine-800">
        <I />
      </span>
      <p tw="font-script text-[24px] leading-none text-sun-600">Em breve</p>
      <h3 tw="font-serif text-[1.2rem] font-bold leading-snug text-ink">{category.title}</h3>
      <p tw="font-sans text-[13px] leading-relaxed text-muted">{recsPage.soon}</p>
    </article>
  )
}

const featured = recsPage.categories.flatMap((c) => c.items.filter((i) => i.featured && !i.hidden).map((item) => ({ item, category: c.label })))

export function Recommendations() {
  return (
    <Section id="recomendacoes" tone="cream">
      <Container tw="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
        <div tw="flex flex-col gap-4 lg:(sticky top-28)">
          <Eyebrow>{recommendations.eyebrow}</Eyebrow>
          <Title>{recommendations.title}</Title>
          <Lead>{recommendations.text}</Lead>
          <Button variant="pine" href="/recomendacoes" tw="self-start">
            Ver todas as recomendações <Arrow />
          </Button>
        </div>

        <ul tw="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          {featured.map(({ item, category }, i) => (
            <li key={item.title} tw="flex">
              <RecCard item={item} category={category} index={i} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
