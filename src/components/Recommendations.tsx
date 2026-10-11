import { useState } from 'react'
import tw from 'twin.macro'
import { recommendations } from '../content'
import { Button, Container, Eyebrow, Lead, Section, Title } from './ui'
import { Arrow, Check, Copy, RecIcon } from './icons'

export function CouponButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* sem permissão de clipboard: o cupom continua visível para copiar manualmente */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar cupom ${code}`}
      tw="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-sun-500 bg-sun-500/5 px-2.5 py-1.5 font-sans text-[11px] font-semibold tracking-wider text-sun-600 transition hover:bg-sun-500/10"
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copiado!' : code}
    </button>
  )
}

export function Recommendations() {
  return (
    <Section id="recomendacoes" tone="cream">
      <Container tw="grid gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-center">
        <div tw="flex flex-col gap-4">
          <Eyebrow>{recommendations.eyebrow}</Eyebrow>
          <Title>{recommendations.title}</Title>
          <Lead>{recommendations.text}</Lead>
          <Button variant="pine" href="/recomendacoes" tw="self-start">
            Ver todas as recomendações <Arrow />
          </Button>
        </div>

        <ul tw="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recommendations.items.map((r) => {
            const I = RecIcon[r.icon]
            return (
              <li key={r.title} tw="flex flex-col items-center rounded-[16px] border border-line bg-white p-5 text-center transition duration-300 hover:(-translate-y-1 border-transparent shadow-lift)">
                <span tw="grid h-12 w-12 place-items-center rounded-full bg-pine-800 text-white">
                  <I />
                </span>
                <h3 tw="mt-3 font-sans text-[14px] font-semibold text-pine-900">{r.title}</h3>
                <p tw="mt-1.5 font-sans text-[12.5px] leading-relaxed text-muted">{r.text}</p>
                <div tw="mt-auto flex flex-wrap items-center justify-center gap-3 pt-4">
                  {r.coupon && <CouponButton code={r.coupon} />}
                  <a href={r.href} target="_blank" rel="noreferrer sponsored" tw="inline-flex items-center gap-1 font-sans text-[12.5px] font-semibold text-pine-800 no-underline hover:text-sun-600">
                    {r.cta} <Arrow width={14} height={14} />
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}

