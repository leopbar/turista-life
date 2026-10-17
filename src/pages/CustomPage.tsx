import { useParams } from 'react-router-dom'
import tw from 'twin.macro'
import { BlockView } from '../blog/BlogUI'
import type { GuideId } from '../blog/blogData'
import { customPageBySlug, type PageBlock } from '../cms/pages'
import { imgProps } from '../cms/runtime'
import { Arrow } from '../components/icons'
import { Button, Container, PageHero, Section, SmartLink, Title } from '../components/ui'
import { HomePage } from './HomePage'

/** Página criada no painel com blocos prontos. Endereço desconhecido continua levando à página inicial. */
export function CustomPage() {
  const { slug = '' } = useParams()
  const page = customPageBySlug(slug)
  if (!page) return <HomePage />

  const [first, ...rest] = page.blocks
  const blocks = first?.type === 'hero' ? rest : page.blocks
  return (
    <>
      {first?.type === 'hero' ? (
        <PageHero eyebrow={first.eyebrow ?? page.title} title={first.title} text={first.text ?? ''} image={first.image} position={first.position} />
      ) : (
        <div tw="bg-pine-950 pt-28 pb-12 sm:pt-36">
          <Container>
            <h1 tw="font-serif text-[2.4rem] font-bold leading-tight text-white sm:text-[3rem]">{page.title}</h1>
          </Container>
        </div>
      )}
      <Section tone="cream">
        <Container tw="flex max-w-[860px] flex-col gap-6">
          {blocks.map((b, i) => (
            <PageBlockView key={i} block={b} />
          ))}
        </Container>
      </Section>
    </>
  )
}

function PageBlockView({ block: b }: { block: PageBlock }) {
  switch (b.type) {
    case 'hero':
      return <Title tw="mt-6">{b.title}</Title>
    case 'cards':
      return (
        <div tw="my-4 flex flex-col gap-5">
          {b.title && <h2 tw="font-serif text-[1.65rem] font-bold text-ink">{b.title}</h2>}
          <div tw="grid gap-5 sm:grid-cols-2">
            {b.items.map((c, i) => (
              <article key={i} tw="flex flex-col overflow-hidden rounded-[20px] bg-white shadow-card ring-1 ring-line">
                <img {...imgProps(c.image, { alt: '', sizes: '(min-width: 640px) 420px, 100vw' })} loading="lazy" tw="aspect-[16/10] w-full object-cover" />
                <div tw="flex flex-1 flex-col gap-2 p-5">
                  <h3 tw="font-serif text-[1.2rem] font-bold text-ink">{c.title}</h3>
                  <p tw="font-sans text-[14px] leading-relaxed text-muted">{c.text}</p>
                  {c.href && (
                    <SmartLink href={c.href} tw="mt-auto inline-flex items-center gap-1.5 pt-2 font-sans text-[13px] font-semibold text-pine-800 no-underline hover:text-sun-600">
                      {c.button || 'Saiba mais'} <Arrow width={14} height={14} />
                    </SmartLink>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )
    case 'button':
      return (
        <div css={[tw`my-2`]}>
          <Button variant={b.style} href={b.href}>
            {b.label} <Arrow />
          </Button>
        </div>
      )
    default:
      return <BlockView block={b} guide={(b.type === 'guide' && b.id) || ('guia-bali' as GuideId)} />
  }
}
