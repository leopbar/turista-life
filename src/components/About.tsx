import tw from 'twin.macro'
import { about, journey } from '../content'
import { Button, Container, Eyebrow, Lead, LiveDot, Section, SmartLink, Title } from './ui'
import { Arrow, Mountain } from './icons'

export function About() {
  return (
    <Section id="sobre" tone="cream">
      <Container tw="grid items-center gap-12 lg:grid-cols-[1fr_auto_1.15fr] lg:gap-10">
        <div tw="flex flex-col gap-5">
          <Eyebrow>{about.eyebrow}</Eyebrow>
          <Title>{about.title}</Title>
          {about.paragraphs.map((p) => (
            <Lead key={p.slice(0, 12)}>{p}</Lead>
          ))}
          <Button variant="outline" href={about.cta.href} target="_blank" rel="noreferrer" tw="self-start">
            {about.cta.label} <Arrow />
          </Button>
        </div>

        <figure tw="relative mx-auto w-[240px] rotate-[-4deg] bg-white p-3 pb-16 shadow-lift transition-transform duration-500 hover:rotate-0">
          <span aria-hidden="true" tw="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-3 bg-[#E9DFC9]/90" />
          <img src={about.polaroid.image} alt="Laura em Sydney, na Austrália" tw="aspect-[4/5] w-full object-cover" />
          <figcaption tw="absolute right-4 bottom-3 rotate-[-4deg] text-right font-script text-[22px] leading-tight text-pine-900">
            {about.polaroid.caption.map((l) => (
              <span key={l} tw="block">{l}</span>
            ))}
          </figcaption>
        </figure>

        <JourneyCard />
      </Container>
    </Section>
  )
}

function JourneyCard() {
  return (
    <article tw="relative overflow-hidden rounded-[20px] bg-pine-800 p-7 text-white shadow-lift sm:p-8">
      <Mountain tw="absolute top-6 right-6 text-white/90" />
      <p tw="font-sans text-[11px] font-semibold uppercase tracking-[.16em] text-white/80">{journey.eyebrow}</p>
      <h3 tw="mt-3 pr-12 font-serif text-[24px] font-bold uppercase leading-tight tracking-[.02em] sm:text-[28px]">{journey.title}</h3>

      <ol tw="mt-6 flex items-center" aria-label="Rota da viagem">
        {journey.stops.map((stop, i) => {
          const done = i < journey.current
          const current = i === journey.current
          return (
            <li key={stop} tw="relative flex flex-1 flex-col items-start last:flex-none">
              <span tw="flex w-full items-center">
                {current ? (
                  <span tw="relative z-10"><LiveDot size={10} /></span>
                ) : (
                  <span css={[tw`relative z-10 h-2.5 w-2.5 shrink-0 rounded-full`, done ? tw`bg-white` : tw`bg-white/40`]} />
                )}
                {i < journey.stops.length - 1 && (
                  <span css={[tw`h-[2px] flex-1`, done ? tw`bg-sun-500` : tw`bg-white/25`]} />
                )}
              </span>
              <span css={[tw`mt-2 font-sans text-[11px]`, current ? tw`font-semibold text-white` : tw`text-white/70`]}>{stop}</span>
            </li>
          )
        })}
      </ol>

      <p tw="mt-5 max-w-[420px] font-sans text-[14px] leading-relaxed text-white/85">{journey.text}</p>

      <SmartLink
        href={journey.cta.href}
        tw="mt-6 inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/70 px-5 py-2.5 font-sans text-[13px] font-semibold text-white no-underline transition hover:(bg-white text-pine-900)"
      >
        {journey.cta.label} <Arrow />
      </SmartLink>
    </article>
  )
}
