import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import tw from 'twin.macro'
import { productPages, type ProductPage as Page } from '../pagesContent'
import { BookCover } from '../components/Products'
import { Container, Eyebrow, Section, SmartLink, Title } from '../components/ui'
import { Arrow, Check } from '../components/icons'

/** Página individual de um produto pago ou material gratuito, no modelo da antiga vitrine do e-book. */
export function ProductPage() {
  const { slug } = useParams()
  const p = productPages.find((x) => x.slug === slug)
  const top = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const sticky = useStickyBar(top, bottom, p)
  if (!p) return <Navigate to="/produtos" replace />

  return (
    <>
      {/* Topo: capa, promessa, preço e botão de compra */}
      <section tw="relative overflow-hidden bg-pine-950 pt-28 pb-14 sm:pt-36 sm:pb-20">
        <img src={p.image} alt="" tw="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" tw="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,38,36,.95) 0%, rgba(8,38,36,.82) 55%, rgba(8,38,36,.55) 100%)' }} />
        <Container tw="relative text-white">
          <nav aria-label="Você está em" tw="font-sans text-[12px] text-white/70">
            <Link to="/" tw="text-white/70 no-underline hover:text-white">Início</Link>
            <span aria-hidden="true" tw="mx-2">/</span>
            <Link to="/produtos" tw="text-white/70 no-underline hover:text-white">Produtos</Link>
            <span aria-hidden="true" tw="mx-2">/</span>
            <span tw="text-white">{p.title}</span>
          </nav>

          <div tw="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,340px)]">
            <div tw="flex flex-col gap-5">
              <p tw="font-sans text-xs font-semibold uppercase tracking-[.16em] text-sun-500">{p.kind}</p>
              <h1 tw="max-w-[640px] font-serif text-[2.3rem] font-bold leading-[1.08] sm:text-[3rem] [text-wrap: balance]">{p.title}</h1>
              <p tw="font-script text-[24px] leading-snug text-sun-500 sm:text-[28px]">{p.promise}</p>
              <p tw="max-w-[560px] font-sans text-[15px] leading-relaxed text-white/85">{p.text}</p>
              <div ref={top}>
                <BuyBox p={p} />
              </div>
            </div>
            <div className="group">
              <div tw="rounded-[24px] bg-white/10 py-8 ring-1 ring-white/15 sm:py-10">
                <div tw="hidden sm:block"><BookCover cover={p.cover} large /></div>
                <div tw="sm:hidden"><BookCover cover={p.cover} /></div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Para quem é indicado / O que você vai encontrar */}
      <Section tone="cream">
        <Container tw="grid gap-12 lg:grid-cols-2">
          <div tw="flex flex-col gap-5">
            <Eyebrow>Para quem é indicado</Eyebrow>
            <Title>É para você se…</Title>
            <ul tw="flex flex-col gap-3">
              {p.forWho.map((t) => (
                <li key={t} tw="flex gap-3 rounded-2xl bg-white p-4 font-sans text-[14.5px] leading-relaxed text-ink shadow-card">
                  <Check tw="mt-1 shrink-0 text-sun-500" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div tw="flex flex-col gap-5">
            <Eyebrow>O que você vai encontrar</Eyebrow>
            <Title>Por dentro {p.kind === 'E-book' ? 'do e-book' : p.kind.startsWith('Checklist') ? 'do checklist' : 'do guia'}</Title>
            <ol tw="flex flex-col divide-y divide-line rounded-2xl bg-white px-5 shadow-card">
              {p.chapters.map((c, i) => (
                <li key={c} tw="flex gap-4 py-4 font-sans text-[14.5px] leading-relaxed text-ink">
                  <span tw="font-serif text-[17px] font-bold text-sun-600 tabular-nums">{String(i + 1).padStart(2, '0')}</span> {c}
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Dúvidas */}
      {p.faq.length > 0 && (
        <Section tone="white">
          <Container tw="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div tw="flex flex-col gap-4">
              <Eyebrow>Dúvidas</Eyebrow>
              <Title>Perguntas frequentes</Title>
            </div>
            <div tw="flex flex-col divide-y divide-line border-y border-line">
              {p.faq.map((item) => (
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
      )}

      {/* Compra (ou inscrição, no material gratuito), repetida no fim da página */}
      <section tw="bg-cream py-16">
        <Container>
          <div tw="grid items-center gap-8 rounded-[24px] bg-pine-800 px-7 py-10 text-white sm:grid-cols-[auto_1fr] sm:px-12" className="group">
            <BookCover cover={p.cover} />
            <div tw="flex flex-col gap-3">
              <p tw="font-sans text-xs font-semibold uppercase tracking-[.16em] text-sun-500">{p.kind}</p>
              <h2 tw="font-serif text-[1.8rem] font-bold leading-tight">{p.title}</h2>
              <div ref={bottom}>
                <BuyBox p={p} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Celular: preço e botão presos no rodapé entre o bloco de compra do topo e o do fim */}
      <div
        aria-hidden={!sticky}
        css={[
          tw`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-white px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(8,38,36,.35)] transition-transform duration-300 md:hidden`,
          sticky ? tw`translate-y-0` : tw`translate-y-full`,
        ]}
      >
        <div tw="min-w-0">
          <p tw="truncate font-sans text-[12px] text-muted">{p.title}</p>
          {p.free ? (
            <p tw="font-serif text-[20px] font-bold leading-tight text-pine-900">Grátis</p>
          ) : p.price ? (
            <p tw="font-serif text-[20px] font-bold leading-tight text-pine-900">{p.price}</p>
          ) : (
            p.guarantee && <p tw="font-sans text-[13px] font-semibold text-pine-800">{p.guarantee}</p>
          )}
        </div>
        <BuyButton p={p} small tabIndex={sticky ? 0 : -1} />
      </div>
    </>
  )
}

function BuyBox({ p }: { p: Page }) {
  return (
    <div tw="flex flex-col gap-3">
      <div tw="flex flex-wrap items-center gap-x-6 gap-y-4">
        {(p.free || p.price) && (
          <p tw="flex flex-col">
            <span tw="font-sans text-[12px] uppercase tracking-[.14em] text-white/70">Valor</span>
            <span tw="font-serif text-[2.4rem] font-bold leading-none text-white">{p.free ? 'Grátis' : p.price}</span>
          </p>
        )}
        <BuyButton p={p} />
      </div>
      <p tw="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[13px] text-white/80">
        {p.guarantee && (
          <span tw="inline-flex items-center gap-1.5 font-medium text-white">
            <Check tw="text-sun-500" /> {p.guarantee}
          </span>
        )}
        <span>{p.free ? 'Sem custo · chega direto no seu e-mail' : 'Pagamento pela Kiwify · acesso pelo seu e-mail'}</span>
      </p>
    </div>
  )
}

function BuyButton({ p, small = false, tabIndex }: { p: Page; small?: boolean; tabIndex?: number }) {
  const style = [
    tw`inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sun-500 font-sans font-semibold text-white no-underline shadow-[0_10px_24px_-10px_rgba(240,122,42,.8)] transition-all duration-200 hover:(-translate-y-0.5 bg-sun-600)`,
    small ? tw`px-5 py-3 text-[14px]` : tw`px-8 py-4 text-[16px]`,
  ]
  if (!p.buy.href)
    // TODO: sem link de compra ainda (ver dúvidas para a Laura)
    return <span css={style}>{p.buy.label} <Arrow /></span>
  return (
    <SmartLink href={p.buy.href} css={style} tabIndex={tabIndex}>
      {p.buy.label} <Arrow />
    </SmartLink>
  )
}

/** A barra fixa aparece depois do bloco de compra do topo e some ao chegar no do fim (assim não cobre o rodapé). */
function useStickyBar(top: RefObject<HTMLElement>, bottom: RefObject<HTMLElement>, deps: unknown) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const update = () => {
      if (!top.current || !bottom.current) return
      setShow(top.current.getBoundingClientRect().bottom < 0 && bottom.current.getBoundingClientRect().top > window.innerHeight)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [top, bottom, deps])
  return show
}
