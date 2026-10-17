import { css } from 'twin.macro'
import { brands } from '../content'
import { Button, Container } from './ui'
import { Arrow, Instagram, Play, Users } from './icons'
import { imgProps } from '../cms/runtime'

const statIcon = { ig: Instagram, play: Play, users: Users } as const

export function Brands() {
  return (
    <section id="marcas" tw="relative overflow-hidden bg-pine-950 py-16 sm:py-20">
      <img {...imgProps(brands.image, { alt: '' })} tw="absolute inset-0 h-full w-full object-cover" css={css`object-position: 60% 50%;`} />
      <div
        aria-hidden="true"
        tw="absolute inset-0"
        css={css`background: linear-gradient(90deg, rgba(8,38,36,.95) 0%, rgba(8,38,36,.82) 45%, rgba(8,38,36,.35) 100%);`}
      />
      <Container tw="relative grid items-center gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div tw="flex flex-col gap-4 text-white">
          <p tw="font-sans text-xs font-semibold uppercase tracking-[.16em] text-white/85">{brands.eyebrow}</p>
          <h2 tw="font-serif text-[2rem] font-bold leading-[1.1] sm:text-[2.4rem] [text-wrap: balance]">{brands.title}</h2>
          <p tw="font-sans text-[14px] leading-relaxed text-white/85">{brands.text}</p>
          {/* No celular: botões empilhados com a mesma largura, como na capa. A partir de sm: lado a lado. */}
          <div tw="mt-2 flex flex-col gap-3 sm:(flex-row flex-wrap)">
            <Button variant="sun" href={brands.cta.href} tw="w-full sm:w-auto">
              {brands.cta.label} <Arrow />
            </Button>
            <Button variant="ghostLight" href={brands.secondary.href} tw="w-full sm:w-auto">
              {brands.secondary.label}
            </Button>
          </div>
        </div>

        <ul tw="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/20">
          {brands.stats.map((s) => {
            const I = statIcon[s.icon as keyof typeof statIcon]
            return (
              <li key={s.label} tw="flex flex-col items-center px-4 text-center text-white">
                <I width={26} height={26} />
                <span tw="mt-3 font-sans text-[30px] font-bold leading-none tabular-nums">{s.value}</span>
                <span tw="mt-2 font-sans text-[13px] text-white/80">{s.label}</span>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
