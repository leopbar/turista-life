import { useEffect, useState, type FormEvent } from 'react'
import tw, { css } from 'twin.macro'
import {
  GOAL, allStops, countries, diaryPage as page, videoCount, ytThumb, ytUrl,
  type Country, type Milestone, type Stop, type Video,
} from '../diaryContent'
import { Container, LiveDot, PageHero } from '../components/ui'
import { RouteMap } from '../components/RouteMap'
import { Arrow, Check, Close, Pin, Play } from '../components/icons'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function DiaryPage() {
  const days = Math.max(1, Math.floor((Date.now() - new Date(page.startDate).getTime()) / 86_400_000))
  const active = useActiveCountry()

  return (
    <>
      <PageHero {...page.hero} position="50% 60%" />

      {/* Números da viagem */}
      <section tw="relative z-10 -mt-10">
        <Container>
          <ul tw="grid grid-cols-2 overflow-hidden rounded-[20px] bg-white shadow-lift sm:grid-cols-4">
            {[
              { value: days, label: 'dias na estrada' },
              { value: countries.length, label: 'países' },
              { value: allStops.length, label: 'cidades' },
              { value: videoCount, label: 'vídeos no canal' },
            ].map((s, i) => (
              <li key={s.label} css={[tw`flex flex-col gap-1 p-5 sm:p-7`, i > 0 && tw`sm:border-l sm:border-line`, i % 2 === 1 && tw`border-l border-line`, i >= 2 && tw`border-t border-line sm:border-t-0`]}>
                <span tw="font-serif text-[2.2rem] font-bold leading-none text-pine-800 tabular-nums">{s.value}</span>
                <span tw="font-sans text-[13px] text-muted">{s.label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Mapa */}
      <section tw="bg-cream pt-16 pb-6">
        <Container tw="grid items-center gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div tw="flex flex-col gap-4">
            <p tw="font-sans text-xs font-semibold uppercase tracking-[.16em] text-pine-800">A rota</p>
            <h2 tw="font-serif text-[2rem] font-bold leading-tight text-ink">Por onde eu já passei</h2>
            <p tw="font-sans text-[15px] leading-relaxed text-muted">
              Clique numa parada para ir direto ao capítulo. A luz verde mostra onde eu estou agora.
            </p>
            <ol tw="mt-2 flex flex-col gap-2">
              {countries.map((c) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} tw="flex items-center justify-between rounded-xl bg-white px-4 py-3 font-sans text-[14px] text-pine-900 no-underline ring-1 ring-line transition hover:ring-pine-800">
                    <span tw="font-semibold">{c.name}</span>
                    <span tw="text-[12px] text-muted">{c.period}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <RouteMap />
        </Container>
      </section>

      {/* Navegação por país */}
      <nav aria-label="Países" tw="sticky top-20 z-30 border-y border-line bg-cream/95 backdrop-blur-md">
        <Container tw="flex gap-2 overflow-x-auto py-3 [scrollbar-width: none]">
          <a href="#partida" css={[chip, active === 'partida' && chipOn]}>Partida</a>
          {countries.map((c) => (
            <a key={c.id} href={`#${c.id}`} css={[chip, active === c.id && chipOn]}>{c.name}</a>
          ))}
          <a href="#proximo" css={[chip, active === 'proximo' && chipOn]}>Próximo destino</a>
        </Container>
      </nav>

      {/* Linha do tempo */}
      <section tw="bg-cream pt-12 pb-20">
        <Container>
          <div tw="relative">
            <span aria-hidden="true" tw="absolute top-2 bottom-2 left-[15px] w-[2px] lg:left-[191px]" css={css`background: repeating-linear-gradient(180deg, #155450 0 8px, transparent 8px 16px);`} />
            <Departure />
            {countries.map((c) => (
              <CountryBlock key={c.id} country={c} />
            ))}
            <NextDestination />
          </div>
        </Container>
      </section>
    </>
  )
}

const chip = tw`shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 font-sans text-[13px] font-medium text-pine-900 no-underline ring-1 ring-line transition hover:ring-pine-800`
const chipOn = tw`bg-pine-800 text-white ring-pine-800`

/** Destaca no menu o país que está na tela. */
function useActiveCountry() {
  const [active, setActive] = useState('partida')
  useEffect(() => {
    const ids = ['partida', ...countries.map((c) => c.id), 'proximo']
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.id)
      },
      { rootMargin: '-160px 0px -55% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

/* ------------------------------------------------------------------ */
/* Peças da linha do tempo                                             */
/* ------------------------------------------------------------------ */

function Rail({ label, sub, node = 'dot', children }: { label?: string; sub?: string; node?: 'dot' | 'flag' | 'money' | 'now'; children: React.ReactNode }) {
  return (
    <div tw="relative grid gap-4 pb-10 pl-12 lg:grid-cols-[150px_1fr] lg:gap-14 lg:pl-0">
      <div tw="hidden pt-5 text-right lg:block">
        {label && <p tw="font-sans text-[13px] font-semibold text-pine-900">{label}</p>}
        {sub && <p tw="mt-0.5 font-sans text-[12px] text-muted">{sub}</p>}
      </div>
      <span
        aria-hidden="true"
        css={[
          tw`absolute top-5 left-[7px] grid h-[18px] w-[18px] place-items-center rounded-full ring-4 ring-cream lg:left-[183px]`,
          node === 'dot' && tw`bg-pine-800`,
          node === 'flag' && tw`h-[26px] w-[26px] -translate-x-1 bg-sun-500 lg:-translate-x-1`,
          node === 'money' && tw`bg-white ring-pine-800 ring-[3px]`,
          node === 'now' && tw`bg-live-400 shadow-[0_0_10px_3px_rgba(74,222,128,.7)]`,
        ]}
      >
        {node === 'now' && <span tw="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-400 opacity-70" />}
      </span>
      <div tw="min-w-0">
        {(label || sub) && (
          <p tw="mb-2 font-sans text-[12px] font-semibold uppercase tracking-[.12em] text-pine-700 lg:hidden">
            {label}{sub ? ` · ${sub}` : ''}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

function Departure() {
  const d = page.departure
  return (
    <div id="partida" tw="scroll-mt-40">
      <Rail label={d.period} sub="Início" node="flag">
        <article tw="grid overflow-hidden rounded-[20px] bg-white shadow-card md:grid-cols-[240px_1fr]">
          <img src={d.image} alt="Laura em Sydney com a Opera House ao fundo" tw="h-full max-h-[260px] w-full object-cover md:max-h-none" />
          <div tw="flex flex-col gap-3 p-6">
            <p tw="font-script text-[24px] leading-none text-sun-600">{d.title}</p>
            <h2 tw="font-serif text-[1.6rem] font-bold leading-tight text-ink">{d.place}</h2>
            <p tw="font-sans text-[14px] leading-relaxed text-muted">{d.text}</p>
            <VideoLink video={d.video} compact />
          </div>
        </article>
      </Rail>
    </div>
  )
}

function CountryBlock({ country }: { country: Country }) {
  const stops = country.items.filter((i): i is Stop => i.type === 'stop')
  return (
    <div id={country.id} tw="scroll-mt-40">
      <Rail node="flag">
        <header tw="flex flex-wrap items-end justify-between gap-4 rounded-[20px] bg-pine-800 px-6 py-6 text-white sm:px-8">
          <div tw="max-w-[560px]">
            <p tw="font-sans text-[11px] font-semibold uppercase tracking-[.18em] text-white/70">{country.period}</p>
            <h2 tw="mt-1 font-serif text-[2.2rem] font-bold leading-none">{country.name}</h2>
            <p tw="mt-3 font-sans text-[14px] leading-relaxed text-white/85">{country.intro}</p>
          </div>
          <ul tw="flex flex-wrap gap-1.5">
            {stops.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} tw="rounded-full bg-white/10 px-3 py-1.5 font-sans text-[12px] text-white no-underline hover:bg-white/20">
                  {s.city.split(',')[0]}
                </a>
              </li>
            ))}
          </ul>
        </header>
      </Rail>
      {country.items.map((item) =>
        item.type === 'stop' ? <StopCard key={item.id} stop={item} /> : <MilestoneCard key={item.id} m={item} />,
      )}
    </div>
  )
}

function StopCard({ stop }: { stop: Stop }) {
  const [main, ...rest] = stop.images
  const hasReview = stop.pros.length > 0 || stop.cons.length > 0
  return (
    <div id={stop.id} tw="scroll-mt-40">
      <Rail label={stop.period} sub={stop.stay} node={stop.current ? 'now' : 'dot'}>
        <article tw="overflow-hidden rounded-[20px] bg-white shadow-card">
          {main && (
            <div css={[tw`grid gap-1`, rest.length ? tw`sm:grid-cols-[2fr_1fr]` : tw``]}>
              <img src={main.src} alt={main.alt} loading="lazy" css={[tw`w-full object-cover`, rest.length ? tw`aspect-[16/10] sm:aspect-auto sm:h-full` : tw`aspect-[21/9]`]} />
              {rest.length > 0 && (
                <div tw="hidden grid-rows-2 gap-1 sm:grid">
                  {rest.map((img) => (
                    <img key={img.src} src={img.src} alt={img.alt} loading="lazy" tw="h-full w-full object-cover" />
                  ))}
                </div>
              )}
            </div>
          )}

          <div tw="flex flex-col gap-6 p-6 sm:p-8">
            <header tw="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 tw="flex items-center gap-2 font-serif text-[1.7rem] font-bold leading-tight text-ink">
                  <Pin tw="text-sun-500" width={20} height={20} /> {stop.city}
                </h3>
                <p tw="mt-1 font-sans text-[13px] text-muted">{stop.period} · {stop.stay}</p>
              </div>
              {stop.badge && <span tw="rounded-full bg-sun-500/10 px-3 py-1.5 font-sans text-[12px] font-semibold text-sun-600">{stop.badge}</span>}
              {stop.current && (
                <span tw="inline-flex items-center gap-2 rounded-full bg-live-500/10 px-3 py-1.5 font-sans text-[12px] font-semibold text-live-700 ring-1 ring-live-500/30">
                  <LiveDot size={8} /> Estou aqui agora
                </span>
              )}
            </header>

            <p tw="max-w-[640px] font-sans text-[15px] leading-relaxed text-ink">{stop.summary}</p>

            {stop.highlights.length > 0 && (
              <div>
                <h4 tw="font-sans text-[12px] font-semibold uppercase tracking-[.14em] text-pine-800">Pontos-chave</h4>
                <ul tw="mt-3 flex flex-wrap gap-2">
                  {stop.highlights.map((h) => (
                    <li key={h} tw="rounded-full bg-mist px-3 py-1.5 font-sans text-[13px] text-pine-900">{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasReview && (
              <div tw="grid gap-5 md:grid-cols-2">
                <ReviewList title="Pontos fortes" items={stop.pros} good />
                <ReviewList title="Pontos fracos" items={stop.cons} />
              </div>
            )}

            {stop.tip && (
              <aside tw="rounded-xl border-l-0 bg-cream p-4 sm:p-5">
                <p tw="font-script text-[22px] leading-none text-sun-600">Dica da Laura</p>
                <p tw="mt-2 font-sans text-[14px] leading-relaxed text-ink">{stop.tip}</p>
              </aside>
            )}

            {stop.videos.length > 0 ? (
              <div tw="grid gap-3 sm:grid-cols-2">
                {stop.videos.map((v) => (
                  <VideoLink key={v.id} video={v} />
                ))}
              </div>
            ) : stop.current ? (
              <p tw="rounded-xl bg-mist p-4 font-sans text-[13px] text-pine-900">O vídeo daqui sai em breve no canal.</p>
            ) : null}
          </div>
        </article>
      </Rail>
    </div>
  )
}

function ReviewList({ title, items, good = false }: { title: string; items: string[]; good?: boolean }) {
  return (
    <div css={[tw`rounded-xl p-4`, good ? tw`bg-pine-800/5` : tw`bg-sun-500/5`]}>
      <h4 css={[tw`font-sans text-[12px] font-semibold uppercase tracking-[.14em]`, good ? tw`text-pine-800` : tw`text-sun-600`]}>{title}</h4>
      <ul tw="mt-3 flex flex-col gap-2">
        {items.map((t) => (
          <li key={t} tw="flex gap-2 font-sans text-[13.5px] leading-snug text-ink">
            {good ? <Check tw="mt-0.5 shrink-0 text-pine-700" /> : <Close width={16} height={16} tw="mt-0.5 shrink-0 text-sun-500" />}
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MilestoneCard({ m }: { m: Milestone }) {
  const pct = Math.round((m.income / GOAL) * 100)
  return (
    <div id={m.id} tw="scroll-mt-40">
      <Rail label="Fechamento" sub={m.month.split(' · ')[1]} node="money">
        <article tw="relative overflow-hidden rounded-[20px] border-2 border-dashed border-pine-800/25 bg-white p-6 sm:p-8">
          <div tw="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p tw="font-sans text-[11px] font-semibold uppercase tracking-[.18em] text-pine-700">Construindo minha liberdade geográfica</p>
              <h3 tw="mt-1 font-serif text-[1.5rem] font-bold text-ink">{m.month}</h3>
              <p tw="font-sans text-[12px] text-muted">{m.recordedAt}</p>
            </div>
            <div tw="text-right">
              <p tw="font-sans text-[12px] text-muted">Ganhei com a internet</p>
              <p tw="font-serif text-[2.4rem] font-bold leading-none text-pine-800 tabular-nums">{brl(m.income)}</p>
            </div>
          </div>

          <div tw="mt-5">
            <div tw="flex justify-between font-sans text-[12px] text-muted">
              <span>{pct}% da meta</span>
              <span>Meta: {brl(GOAL)}</span>
            </div>
            <div tw="mt-2 h-3 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% da meta de ${brl(GOAL)}`}>
              <div tw="h-full rounded-full bg-sun-500" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>

          <ul tw="mt-5 flex flex-wrap gap-2">
            {m.bullets.map((b) => (
              <li key={b} tw="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 font-sans text-[12.5px] text-pine-900">
                <Check width={14} height={14} tw="text-pine-700" /> {b}
              </li>
            ))}
          </ul>
          {m.spent && <p tw="mt-4 font-sans text-[13px] text-muted">{m.spent}</p>}
          <div tw="mt-5">
            <VideoLink video={m.video} compact />
          </div>
        </article>
      </Rail>
    </div>
  )
}

function VideoLink({ video, compact = false }: { video: Video; compact?: boolean }) {
  return (
    <a
      href={ytUrl(video.id)}
      target="_blank"
      rel="noreferrer"
      className="group"
      css={[
        tw`flex items-center gap-3 rounded-xl border border-line bg-white p-2 pr-4 no-underline transition hover:(border-transparent shadow-lift)`,
        compact && tw`self-start`,
      ]}
    >
      <span tw="relative shrink-0 overflow-hidden rounded-lg">
        <img src={ytThumb(video.id)} alt="" loading="lazy" css={[tw`object-cover`, compact ? tw`h-[54px] w-[96px]` : tw`h-[68px] w-[120px]`]} />
        <span tw="absolute inset-0 grid place-items-center bg-black/25 text-white transition group-hover:bg-black/10">
          <Play width={18} height={18} />
        </span>
        <span tw="absolute right-1 bottom-1 rounded bg-black/75 px-1 font-sans text-[10px] text-white tabular-nums">{video.duration}</span>
      </span>
      <span tw="min-w-0">
        <span tw="block font-sans text-[13px] font-semibold leading-snug text-pine-900">{video.title}</span>
        <span tw="mt-1 inline-flex items-center gap-1 font-sans text-[12px] text-sun-600">Assistir no YouTube <Arrow width={12} height={12} /></span>
      </span>
    </a>
  )
}

function NextDestination() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true) // TODO: enviar para a lista de e-mails da Laura
  }
  return (
    <div id="proximo" tw="scroll-mt-40">
      <Rail label="Em breve" node="dot">
        <article tw="relative overflow-hidden rounded-[20px] bg-pine-900 p-8 text-white sm:p-10">
          <span aria-hidden="true" tw="absolute -right-4 -top-10 font-serif text-[200px] font-bold leading-none text-white/5">?</span>
          <p tw="font-script text-[28px] leading-none text-sun-500">{page.next.title}</p>
          <h2 tw="mt-3 max-w-[480px] font-serif text-[1.8rem] font-bold leading-tight">Para onde eu vou depois de Krabi?</h2>
          <p tw="mt-3 max-w-[480px] font-sans text-[14px] leading-relaxed text-white/80">{page.next.text}</p>
          {sent ? (
            <p tw="mt-6 font-sans text-[14px] text-white">Combinado! Você fica sabendo assim que eu chegar.</p>
          ) : (
            <form onSubmit={submit} tw="mt-6 flex max-w-[440px] items-center rounded-full bg-white p-1 pl-4">
              <label htmlFor="next-email" tw="sr-only">Seu e-mail</label>
              <input id="next-email" type="email" required placeholder="Seu e-mail" tw="min-w-0 flex-1 bg-transparent font-sans text-[13px] text-ink outline-none" />
              <button type="submit" tw="rounded-full bg-sun-500 px-5 py-2.5 font-sans text-[13px] font-semibold text-white hover:bg-sun-600">Me conte primeiro</button>
            </form>
          )}
        </article>
      </Rail>
    </div>
  )
}
