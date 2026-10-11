import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import tw, { styled } from 'twin.macro'

/** Rotas internas ("/produtos", "/#sobre") usam o router; o resto abre em nova aba. */
export const SmartLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>(
  ({ href, ...rest }, ref) => {
    if (href.startsWith('/')) return <Link ref={ref} to={href} {...rest} />
    const external = href.startsWith('http')
    return <a ref={ref} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest} />
  },
)

export const Container = tw.div`mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8`

export const Eyebrow = tw.p`font-sans text-xs font-semibold uppercase tracking-[.16em] text-pine-800`

export const Title = tw.h2`font-serif text-[2rem] leading-[1.1] font-bold text-ink sm:text-[2.5rem] [text-wrap: balance]`

export const Lead = tw.p`font-sans text-[15px] leading-relaxed text-muted`

type ButtonProps = { variant?: 'sun' | 'pine' | 'outline' | 'ghostLight' }

export const Button = styled(SmartLink, { shouldForwardProp: (p) => p !== 'variant' })<ButtonProps>(({ variant = 'pine' }) => [
  tw`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-semibold transition-all duration-200 no-underline`,
  tw`focus-visible:(outline-none ring-2 ring-offset-2 ring-sun-500)`,
  tw`hover:(-translate-y-0.5) active:(translate-y-0)`,
  variant === 'sun' && tw`bg-sun-500 text-white shadow-[0_10px_24px_-10px_rgba(240,122,42,.8)] hover:bg-sun-600`,
  variant === 'pine' && tw`bg-pine-800 text-white hover:bg-pine-700`,
  variant === 'outline' && tw`border-[1.5px] border-pine-800 text-pine-800 hover:(bg-pine-800 text-white)`,
  variant === 'ghostLight' && tw`border-[1.5px] border-white/70 text-white hover:(bg-white text-pine-900)`,
])

export const Section = styled.section<{ tone?: 'cream' | 'mist' | 'white' }>(({ tone = 'cream' }) => [
  tw`py-16 sm:py-20`,
  tone === 'cream' && tw`bg-cream`,
  tone === 'mist' && tw`bg-mist`,
  tone === 'white' && tw`bg-white`,
])

/** Avião com rastro pontilhado, assinatura visual da marca. */
export const PlaneTrail = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 48" fill="none" aria-hidden="true">
    <path d="M4 40c18 6 46 4 70-10" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 5" strokeLinecap="round" />
    <path d="M86 10l26-8-10 24-6-8-10-8z" fill="currentColor" />
    <path d="M96 18l16-16" stroke="currentColor" strokeWidth="1.4" opacity=".6" />
  </svg>
)

export const Logo = ({ light = true }: { light?: boolean }) => (
  <Link to="/" css={[tw`relative inline-flex items-end gap-1 no-underline`, light ? tw`text-white` : tw`text-pine-900`]} aria-label="Turista Life, início">
    <span tw="whitespace-nowrap font-script text-[34px] leading-none">Turista Life</span>
    <PlaneTrail tw="-ml-1 mb-3 w-12 self-start" />
  </Link>
)

/** Topo das páginas internas: foto da Laura, migalhas e título. */
export function PageHero({ eyebrow, title, script, text, image, position = '50% 50%' }: {
  eyebrow: string; title: string; script?: string; text: string; image: string; position?: string
}) {
  return (
    <section tw="relative overflow-hidden bg-pine-950 pt-32 pb-16 sm:pt-40 sm:pb-20">
      <img src={image} alt="" tw="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      <div
        aria-hidden="true"
        tw="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(8,38,36,.92) 0%, rgba(8,38,36,.7) 50%, rgba(8,38,36,.3) 100%)' }}
      />
      <Container tw="relative text-white">
        <nav aria-label="Você está em" tw="font-sans text-[12px] text-white/70">
          <Link to="/" tw="text-white/70 no-underline hover:text-white">Início</Link>
          <span aria-hidden="true" tw="mx-2">/</span>
          <span tw="text-white">{eyebrow}</span>
        </nav>
        {script && <p tw="mt-6 font-script text-[30px] leading-none text-sun-500 sm:text-[36px]">{script}</p>}
        <h1 css={[tw`max-w-[640px] font-serif text-[2.4rem] font-bold leading-[1.08] sm:text-[3.2rem] [text-wrap: balance]`, script ? tw`mt-2` : tw`mt-6`]}>{title}</h1>
        <p tw="mt-5 max-w-[540px] font-sans text-[15px] leading-relaxed text-white/85">{text}</p>
      </Container>
    </section>
  )
}

/** Chamada final reaproveitada nas páginas internas. */
export function CtaBand({ title, text, cta }: { title: string; text: string; cta: { label: string; href: string } }) {
  return (
    <section tw="bg-cream py-16">
      <Container>
        <div tw="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[24px] bg-pine-800 px-7 py-10 text-white sm:px-12">
          <PlaneTrail tw="absolute -right-4 -top-2 w-40 text-white/10" />
          <div tw="relative max-w-[560px]">
            <h2 tw="font-serif text-[1.8rem] font-bold leading-tight">{title}</h2>
            <p tw="mt-2 font-sans text-[14px] leading-relaxed text-white/80">{text}</p>
          </div>
          <Button variant="sun" href={cta.href} tw="relative">{cta.label}</Button>
        </div>
      </Container>
    </section>
  )
}
