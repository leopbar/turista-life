import { useEffect, useState } from 'react'
import tw from 'twin.macro'
import { api, parseDate, type ActivityItem } from '../api'
import { describe } from '../activityLabels'
import { Shield } from '../components/icons'
import { Button } from '../components/ui'

const dayLabel = (iso: string) => {
  const s = parseDate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Registro de atividades em forma de caderno de viagem: um dia por página, uma linha por acontecimento. */
export function Activity() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [next, setNext] = useState<number | null | undefined>(undefined)
  const [chain, setChain] = useState<{ ok: boolean; brokenAt: number | null } | null>(null)

  const load = (before?: number) =>
    api.activity(before).then((r) => {
      setItems((prev) => (before ? [...prev, ...r.items] : r.items))
      setNext(r.nextBefore)
    })

  useEffect(() => {
    load()
    api.verifyActivity().then(setChain).catch(() => setChain(null))
  }, [])

  const days: { day: string; items: ActivityItem[] }[] = []
  for (const a of items) {
    const day = dayLabel(a.createdAt)
    if (days[days.length - 1]?.day !== day) days.push({ day, items: [] })
    days[days.length - 1]!.items.push(a)
  }

  return (
    <div tw="mx-auto max-w-[820px]">
      <h1 tw="m-0 font-serif text-[2.4rem] font-bold text-ink">Atividades</h1>
      <p tw="mt-2 font-sans text-[14.5px] text-muted">Tudo o que acontece no painel fica anotado aqui por 1 ano. Ninguém consegue apagar nem mudar estas anotações.</p>

      {chain && (
        <div css={[tw`mt-6 flex items-center gap-3 rounded-2xl px-4 py-3 font-sans text-[13.5px]`, chain.ok ? tw`bg-mist text-pine-900` : tw`bg-[#FEF3F2] text-[#912018]`]}>
          <Shield width={20} height={20} />
          {chain.ok ? 'Registro íntegro: nenhuma anotação foi alterada.' : `Atenção: o registro foi mexido por fora a partir da anotação nº ${chain.brokenAt}. Fale com o suporte técnico.`}
        </div>
      )}

      <div tw="mt-10 flex flex-col gap-10">
        {days.map(({ day, items }) => (
          <section key={day} tw="rounded-[26px] bg-white p-7 shadow-card">
            <h2 tw="m-0 mb-4 font-script text-[30px] font-normal leading-none text-sun-600">{day}</h2>
            <ol tw="m-0 list-none p-0">
              {items.map((a) => {
                const d = describe(a)
                return (
                  <li key={a.id} tw="flex min-h-[40px] items-center gap-4 border-0 border-b border-dashed border-line font-sans text-[14px] last:border-b-0">
                    <span tw="w-[52px] shrink-0 tabular-nums text-muted">{parseDate(a.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span css={[tw`h-2 w-2 shrink-0 rounded-full`, d.tone === 'warn' ? tw`bg-sun-500` : d.tone === 'ok' ? tw`bg-pine-700` : tw`bg-muted/40`]} />
                    <span tw="flex-1 text-ink">{d.text}</span>
                    {a.ip && <span tw="hidden font-mono text-[11.5px] text-muted md:inline">{a.ip}</span>}
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>

      {next && (
        <div tw="mt-8 text-center">
          <Button variant="ghost" onClick={() => load(next)}>Ver anotações mais antigas</Button>
        </div>
      )}
    </div>
  )
}
