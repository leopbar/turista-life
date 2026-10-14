import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import tw from 'twin.macro'
import { ArticleCard, GuideBlock, RecsBlock, VideoEmbed } from '../blog/BlogUI'
import { articlesOf, blogCategories, countryName, destinationById } from '../blog/blogData'
import { allStops } from '../diaryContent'
import { Container, Eyebrow, Section, Title } from '../components/ui'
import { Arrow, Pin } from '../components/icons'

export function BlogDestinationPage() {
  const { id = '' } = useParams()
  const [active, setActive] = useState('todos')
  const d = destinationById(id)
  if (!d) return <Navigate to="/blog" replace />

  const list = articlesOf(d.id)
  // Só os assuntos que têm artigo neste destino, na ordem padrão.
  const cats = blogCategories.filter((c) => list.some((a) => a.category === c.id))
  const shown = active === 'todos' ? list : list.filter((a) => a.category === active)
  const stops = d.stops.map((s) => allStops.find((x) => x.id === s)).filter(Boolean)

  return (
    <>
      <section tw="relative overflow-hidden bg-pine-950 pt-32 pb-16 sm:pt-40 sm:pb-20">
        <img src={d.image} alt="" tw="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: d.position ?? '50% 50%' }} />
        <div aria-hidden="true" tw="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,38,36,.92) 0%, rgba(8,38,36,.7) 50%, rgba(8,38,36,.3) 100%)' }} />
        <Container tw="relative text-white">
          <nav aria-label="Você está em" tw="font-sans text-[12px] text-white/70">
            <Link to="/" tw="text-white/70 no-underline hover:text-white">Início</Link>
            <span aria-hidden="true" tw="mx-2">/</span>
            <Link to="/blog" tw="text-white/70 no-underline hover:text-white">Blog</Link>
            <span aria-hidden="true" tw="mx-2">/</span>
            <span tw="text-white">{d.name}</span>
          </nav>
          <p tw="mt-6 font-script text-[30px] leading-none text-sun-500 sm:text-[36px]">{d.tagline}</p>
          <h1 tw="mt-2 font-serif text-[2.6rem] font-bold leading-[1.05] sm:text-[3.6rem]">{d.name}</h1>
          <p tw="mt-2 inline-flex items-center gap-1.5 font-sans text-[13px] font-medium text-white/80">
            <Pin width={14} height={14} /> {countryName(d.country)}
          </p>
          <p tw="mt-5 max-w-[560px] font-sans text-[15px] leading-relaxed text-white/85">{d.intro}</p>
        </Container>
      </section>

      {/* Resumo rápido */}
      <div tw="border-b border-line bg-white">
        <Container>
          <dl tw="grid grid-cols-2 gap-x-6 gap-y-4 py-6 lg:grid-cols-4">
            {d.facts.map((f) => (
              <div key={f.label}>
                <dt tw="font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{f.label}</dt>
                <dd tw="mt-1 font-sans text-[14px] font-medium leading-snug text-pine-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      {/* Artigos por assunto */}
      <Section tone="cream">
        <Container tw="flex flex-col gap-10">
          <div tw="flex flex-wrap items-end justify-between gap-4">
            <div tw="flex max-w-[560px] flex-col gap-3">
              <Eyebrow>Artigos</Eyebrow>
              <Title>Tudo sobre {d.name}</Title>
            </div>
            <div role="group" aria-label="Filtrar por assunto" tw="flex flex-wrap gap-2">
              {[{ id: 'todos', label: 'Todos' }, ...cats].map((c) => {
                const on = c.id === active
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActive(c.id)}
                    css={[
                      tw`rounded-full px-3.5 py-1.5 font-sans text-[12.5px] font-medium ring-1 transition`,
                      on ? tw`bg-pine-800 text-white ring-pine-800` : tw`bg-white text-pine-900 ring-line hover:ring-pine-800`,
                    ]}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div tw="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Guia digital */}
      <Section tone="white">
        <Container tw="max-w-[880px]">
          <GuideBlock id={d.guide} />
        </Container>
      </Section>

      {/* Vídeos */}
      <Section tone="mist">
        <Container tw="flex flex-col gap-8">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>Vídeos</Eyebrow>
            <Title>{d.name} no canal</Title>
          </div>
          <div css={[tw`grid gap-6`, d.videos.some((v) => !v.vertical) ? tw`md:grid-cols-2 lg:grid-cols-3` : tw`sm:grid-cols-2 lg:grid-cols-3`]}>
            {d.videos.map((v) => (
              <VideoEmbed key={v.id} id={v.id} title={v.title} vertical={v.vertical} poster={v.poster} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Recomendações + rota */}
      <Section tone="cream">
        <Container tw="grid gap-8 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-start">
          <RecsBlock title={`O que eu usei em ${d.name}`} items={d.recs} />
          {stops.length > 0 && (
            <aside tw="rounded-[22px] bg-white p-6 shadow-card">
              <p tw="font-script text-[24px] leading-none text-sun-600">Na rota</p>
              <h3 tw="mt-1 font-serif text-[1.3rem] font-bold leading-tight text-ink">Veja {d.name} no diário da viagem</h3>
              <ul tw="mt-4 flex flex-col divide-y divide-line">
                {stops.map((s) => (
                  <li key={s!.id}>
                    <Link to={`/destinos#${s!.id}`} className="group" tw="flex items-center justify-between gap-3 py-3 no-underline">
                      <span>
                        <span tw="block font-sans text-[14px] font-semibold text-pine-900">{s!.city}</span>
                        <span tw="block font-sans text-[12px] text-muted">{s!.stay}{s!.badge ? ` · ${s!.badge}` : ''}</span>
                      </span>
                      <Arrow tw="shrink-0 text-pine-800 group-hover:text-sun-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </Container>
      </Section>
    </>
  )
}
