import tw from 'twin.macro'
import { diary, newsletter } from '../content'
import { useNewsletter } from '../newsletter'
import { NewsletterHoneypot } from './NewsletterHoneypot'
import { Button, Container, Eyebrow, Lead, Section, Title } from './ui'
import { Arrow, Check, Mail, Play } from './icons'
import { imgProps, t } from '../cms/runtime'

export function Diary() {
  return (
    <Section id="diario" tone="white">
      <Container tw="grid gap-10 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-stretch">
        <div tw="flex flex-col gap-8">
          <div tw="flex flex-wrap items-end justify-between gap-6">
            <div tw="flex max-w-[520px] flex-col gap-4">
              <Eyebrow>{diary.eyebrow}</Eyebrow>
              <Title>{diary.title}</Title>
              <Lead>{diary.text}</Lead>
            </div>
            <Button variant="outline" href={diary.cta.href} target="_blank" rel="noreferrer">
              {diary.cta.label} <Arrow />
            </Button>
          </div>

        <ul tw="grid gap-5 sm:grid-cols-3">
          {diary.posts.map((p) => (
            <li key={p.title}>
              <a href={p.href} target="_blank" rel="noreferrer" className="group" tw="flex h-full flex-col overflow-hidden rounded-[16px] border border-line bg-white no-underline transition duration-300 hover:(-translate-y-1 shadow-lift)">
                <div tw="relative aspect-[4/3] overflow-hidden">
                  <img {...imgProps(p.image, { alt: '' })} tw="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span tw="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-white/90 text-pine-900 opacity-0 transition group-hover:opacity-100">
                    <Play width={18} height={18} />
                  </span>
                </div>
                <div tw="flex flex-1 flex-col gap-2 p-4">
                  <span tw="font-sans text-[10px] font-semibold uppercase tracking-[.16em] text-sun-600">{p.tag}</span>
                  <h3 tw="font-sans text-[14px] font-semibold leading-snug text-pine-900">{p.title}</h3>
                  <span tw="mt-auto inline-flex items-center gap-1 pt-2 font-sans text-[12px] font-semibold text-pine-800">
                    Assistir <Arrow width={14} height={14} />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
        </div>

        <NewsletterCard />
      </Container>
    </Section>
  )
}

function NewsletterCard() {
  const { status, submit } = useNewsletter()
  const sending = status === 'sending'
  return (
    <aside id="newsletter" tw="flex flex-col rounded-[20px] bg-pine-800 p-7 text-white shadow-lift">
      <p tw="flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[.16em] text-white/85">
        <Mail width={16} height={16} /> {newsletter.eyebrow}
      </p>
      <h3 tw="mt-4 font-serif text-[22px] font-bold leading-snug">{newsletter.title}</h3>
      <ul tw="mt-4 flex flex-col gap-2">
        {newsletter.bullets.map((b) => (
          <li key={b} tw="flex items-start gap-2 font-sans text-[13px] text-white/90">
            <Check tw="mt-0.5 shrink-0 text-sun-500" /> {b}
          </li>
        ))}
      </ul>
      {status === 'done' ? (
        <p role="status" tw="mt-6 rounded-xl bg-white/10 p-4 font-sans text-[13px]">{newsletter.sent}</p>
      ) : (
        <form onSubmit={submit} tw="mt-6 flex flex-col gap-3">
          <label htmlFor="newsletter-email" tw="sr-only">{t('geral.email.rotulo', 'Seu e-mail')}</label>
          <input id="newsletter-email" name="email" type="email" required placeholder={t('geral.email.rotulo', 'Seu e-mail')} autoComplete="email" aria-describedby="newsletter-feedback" tw="rounded-full border border-white/30 bg-white/10 px-4 py-2.5 font-sans text-[13px] text-white placeholder:text-white/60 focus:(outline-none border-white)" />
          <NewsletterHoneypot />
          <button type="submit" disabled={sending} tw="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/80 px-5 py-2.5 font-sans text-[13px] font-semibold text-white transition hover:(bg-white text-pine-900) disabled:(cursor-wait opacity-70)">
            <Mail width={18} height={18} /> {sending ? newsletter.sending : newsletter.cta}
          </button>
          <p id="newsletter-feedback" role="status" tw="font-sans text-[12px] text-white/70">
            {status === 'invalid' ? <span tw="text-sun-500">{newsletter.invalid}</span>
              : status === 'error' ? <span tw="text-sun-500">{newsletter.error}</span>
              : newsletter.privacy}
          </p>
        </form>
      )}
    </aside>
  )
}

