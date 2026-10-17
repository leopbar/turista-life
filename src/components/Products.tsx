import tw, { css } from 'twin.macro'
import { products, type Product } from '../content'
import { Button, Container, Eyebrow, Lead, Section, SmartLink, Title } from './ui'
import { Arrow } from './icons'
import { imgProps, t } from '../cms/runtime'

const toneBg = {
  pine: 'linear-gradient(180deg, rgba(11,48,46,.92) 0%, rgba(11,48,46,.15) 55%, rgba(11,48,46,.55) 100%)',
  sun: 'linear-gradient(180deg, rgba(221,103,25,.9) 0%, rgba(221,103,25,.1) 55%, rgba(8,38,36,.5) 100%)',
  sky: 'linear-gradient(180deg, rgba(234,244,250,.95) 0%, rgba(234,244,250,.2) 55%, rgba(8,38,36,.45) 100%)',
}

/** Capa de livro gerada a partir de uma foto da Laura. */
export function BookCover({ cover, large = false }: { cover: Product['cover']; large?: boolean }) {
  const dark = cover.tone !== 'sky'
  return (
    <div css={[tw`relative mx-auto [perspective: 800px]`, large ? tw`h-[300px] w-[220px]` : tw`h-[190px] w-[140px]`]}>
      <div
        tw="relative h-full w-full overflow-hidden rounded-r-md rounded-l-sm shadow-lift transition-transform duration-500 group-hover:[transform: rotateY(-14deg) translateY(-4px)]"
        css={css`transform: rotateY(-6deg); transform-origin: left center;`}
      >
        <img {...imgProps(cover.image, { alt: '' })} tw="absolute inset-0 h-full w-full object-cover" />
        <div tw="absolute inset-0" css={css`background: ${toneBg[cover.tone]};`} />
        <span aria-hidden="true" tw="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/30 to-transparent" />
        <div css={[tw`relative px-3 pt-4 text-center`, dark ? tw`text-white` : tw`text-pine-900`]}>
          <p tw="font-sans text-[9px] font-semibold uppercase tracking-[.18em] opacity-90">{cover.top}</p>
          <p css={[tw`mt-1 font-sans font-bold uppercase leading-[1.05] tracking-tight`, large ? tw`text-[26px]` : tw`text-[17px]`]}>{cover.title}</p>
        </div>
        <p tw="absolute bottom-2 inset-x-0 text-center font-script text-[13px] text-white">{t('produtos.capa.marca', 'Turista Life')}</p>
      </div>
    </div>
  )
}

export function Products() {
  return (
    <Section id="produtos" tone="mist">
      <Container tw="flex flex-col gap-10">
        <div tw="flex flex-wrap items-end justify-between gap-6">
          <div tw="flex max-w-[520px] flex-col gap-4">
            <Eyebrow>{products.eyebrow}</Eyebrow>
            <Title>{products.title}</Title>
            <Lead>{products.text}</Lead>
          </div>
          <Button variant="pine" href="/produtos">
            Ver todos os produtos <Arrow />
          </Button>
        </div>

        <div tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.items.map((p) => (
            <article key={p.title} className="group" tw="flex flex-col rounded-[18px] bg-white p-5 shadow-card transition duration-300 hover:(-translate-y-1 shadow-lift)">
              <div tw="relative rounded-xl bg-cream py-6">
                <BookCover cover={p.cover} />
                {p.soon && (
                  <span tw="absolute top-3 right-3 rounded-full bg-sun-500 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-white">
                    Em breve
                  </span>
                )}
              </div>
              <p tw="mt-5 font-sans text-[13px] text-muted">{p.kind}</p>
              <h3 tw="mt-0.5 font-sans text-[15px] font-semibold leading-snug text-ink">{p.title}</h3>
              <p tw="mt-2 font-sans text-[13px] leading-relaxed text-muted">{p.text}</p>
              <div tw="mt-auto flex items-center justify-between gap-3 pt-5">
                {p.note && !p.soon ? (
                  <span tw="font-sans text-[12px] font-medium text-pine-700">{p.note}</span>
                ) : (
                  <span tw="font-sans text-[12px] font-medium text-pine-700">{p.soon ? '' : 'Grátis'}</span>
                )}
                <SmartLink
                  href={p.href}
                  css={[
                    tw`rounded-full bg-pine-900 px-4 py-2.5 font-sans text-[12px] font-semibold text-white no-underline transition hover:bg-pine-700`,
                    p.soon && tw`bg-transparent text-pine-900 ring-[1.5px] ring-pine-900 hover:(bg-pine-900 text-white)`,
                  ]}
                >
                  {p.cta}
                </SmartLink>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  )
}
