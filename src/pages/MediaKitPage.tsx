import { useState } from 'react'
import tw from 'twin.macro'
import { mediaKit as kit } from '../pagesContent'
import { links } from '../content'
import { Button, Container, Eyebrow, Lead, PageHero, Section, Title } from '../components/ui'
import { Arrow, Check, Copy, Instagram, Mail, TikTok, YouTube } from '../components/icons'

export function MediaKitPage() {
  return (
    <>
      <PageHero {...kit.hero} />

      {/* Números */}
      <section tw="relative z-10 -mt-10">
        <Container>
          <ul tw="grid grid-cols-2 overflow-hidden rounded-[20px] bg-white shadow-lift lg:grid-cols-4">
            {kit.stats.map((s, i) => (
              <li
                key={s.label}
                css={[
                  tw`flex flex-col gap-1 p-6 sm:p-8`,
                  i % 2 === 1 && tw`border-l border-line`,
                  i >= 2 && tw`border-t border-line lg:border-t-0`,
                  i === 2 && tw`lg:border-l`,
                ]}
              >
                <span tw="font-serif text-[2.2rem] font-bold leading-none text-pine-800 tabular-nums sm:text-[2.6rem]">{s.value}</span>
                <span tw="mt-1 font-sans text-[13px] font-medium text-ink">{s.label}</span>
                <span tw="font-sans text-[12px] text-muted">{s.note}</span>
              </li>
            ))}
          </ul>
          <p tw="mt-3 text-right font-sans text-[12px] text-muted">{kit.updated}</p>
        </Container>
      </section>

      {/* Quem é */}
      <Section tone="cream">
        <Container tw="grid items-center gap-12 lg:grid-cols-[auto_1fr]">
          <figure tw="relative mx-auto w-[260px] rotate-[-3deg] bg-white p-3 pb-14 shadow-lift">
            <span aria-hidden="true" tw="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-3 bg-[#E9DFC9]/90" />
            <img src={kit.about.image} alt="Laura Irigoyen em Sydney" tw="aspect-[4/5] w-full object-cover" />
            <figcaption tw="absolute bottom-3 right-4 font-script text-[22px] text-pine-900">Laura Irigoyen</figcaption>
          </figure>
          <div tw="flex flex-col gap-5">
            <Eyebrow>Sobre</Eyebrow>
            <Title>{kit.about.title}</Title>
            {kit.about.paragraphs.map((p) => (
              <Lead key={p.slice(0, 16)}>{p}</Lead>
            ))}
            <div tw="mt-2 grid gap-4 sm:grid-cols-3">
              {kit.audience.map((a) => (
                <div key={a.title} tw="rounded-[16px] bg-white p-5 shadow-card">
                  <h3 tw="font-sans text-[14px] font-semibold text-pine-900">{a.title}</h3>
                  <p tw="mt-2 font-sans text-[13px] leading-relaxed text-muted">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Audiência em números (aparece só quando houver dados) */}
      <AudienceData />

      {/* Pilares */}
      <Section tone="mist">
        <Container tw="flex flex-col gap-8">
          <div tw="flex max-w-[560px] flex-col gap-3">
            <Eyebrow>Conteúdo</Eyebrow>
            <Title>Os três pilares do canal</Title>
          </div>
          <div tw="grid gap-5 md:grid-cols-3">
            {kit.pillars.map((p) => (
              <article key={p.title} className="group" tw="overflow-hidden rounded-[18px] bg-white shadow-card">
                <div tw="aspect-[16/10] overflow-hidden">
                  <img src={p.image} alt="" tw="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div tw="p-5">
                  <h3 tw="font-serif text-[20px] font-bold text-ink">{p.title}</h3>
                  <p tw="mt-2 font-sans text-[13.5px] leading-relaxed text-muted">{p.text}</p>
                  <p tw="mt-4 border-t border-line pt-4 font-sans text-[13px] leading-relaxed text-ink">
                    <strong tw="font-semibold text-sun-600">Para marcas de:</strong> {p.brands}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Formatos em 3 grupos + marcas que combinam */}
      <Section tone="cream">
        <Container tw="flex flex-col gap-8">
          <div tw="flex flex-col gap-3">
            <Eyebrow>Formatos</Eyebrow>
            <Title>Como podemos trabalhar juntos</Title>
          </div>
          <div tw="grid gap-5 lg:grid-cols-3">
            {kit.formatGroups.map((g) => (
              <article key={g.title} tw="flex flex-col rounded-[18px] border border-line bg-white p-6">
                <h3 tw="font-serif text-[20px] font-bold leading-snug text-pine-900">{g.title}</h3>
                <p tw="mt-2 font-sans text-[13.5px] leading-relaxed text-muted">{g.text}</p>
                <ul tw="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                  {g.items.map((item) => (
                    <li key={item} tw="flex items-start gap-3 font-sans text-[14px] leading-snug text-ink">
                      <span tw="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun-500/10 text-sun-600"><Check width={14} height={14} /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <aside tw="flex flex-col gap-4 rounded-[20px] bg-pine-800 p-7 text-white shadow-lift lg:flex-row lg:items-center lg:gap-8">
            <div tw="shrink-0">
              <p tw="font-script text-[26px] leading-none text-sun-500">Combina com</p>
              <h2 tw="mt-2 font-serif text-[22px] font-bold lg:max-w-[300px]">Marcas de viagem, dinheiro e trabalho remoto</h2>
            </div>
            <ul tw="flex flex-wrap gap-2">
              {kit.fits.map((f) => (
                <li key={f} tw="rounded-full bg-white/10 px-3 py-1.5 font-sans text-[12.5px] text-white/90">{f}</li>
              ))}
            </ul>
          </aside>
        </Container>
      </Section>

      {/* Processo */}
      <Section tone="white">
        <Container tw="flex flex-col gap-10">
          <div tw="flex flex-col gap-3">
            <Eyebrow>Processo</Eyebrow>
            <Title>Do primeiro contato ao relatório</Title>
          </div>
          <ol tw="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kit.steps.map((s, i) => (
              <li key={s.title} tw="relative flex flex-col gap-2">
                <span tw="flex items-center gap-3">
                  <span tw="grid h-10 w-10 place-items-center rounded-full bg-pine-800 font-serif text-[16px] font-bold text-white">{i + 1}</span>
                  {i < kit.steps.length - 1 && <span aria-hidden="true" tw="hidden h-px flex-1 border-t-2 border-dashed border-line lg:block" />}
                </span>
                <h3 tw="mt-2 font-sans text-[15px] font-semibold text-pine-900">{s.title}</h3>
                <p tw="font-sans text-[13px] leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Contact />
    </>
  )
}

function AudienceData() {
  const groups = kit.audienceData.filter((g) => g.items.length > 0)
  if (groups.length === 0) return null
  return (
    <Section tone="white">
      <Container tw="flex flex-col gap-8">
        <div tw="flex flex-col gap-3">
          <Eyebrow>Audiência</Eyebrow>
          <Title>Quem assiste ao meu conteúdo</Title>
        </div>
        <div tw="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} tw="overflow-hidden rounded-[20px] bg-white shadow-lift">
              <h3 tw="border-b border-line px-6 py-4 font-sans text-[12px] font-semibold uppercase tracking-[.14em] text-pine-800">{g.title}</h3>
              <ul tw="grid grid-cols-2">
                {g.items.map((it, i) => (
                  <li
                    key={it.label}
                    css={[tw`flex flex-col gap-1 p-6`, i % 2 === 1 && tw`border-l border-line`, i >= 2 && tw`border-t border-line`]}
                  >
                    <span tw="font-serif text-[1.9rem] font-bold leading-none text-pine-800 tabular-nums">{it.value}</span>
                    <span tw="mt-1 font-sans text-[13px] font-medium text-ink">{it.label}</span>
                    {it.note && <span tw="font-sans text-[12px] text-muted">{it.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(kit.contact.email)
    } catch {
      /* o e-mail continua selecionável na tela */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <section tw="relative overflow-hidden bg-pine-950 py-16 sm:py-20">
      <img src={import.meta.env.BASE_URL + 'images/hero.jpg'} alt="" tw="absolute inset-0 h-full w-full object-cover opacity-30" />
      <Container tw="relative flex flex-col items-center gap-5 text-center text-white">
        <Mail width={32} height={32} />
        <h2 tw="font-serif text-[2.2rem] font-bold leading-tight sm:text-[2.6rem]">{kit.contact.title}</h2>
        <p tw="max-w-[460px] font-sans text-[15px] text-white/85">{kit.contact.text}</p>
        <div tw="mt-2 flex flex-wrap items-center justify-center gap-3">
          <span tw="select-all rounded-full bg-white/10 px-5 py-3 font-sans text-[15px] font-medium">{kit.contact.email}</span>
          <button type="button" onClick={copy} tw="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/70 px-5 py-3 font-sans text-[13px] font-semibold transition hover:(bg-white text-pine-900)">
            {copied ? <Check /> : <Copy />} {copied ? 'Copiado!' : 'Copiar e-mail'}
          </button>
          <Button variant="sun" href={kit.contact.cta.href}>
            {kit.contact.cta.label} <Arrow />
          </Button>
        </div>
        <div tw="mt-4 flex gap-3">
          {[
            { label: 'Instagram', href: links.instagram, I: Instagram },
            { label: 'YouTube', href: links.youtube, I: YouTube },
            { label: 'TikTok', href: links.tiktok, I: TikTok },
          ].map(({ label, href, I }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} tw="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-sun-500">
              <I />
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}

