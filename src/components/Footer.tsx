import 'twin.macro'
import { useState, type FormEvent } from 'react'
import { footer, links, nav } from '../content'
import { Container, Logo, PlaneTrail, SmartLink } from './ui'
import { Arrow, Instagram, TikTok, YouTube } from './icons'

const socials = [
  { label: 'YouTube', href: links.youtube, Icon: YouTube },
  { label: 'Instagram', href: links.instagram, Icon: Instagram },
  { label: 'TikTok', href: links.tiktok, Icon: TikTok },
]

export function Footer() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true) // TODO: integrar à lista de e-mails da Laura
  }
  return (
    <footer tw="bg-pine-950 pt-14 pb-8 text-white">
      <Container tw="flex flex-col gap-10">
        <div tw="flex flex-wrap items-start justify-between gap-10">
          <div tw="flex max-w-[280px] flex-col gap-4">
            <Logo />
            <p tw="font-sans text-[13px] leading-relaxed text-white/70">{footer.tagline}</p>
            <div tw="flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} tw="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-sun-500">
                  <Icon width={18} height={18} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Rodapé">
            <ul tw="grid grid-cols-2 gap-x-10 gap-y-2.5">
              {nav.map((n) => (
                <li key={n.href}>
                  <SmartLink href={n.href} tw="font-sans text-[13px] text-white/75 no-underline hover:text-white">{n.label}</SmartLink>
                </li>
              ))}
            </ul>
          </nav>

          <div tw="w-full max-w-[340px]">
            <p tw="font-sans text-[13px] font-semibold">{footer.newsletter}</p>
            {sent ? (
              <p tw="mt-3 font-sans text-[13px] text-white/80">Obrigada! Logo chega novidade aí.</p>
            ) : (
              <form onSubmit={submit} tw="mt-3 flex items-center rounded-full bg-white p-1 pl-4">
                <label htmlFor="footer-email" tw="sr-only">Seu e-mail</label>
                <input id="footer-email" type="email" required placeholder="Seu e-mail" tw="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none" />
                <button type="submit" aria-label="Inscrever" tw="grid h-9 w-9 place-items-center rounded-full bg-pine-800 text-white hover:bg-sun-500">
                  <Arrow />
                </button>
              </form>
            )}
            <p tw="mt-4 font-sans text-[12px] text-white/60">
              Contato comercial: <span tw="text-white/85 select-all">{links.email}</span>
            </p>
          </div>
        </div>

        <div tw="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-sans text-[12px] text-white/55">
          <span>© {new Date().getFullYear()} Turista Life · Laura Irigoyen. Todos os direitos reservados.</span>
          <span tw="inline-flex items-center gap-2">
            Explorar o mundo é viver melhor. <PlaneTrail tw="w-12 text-white/70" />
          </span>
        </div>
      </Container>
    </footer>
  )
}
