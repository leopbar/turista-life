import { useState } from 'react'
import { Link } from 'react-router-dom'
import tw from 'twin.macro'
import { BookCover } from '../components/Products'
import { CouponButton } from '../components/Recommendations'
import { PlaneTrail, SmartLink } from '../components/ui'
import { Arrow, Pin, Play, RecIcon } from '../components/icons'
import {
  blogPage,
  categoryLabel,
  destinationById,
  guideById,
  readingMinutes,
  resolveRec,
  type Article,
  type Block,
  type GuideId,
  type RecRef,
} from './blogData'

/* ------------------------------------------------------------------ */
/* Card de artigo                                                      */
/* ------------------------------------------------------------------ */

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const dest = destinationById(article.destination)!
  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group"
      css={[
        tw`flex h-full flex-col overflow-hidden rounded-[20px] bg-white no-underline shadow-card ring-1 ring-line transition duration-300 hover:(-translate-y-1 shadow-lift ring-transparent)`,
        featured && tw`lg:(grid grid-cols-[1.25fr_1fr])`,
      ]}
    >
      <div css={[tw`relative aspect-[16/10] overflow-hidden bg-mist`, featured && tw`lg:(aspect-auto h-full min-h-[360px])`]}>
        <img
          src={article.cover.src}
          alt=""
          loading="lazy"
          tw="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          style={{ objectPosition: article.cover.position ?? '50% 50%' }}
        />
        <span tw="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[.12em] text-pine-900 backdrop-blur">
          {categoryLabel(article.category)}
        </span>
      </div>
      <div css={[tw`flex flex-1 flex-col gap-2 p-5`, featured && tw`lg:(justify-center gap-3 p-10)`]}>
        <p tw="inline-flex items-center gap-1.5 font-sans text-[12px] font-medium text-sun-600">
          <Pin width={13} height={13} /> {dest.name}
        </p>
        <h3 css={[tw`font-serif font-bold leading-snug text-ink`, featured ? tw`text-[1.5rem] lg:text-[2rem] lg:leading-tight` : tw`text-[1.2rem]`]}>{article.title}</h3>
        <p css={[tw`font-sans leading-relaxed text-muted`, featured ? tw`text-[14.5px]` : tw`text-[13.5px]`]}>{article.excerpt}</p>
        <p tw="mt-auto flex items-center justify-between gap-3 pt-3 font-sans text-[12px] text-muted">
          <span>{readingMinutes(article)} min de leitura</span>
          <span tw="inline-flex items-center gap-1 font-semibold text-pine-800 group-hover:text-sun-600">
            Ler <Arrow width={14} height={14} />
          </span>
        </p>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Vídeo do YouTube: foto com play; o player só carrega no clique      */
/* ------------------------------------------------------------------ */

const ytPoster = (id: string) => `${import.meta.env.BASE_URL}images/videos/${id}.jpg`

export function VideoEmbed({ id, title, vertical = false, poster }: { id: string; title: string; vertical?: boolean; poster?: string }) {
  const [playing, setPlaying] = useState(false)
  return (
    <figure css={[tw`my-2`, vertical ? tw`mx-auto w-full max-w-[340px]` : tw`w-full`]}>
      <div css={[tw`relative overflow-hidden rounded-[18px] bg-pine-950 shadow-lift`, vertical ? tw`aspect-[9/16]` : tw`aspect-video`]}>
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            tw="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label={`Assistir: ${title}`} className="group" tw="absolute inset-0 h-full w-full cursor-pointer">
            <img src={poster ?? ytPoster(id)} alt="" loading="lazy" tw="h-full w-full object-cover opacity-90 transition duration-500 group-hover:(scale-[1.03] opacity-100)" />
            <span aria-hidden="true" tw="absolute inset-0 bg-gradient-to-t from-pine-950/80 via-pine-950/10 to-transparent" />
            <span tw="absolute inset-0 m-auto grid h-16 w-16 place-items-center rounded-full bg-sun-500 text-white shadow-lift transition group-hover:scale-110">
              <Play width={26} height={26} />
            </span>
            <span tw="absolute inset-x-4 bottom-4 text-left font-sans text-[13px] font-semibold leading-snug text-white">{title}</span>
          </button>
        )}
      </div>
      <figcaption tw="mt-2 text-center font-sans text-[12px] text-muted">
        {vertical ? 'Short' : 'Vídeo'} no canal{' '}
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer" tw="font-semibold text-pine-800 underline-offset-2 hover:underline">
          Turista Life
        </a>
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------ */
/* Chamada para o guia digital                                         */
/* ------------------------------------------------------------------ */

