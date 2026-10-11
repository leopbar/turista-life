import tw, { css } from 'twin.macro'
import { hero } from '../content'
import { Button, Container, PlaneTrail } from './ui'
import { Play } from './icons'

export function Hero() {
  return (
    <section id="inicio" tw="relative flex min-h-[620px] items-center overflow-hidden bg-pine-950 pt-24 pb-16 sm:min-h-[680px]">
      <img
        src={hero.image}
        alt="Broken Beach, em Nusa Penida, gravada pela Laura na viagem por Bali"
        tw="absolute inset-0 h-full w-full object-cover"
        css={css`object-position: 70% 40%; animation: heroZoom 18s ease-out both;
          @keyframes heroZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
          @media (prefers-reduced-motion: reduce) { animation: none; }`}
      />
      <div
        aria-hidden="true"
        tw="absolute inset-0"
        css={css`background:
          linear-gradient(90deg, rgba(8,38,36,.88) 0%, rgba(8,38,36,.55) 42%, rgba(8,38,36,.05) 75%),
          linear-gradient(180deg, rgba(8,38,36,.55) 0%, transparent 25%, transparent 80%, rgba(8,38,36,.4) 100%);`}
      />

      <Container tw="relative">
        <div tw="max-w-[560px]">
          <h1 tw="font-script text-white [text-wrap: balance]">
            {hero.titleLines.map((line, i) => (
              <span
                key={line}
                css={[
                  tw`block leading-[1.02]`,
                  i === 0 ? tw`text-[52px] sm:text-[64px]` : tw`text-[44px] sm:text-[58px]`,
                  css`animation: rise .8s ${0.1 + i * 0.12}s cubic-bezier(.2,.7,.1,1) both;
                    @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
                    @media (prefers-reduced-motion: reduce) { animation: none; }`,
                ]}
              >
                {line}
              </span>
            ))}
          </h1>
          <p tw="mt-6 max-w-[480px] font-sans text-[15px] leading-relaxed text-white/90">{hero.text}</p>
          <Button variant="sun" href={hero.cta.href} target="_blank" rel="noreferrer" tw="mt-8 pl-3">
            <span tw="grid h-7 w-7 place-items-center rounded-full bg-white text-sun-500">
              <Play width={14} height={14} />
            </span>
            {hero.cta.label}
          </Button>
        </div>
      </Container>

      <div tw="absolute right-6 bottom-10 hidden text-white md:block lg:right-14" aria-hidden="true">
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
