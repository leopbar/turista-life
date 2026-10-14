import { Link, Navigate, useParams } from 'react-router-dom'
import 'twin.macro'
import { ArticleBody, ArticleCard } from '../blog/BlogUI'
import { articleBySlug, categoryLabel, countryName, destinationById, readingMinutes, relatedTo } from '../blog/blogData'
import { Container, Section } from '../components/ui'
import { Arrow, Pin } from '../components/icons'

export function BlogArticlePage() {
  const { slug = '' } = useParams()
  const a = articleBySlug(slug)
  if (!a) return <Navigate to="/blog" replace />
  const d = destinationById(a.destination)!
  const related = relatedTo(a)

  return (
    <>
      <header tw="relative overflow-hidden bg-pine-950 pt-32 pb-14 sm:pt-40 sm:pb-20">
        <img src={a.cover.src} alt="" tw="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: a.cover.position ?? '50% 50%' }} />
        <div aria-hidden="true" tw="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(8,38,36,.95) 0%, rgba(8,38,36,.65) 55%, rgba(8,38,36,.35) 100%)' }} />
        <Container tw="relative text-white">
          <nav aria-label="Você está em" tw="font-sans text-[12px] text-white/70">
            <Link to="/" tw="text-white/70 no-underline hover:text-white">Início</Link>
            <span aria-hidden="true" tw="mx-2">/</span>
            <Link to="/blog" tw="text-white/70 no-underline hover:text-white">Blog</Link>
            <span aria-hidden="true" tw="mx-2">/</span>
            <Link to={`/blog/destino/${d.id}`} tw="text-white/70 no-underline hover:text-white">{d.name}</Link>
          </nav>
          <div tw="mt-6 flex flex-wrap gap-2">
            <Link to={`/blog?assunto=${a.category}`} tw="rounded-full bg-sun-500 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[.12em] text-white no-underline hover:bg-sun-600">
              {categoryLabel(a.category)}
            </Link>
            <Link to={`/blog/destino/${d.id}`} tw="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[.12em] text-white no-underline hover:bg-white/25">
              <Pin width={12} height={12} /> {d.name}, {countryName(d.country)}
            </Link>
          </div>
          <h1 tw="mt-4 max-w-[820px] font-serif text-[2.1rem] font-bold leading-[1.1] sm:text-[3rem] [text-wrap: balance]">{a.title}</h1>
          <p tw="mt-4 max-w-[640px] font-sans text-[15px] leading-relaxed text-white/85">{a.excerpt}</p>
          <p tw="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[12.5px] text-white/75">
            <span>Por <strong tw="font-semibold text-white">Laura Irigoyen</strong></span>
            <span aria-hidden="true">·</span>
            <span>Viagem: {a.trip}</span>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(a)} min de leitura</span>
          </p>
        </Container>
      </header>

      <Section tone="cream" tw="pt-10 sm:pt-14">
        <Container>
          <article tw="mx-auto max-w-[720px]">
            <ArticleBody article={a} />

            <Link
              to={`/blog/destino/${d.id}`}
              className="group"
              tw="mt-10 flex items-center justify-between gap-4 rounded-[20px] bg-white p-5 no-underline shadow-card ring-1 ring-line transition hover:ring-pine-800"
            >
              <span>
                <span tw="block font-script text-[22px] leading-none text-sun-600">Vai para {d.name}?</span>
                <span tw="mt-1 block font-sans text-[14px] font-semibold text-pine-900">Veja todos os artigos, vídeos e o guia do destino</span>
              </span>
              <span tw="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pine-800 text-white transition group-hover:bg-sun-500">
                <Arrow />
              </span>
            </Link>
          </article>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="white">
          <Container tw="flex flex-col gap-6">
            <h2 tw="font-serif text-[1.8rem] font-bold text-ink">Continue lendo</h2>
            <div tw="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <ArticleCard key={r.slug} article={r} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  )
}
