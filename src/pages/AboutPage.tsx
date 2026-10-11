import tw, { css } from 'twin.macro'
import { aboutPage as page } from '../aboutContent'
import { Button, Container, CtaBand, Eyebrow, Lead, PageHero, PlaneTrail, Section, SmartLink, Title } from '../components/ui'
import { Arrow, Check, Instagram, TikTok, YouTube } from '../components/icons'

export function AboutPage() {
  const { intro } = page
  return (
    <>
      <PageHero {...page.hero} />

      {/* Apresentação */}
      <Section tone="cream">
        <Container tw="grid items-center gap-14 lg:grid-cols-[auto_1fr]">
          <figure tw="relative mx-auto w-[280px] rotate-[-3deg] bg-white p-3 pb-16 shadow-lift transition-transform duration-500 hover:rotate-0 sm:w-[320px]">
            <span aria-hidden="true" tw="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-[#E9DFC9]/90" />
            <img src={intro.portrait.src} alt={intro.portrait.alt} tw="aspect-[4/5] w-full object-cover" />
            <figcaption tw="absolute right-5 bottom-3 font-script text-[26px] text-pine-900">{intro.portrait.caption}</figcaption>
          </figure>

          <div tw="flex flex-col gap-5">
            <p tw="font-script text-[40px] leading-none text-sun-600">{intro.hello}</p>
            {intro.paragraphs.map((p) => (
              <p key={p.slice(0, 16)} tw="max-w-[620px] font-sans text-[15.5px] leading-relaxed text-ink">{p}</p>
            ))}
            <ul tw="mt-2 flex flex-wrap gap-2">
              {intro.facts.map((f) => (
                <li key={f} tw="rounded-full bg-white px-4 py-2 font-sans text-[13px] font-medium text-pine-900 ring-1 ring-line">{f}</li>
              ))}
            </ul>
            <div tw="mt-2 flex items-center gap-3">
              {[
                { label: 'YouTube', href: page.socials.youtube, I: YouTube },
                { label: 'Instagram', href: page.socials.instagram, I: Instagram },
                { label: 'TikTok', href: page.socials.tiktok, I: TikTok },
              ].map(({ label, href, I }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} tw="grid h-11 w-11 place-items-center rounded-full bg-pine-800 text-white transition hover:bg-sun-500">
                  <I />
                </a>
              ))}
              <span tw="font-sans text-[13px] text-muted">@turista.life</span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Linha do tempo da vida */}
      <Section tone="white">
        <Container tw="flex flex-col gap-10">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>Minha história</Eyebrow>
            <Title>De Porto Alegre para o mundo</Title>
          </div>
          <ol tw="relative grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {page.timeline.map((t, i) => (
              <li key={t.title} tw="relative flex flex-col gap-2 border-t-2 border-dashed border-line pt-6">
                <span
                  aria-hidden="true"
                  css={[
                    tw`absolute -top-[9px] left-0 h-4 w-4 rounded-full ring-4 ring-white`,
                    i === page.timeline.length - 1 ? tw`bg-sun-500` : tw`bg-pine-800`,
                  ]}
                />
                <span tw="font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-sun-600">{t.when}</span>
                <h3 tw="font-serif text-[1.25rem] font-bold leading-snug text-ink">{t.title}</h3>
                <p tw="font-sans text-[13.5px] leading-relaxed text-muted">{t.text}</p>
                {t.link && (
                  <SmartLink href={t.link.href} tw="mt-1 inline-flex items-center gap-1 font-sans text-[13px] font-semibold text-pine-800 no-underline hover:text-sun-600">
                    {t.link.label} <Arrow width={14} height={14} />
                  </SmartLink>
                )}
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Trabalhos na Austrália */}
      <Section tone="mist">
        <Container tw="grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-center">
          <div tw="flex flex-col gap-4">
            <Eyebrow>Austrália</Eyebrow>
            <Title>{page.jobs.title}</Title>
            <Lead>{page.jobs.text}</Lead>
            <Button variant="pine" href={page.jobs.cta.href} tw="self-start">
              {page.jobs.cta.label} <Arrow />
            </Button>
          </div>
          <ol tw="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {page.jobs.items.map((j, i) => (
              <li key={j.title} tw="flex gap-4 rounded-[18px] bg-white p-5 shadow-card">
                <span tw="font-serif text-[28px] font-bold leading-none text-sun-500 tabular-nums">{i + 1}</span>
                <div>
                  <h3 tw="font-sans text-[15px] font-semibold text-pine-900">{j.title}</h3>
                  <p tw="mt-1 font-sans text-[13px] leading-relaxed text-muted">{j.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Frase */}
      <section tw="relative overflow-hidden bg-pine-900 py-20 text-white">
        <img src={import.meta.env.BASE_URL + 'images/diario/canggu-1.jpg'} alt="" tw="absolute inset-0 h-full w-full object-cover opacity-25" />
        <Container tw="relative flex flex-col items-center gap-6 text-center">
          <PlaneTrail tw="w-24 text-sun-500" />
          <blockquote tw="max-w-[820px] font-serif text-[1.7rem] font-semibold leading-snug sm:text-[2.2rem] [text-wrap: balance]">
            “{page.quote.text}”
          </blockquote>
          <p tw="font-script text-[24px] text-white/85">{page.quote.author}</p>
        </Container>
      </section>

      {/* Valores */}
      <Section tone="cream">
        <Container tw="flex flex-col gap-10">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>Valores</Eyebrow>
            <Title>{page.values.title}</Title>
          </div>
          <ul tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {page.values.items.map((v) => (
              <li key={v.title} tw="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-6 transition duration-300 hover:(-translate-y-1 border-transparent shadow-lift)">
                <span tw="grid h-10 w-10 place-items-center rounded-full bg-pine-800 text-white"><Check /></span>
                <h3 tw="font-serif text-[1.15rem] font-bold leading-snug text-ink">{v.title}</h3>
                <p tw="font-sans text-[13.5px] leading-relaxed text-muted">{v.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Curiosidades + bastidores */}
      <Section tone="white">
        <Container tw="grid gap-12 lg:grid-cols-[1fr_minmax(0,420px)]">
          <div tw="flex flex-col gap-8">
            <div tw="flex flex-col gap-3">
              <Eyebrow>Curiosidades</Eyebrow>
              <Title>{page.facts.title}</Title>
            </div>
            <ul tw="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {page.facts.items.map((f, i) => (
                <li key={f.title} tw="flex gap-4">
                  <span tw="font-script text-[34px] leading-none text-sun-500">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 tw="font-sans text-[15px] font-semibold text-pine-900">{f.title}</h3>
                    <p tw="mt-1 font-sans text-[13.5px] leading-relaxed text-muted">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside tw="overflow-hidden rounded-[20px] bg-pine-800 text-white shadow-lift">
            <img src={page.behind.image} alt="Laura trabalhando no computador num café em Bali" tw="aspect-[16/10] w-full object-cover" />
            <div tw="flex flex-col gap-4 p-7">
              <h2 tw="font-serif text-[1.5rem] font-bold">{page.behind.title}</h2>
              <p tw="font-sans text-[14px] leading-relaxed text-white/85">{page.behind.text}</p>
              <ol tw="flex flex-wrap items-center gap-2" aria-label="Etapas de cada vídeo">
                {page.behind.steps.map((s, i) => (
                  <li key={s} tw="flex items-center gap-2 font-sans text-[12px] font-medium">
                    <span tw="rounded-full bg-white/10 px-3 py-1.5">{s}</span>
                    {i < page.behind.steps.length - 1 && <span aria-hidden="true" css={css`color: #F07A2A;`}>→</span>}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </Container>
      </Section>

      <CtaBand {...page.cta} />
    </>
  )
}
