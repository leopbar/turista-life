import tw from 'twin.macro'
import { recsPage as page, type RecItem } from '../pagesContent'
import { CouponButton } from '../components/Recommendations'
import { Container, CtaBand, PageHero, Section, SmartLink, PlaneTrail } from '../components/ui'
import { Arrow, Check, RecIcon } from '../components/icons'

export function RecommendationsPage() {
  return (
    <>
      <PageHero {...page.hero} />

      {/* Atalhos por categoria */}
      <nav aria-label="Categorias" tw="sticky top-20 z-30 border-b border-line bg-cream/95 backdrop-blur-md">
        <Container tw="flex gap-2 overflow-x-auto py-3 [scrollbar-width: none]">
          {page.groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} tw="shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 font-sans text-[13px] font-medium text-pine-900 no-underline ring-1 ring-line transition hover:(bg-pine-800 text-white ring-pine-800)">
              {g.title}
            </a>
          ))}
        </Container>
      </nav>

      <Section tone="cream">
        <Container tw="grid gap-12 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-start">
          <div tw="flex flex-col gap-14">
            {page.groups.map((g) => (
              <section key={g.id} id={g.id} tw="scroll-mt-40" aria-labelledby={`${g.id}-t`}>
                <h2 id={`${g.id}-t`} tw="flex items-center gap-3 font-serif text-[1.7rem] font-bold text-ink">
                  {g.title}
                  <span aria-hidden="true" tw="h-px flex-1 bg-line" />
                </h2>
                <div tw="mt-6 grid gap-5 md:grid-cols-2">
                  {g.items.map((item) => (
                    <RecCard key={item.title} item={item} />
                  ))}
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

function RecCard({ item }: { item: RecItem }) {
  const I = RecIcon[item.icon]
  return (
    <article tw="flex flex-col rounded-[18px] border border-line bg-white p-6 transition duration-300 hover:(-translate-y-1 border-transparent shadow-lift)">
      <div tw="flex items-start gap-4">
        <span tw="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pine-800 text-white">
          <I />
        </span>
        <h3 tw="pt-1 font-sans text-[16px] font-semibold leading-snug text-pine-900">{item.title}</h3>
      </div>
      <p tw="mt-4 font-sans text-[13.5px] leading-relaxed text-muted">
        <span tw="font-semibold text-pine-800">Por que eu uso: </span>
        {item.why}
      </p>
      {item.perk && (
        <p tw="mt-3 inline-flex self-start rounded-lg bg-sun-500/10 px-3 py-1.5 font-sans text-[12px] font-medium text-sun-600">{item.perk}</p>
      )}
      <div css={[tw`mt-auto flex flex-wrap items-center gap-3 pt-5`, item.coupon ? tw`justify-between` : tw`justify-end`]}>
        {item.coupon && <CouponButton code={item.coupon} />}
        <SmartLink
          href={item.href}
          tw="inline-flex items-center gap-2 rounded-full bg-pine-900 px-5 py-2.5 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-sun-500"
        >
          {item.cta} <Arrow />
        </SmartLink>
      </div>
    </article>
  )
}