export function GuideBlock({ id, text }: { id: GuideId; text?: string }) {
  const g = guideById(id)
  const available = g.status === 'available'
  const href = available ? g.page! : `/produtos#${g.id}`
  return (
    <aside className="group" tw="relative my-4 grid items-center gap-6 overflow-hidden rounded-[22px] bg-pine-800 p-6 text-white shadow-lift sm:grid-cols-[170px_1fr] sm:p-8">
      <PlaneTrail tw="absolute -right-4 -top-2 w-40 text-white/10" />
      <div tw="relative rounded-2xl bg-white/10 py-5">
        <BookCover cover={g.cover} />
      </div>
      <div tw="relative flex flex-col gap-2">
        <p tw="font-script text-[24px] leading-none text-sun-500">{available ? 'Leve isso com você' : 'Em produção'}</p>
        <p tw="font-sans text-[11px] font-semibold uppercase tracking-[.16em] text-white/70">{g.kind}</p>
        <h3 tw="font-serif text-[1.6rem] font-bold leading-tight">{g.title}</h3>
        <p tw="font-sans text-[14px] leading-relaxed text-white/85">{text ?? g.text}</p>
        <div tw="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <SmartLink
            href={href}
            tw="inline-flex items-center justify-center gap-2 rounded-full bg-sun-500 px-6 py-3 font-sans text-[14px] font-semibold text-white no-underline transition hover:bg-sun-600"
          >
            {available ? (g.cta ?? 'Conhecer') : 'Quero ser avisado'} <Arrow />
          </SmartLink>
          {available && g.price && <span tw="font-serif text-[24px] font-bold">{g.price}</span>}
        </div>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Recomendações com links de afiliado                                 */
/* ------------------------------------------------------------------ */

export function RecsBlock({ title = 'O que eu usei nessa viagem', items, compactGrid = false }: { title?: string; items: RecRef[]; compactGrid?: boolean }) {
  const recs = items.map(resolveRec).filter(Boolean) as NonNullable<ReturnType<typeof resolveRec>>[]
  // Indicações reais primeiro; categorias "Em breve" no fim.
  recs.sort((a, b) => Number(a.kind === 'soon') - Number(b.kind === 'soon'))
  return (
    <section tw="my-4 rounded-[22px] bg-mist/70 p-5 ring-1 ring-line sm:p-7">
      <p tw="font-script text-[24px] leading-none text-sun-600">Recomendações</p>
      <h3 tw="mt-1 font-serif text-[1.4rem] font-bold leading-tight text-ink">{title}</h3>
      <ul css={[tw`mt-5 grid gap-3`, compactGrid ? tw`sm:grid-cols-2 lg:grid-cols-3` : tw`sm:grid-cols-2`]}>
        {recs.map((r) =>
          r.kind === 'item' ? (
            <li key={r.item.title} tw="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
              <div tw="flex items-center justify-between gap-3">
                <span tw="grid h-10 min-w-[96px] place-items-center rounded-xl bg-white px-3 ring-1 ring-line">
                  {r.item.brand.logo ? (
                    <img src={r.item.brand.logo} alt={r.item.brand.name} tw="h-6 w-auto max-w-[92px] object-contain" />
                  ) : (
                    <span tw="font-sans text-[11.5px] font-semibold leading-tight text-pine-900">{r.item.brand.name}</span>
                  )}
                </span>
                <span tw="font-sans text-[10.5px] font-semibold uppercase tracking-[.12em] text-muted">{r.category.label}</span>
              </div>
              <div>
                <h4 tw="font-sans text-[14.5px] font-semibold leading-snug text-ink">{r.item.title}</h4>
                <p tw="mt-1 font-sans text-[12.5px] leading-relaxed text-muted">{r.item.why}</p>
                {r.item.perk && <p tw="mt-2 inline-flex rounded-lg bg-sun-500/10 px-2.5 py-1 font-sans text-[11.5px] font-medium text-sun-600">{r.item.perk}</p>}
              </div>
              <div tw="mt-auto flex flex-wrap items-center justify-between gap-2">
                {r.item.coupon ? <CouponButton code={r.item.coupon} /> : <span />}
                <SmartLink
                  href={r.item.href}
                  {...(r.item.href.startsWith('http') ? { rel: 'noreferrer sponsored' } : {})}
                  tw="inline-flex items-center gap-1.5 rounded-full bg-pine-900 px-4 py-2 font-sans text-[12.5px] font-semibold text-white no-underline transition hover:bg-sun-500"
                >
                  {r.item.cta} <Arrow width={14} height={14} />
                </SmartLink>
              </div>
            </li>
          ) : (
            <SoonRec key={r.category.id} icon={r.category.icon} title={r.category.title} />
          ),
        )}
      </ul>
      <p tw="mt-4 font-sans text-[11.5px] leading-relaxed text-muted">
        {blogPage.disclosure}{' '}
        <Link to="/recomendacoes" tw="font-semibold text-pine-800 hover:underline">Ver todas as recomendações</Link>
      </p>
    </section>
  )
}

function SoonRec({ icon, title }: { icon: keyof typeof RecIcon; title: string }) {
  const I = RecIcon[icon]
  return (
    <li tw="flex items-start gap-3 rounded-2xl border-[1.5px] border-dashed border-pine-800/25 bg-white/60 p-4">
      <span tw="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist text-pine-800">
        <I />
      </span>
      <div>
        <p tw="font-script text-[20px] leading-none text-sun-600">Em breve</p>
        <h4 tw="mt-1 font-sans text-[14px] font-semibold leading-snug text-ink">{title}</h4>
        <p tw="mt-1 font-sans text-[12px] leading-relaxed text-muted">{blogPage.soonRec}</p>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Corpo do artigo                                                     */
/* ------------------------------------------------------------------ */

export function ArticleBody({ article }: { article: Article }) {
  const guide = destinationById(article.destination)!.guide
  return (
    <div tw="flex flex-col gap-5">
      {article.blocks.map((b, i) => (
        <BlockView key={i} block={b} guide={guide} />
      ))}
    </div>
  )
}

const prose = tw`font-sans text-[16px] leading-[1.8] text-ink/90`

function BlockView({ block: b, guide }: { block: Block; guide: GuideId }) {
  switch (b.type) {
    case 'p':
      return <p css={prose}>{b.text}</p>
    case 'h2':
      return <h2 tw="mt-6 font-serif text-[1.65rem] font-bold leading-tight text-ink sm:text-[1.85rem]">{b.text}</h2>
    case 'list': {
      const L = b.ordered ? 'ol' : 'ul'
      return (
        <L tw="flex flex-col gap-2.5 pl-1">
          {b.items.map((it) => (
            <li key={it} css={[prose, tw`relative pl-6`]}>
              <span aria-hidden="true" tw="absolute left-0 top-[.7em] h-2 w-2 rounded-full bg-sun-500" />
              {it}
            </li>
          ))}
        </L>
      )
    }
    case 'img':
      return (
        <figure tw="my-2">
          <img
            src={b.image.src}
            alt={b.image.alt}
            loading="lazy"
            css={[tw`w-full rounded-[18px] object-cover shadow-card`, b.tall ? tw`mx-auto aspect-[9/14] max-w-[340px]` : tw`aspect-video`]}
            style={{ objectPosition: b.image.position ?? '50% 50%' }}
          />
          {b.caption && <figcaption tw="mt-2 text-center font-script text-[19px] leading-snug text-pine-800">{b.caption}</figcaption>}
        </figure>
      )
    case 'gallery':
      return (
        <figure tw="my-2">
          <div tw="grid grid-cols-3 gap-2 sm:gap-3">
            {b.images.map((im) => (
              <img key={im.src} src={im.src} alt={im.alt} loading="lazy" tw="aspect-[9/14] w-full rounded-[14px] object-cover shadow-card" />
            ))}
          </div>
          {b.caption && <figcaption tw="mt-2 text-center font-script text-[19px] leading-snug text-pine-800">{b.caption}</figcaption>}
        </figure>
      )
    case 'tip':
      return (
        <aside tw="relative my-2 rounded-[18px] border-l-4 border-sun-500 bg-sun-500/[.07] px-5 py-4 sm:px-6">
          <p tw="font-script text-[22px] leading-none text-sun-600">{b.title ?? 'Dica da Laura'}</p>
          <p tw="mt-2 font-sans text-[14.5px] leading-relaxed text-ink/90">{b.text}</p>
        </aside>
      )
    case 'quote':
      return (
        <blockquote tw="my-3 border-y border-line py-6 text-center font-serif text-[1.4rem] font-semibold italic leading-snug text-pine-800 sm:text-[1.6rem]">
          “{b.text}”
        </blockquote>
      )
    case 'prices':
      return (
        <div tw="my-2 overflow-hidden rounded-[18px] bg-white shadow-card ring-1 ring-line">
          <p tw="bg-pine-800 px-5 py-3 font-sans text-[13px] font-semibold uppercase tracking-[.12em] text-white">{b.title}</p>
          <dl tw="divide-y divide-line">
            {b.rows.map((r) => (
              <div key={r.item} tw="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3">
                <dt tw="font-sans text-[14px] text-ink/90">{r.item}</dt>
                <dd tw="font-sans text-[14px] font-semibold text-pine-900">{r.price}</dd>
              </div>
            ))}
          </dl>
          {b.note && <p tw="bg-mist/60 px-5 py-2.5 font-sans text-[12px] text-muted">{b.note}</p>}
        </div>
      )
    case 'video':
      return <VideoEmbed id={b.id} title={b.title} vertical={b.vertical} poster={b.poster} />
    case 'guide':
      return <GuideBlock id={b.id ?? guide} text={b.text} />
    case 'recs':
      return <RecsBlock title={b.title} items={b.items} />
  }
}
