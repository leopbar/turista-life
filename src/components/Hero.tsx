import tw, { css } from 'twin.macro'
import { hero } from '../content'
import { Button, Container, PlaneTrail, SmartLink } from './ui'
import { Play } from './icons'
import { imgProps, t } from '../cms/runtime'

const rise = (delay: number) => css`animation: rise .8s ${delay}s cubic-bezier(.2,.7,.1,1) both;
  @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { animation: none; }`

export function Hero() {
  return (
    // Até lg (1023px): foto em faixa própria no topo (340px) e o texto abaixo, para o texto não cobrir o rosto da Laura.
    // A partir de lg: foto de fundo com o texto à esquerda.
    <section id="inicio" tw="relative overflow-hidden bg-pine-950 pb-12 lg:(flex min-h-[680px] items-center pt-24 pb-16)">
      <img
        {...imgProps(hero.image, { alt: t('inicio.capa.foto', 'Laura sorrindo no mirante da Diamond Beach, em Nusa Penida, com o mar turquesa ao fundo') })}
        tw="relative block h-[340px] w-full object-cover lg:(absolute inset-0 h-full)"
        css={css`object-position: 70% 35%;
          @media (min-width: 1024px) { object-position: 70% 40%; animation: heroZoom 18s ease-out both; }
          @keyframes heroZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
          @media (prefers-reduced-motion: reduce) { animation: none; }`}
      />
      <div
        aria-hidden="true"
        tw="absolute inset-x-0 top-0 h-[340px] lg:(inset-0 h-auto)"
        css={css`background: linear-gradient(180deg, rgba(8,38,36,.55) 0%, transparent 30%);
          @media (min-width: 1024px) { background:
            linear-gradient(90deg, rgba(8,38,36,.88) 0%, rgba(8,38,36,.55) 42%, rgba(8,38,36,.05) 75%),
            linear-gradient(180deg, rgba(8,38,36,.55) 0%, transparent 25%, transparent 80%, rgba(8,38,36,.4) 100%); }`}
      />

      <Container tw="relative pt-8 lg:pt-0">
        <div tw="max-w-[560px]">
          <h1 tw="font-script text-[52px] leading-[1.02] text-white [text-wrap: balance] sm:text-[64px]" css={rise(0.1)}>
            {hero.title}
          </h1>
          <p tw="mt-4 font-sans text-xl font-semibold leading-snug text-white [text-wrap: balance] sm:text-2xl" css={rise(0.22)}>
            {hero.subtitle}
          </p>
          <p tw="mt-5 max-w-[480px] font-sans text-[15px] leading-relaxed text-white/90">{hero.text}</p>
          {/* No celular: dois botões empilhados com a mesma largura. A partir de sm: botão + link lado a lado. */}
          <div tw="mt-8 flex flex-col gap-3 sm:(flex-row flex-wrap items-center gap-x-6 gap-y-4)">
            <Button variant="sun" href={hero.cta.href} tw="w-full sm:w-auto">
              {hero.cta.label}
            </Button>
            <SmartLink
              href={hero.story.href}
              tw="inline-flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-white/70 h-11 px-6 font-sans text-sm font-semibold text-white/90 no-underline transition-colors hover:(bg-white/10 text-white) sm:(h-auto w-auto justify-start rounded-none border-0 p-0 hover:bg-transparent)"
            >
              <span tw="grid place-items-center sm:(h-7 w-7 rounded-full border-[1.5px] border-white/70)">
                <Play width={12} height={12} />
              </span>
              {hero.story.label}
            </SmartLink>
          </div>
        </div>
      </Container>

      <div tw="absolute right-6 bottom-10 hidden text-white lg:(block right-14)" aria-hidden="true">
        <p tw="font-script text-[32px] leading-[1.05] -rotate-6">
          {hero.signature.map((l, i) => (
            <span key={l} tw="block" css={css`padding-left: ${i * 18}px;`}>{l}</span>
          ))}
        </p>
        <PlaneTrail tw="mt-1 ml-10 w-24 -rotate-12 text-white/90" />
      </div>
    </section>
  )
}
