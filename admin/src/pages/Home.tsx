import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import tw from 'twin.macro'
import { api, timeAgo, type ActivityItem } from '../api'
import { describe } from '../activityLabels'
import { firstName, useAuth } from '../auth'
import { Arrow, Camera, Compass, Notebook, Pen, Route, Search, Tag, Users } from '../components/icons'

type Task = {
  title: string
  text: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  to?: string
  /** Etapa do projeto em que a tarefa chega (enquanto não chega, aparece com o selo "Em breve"). */
  soon?: string
  adminOnly?: boolean
}

const TASKS: Task[] = [
  { title: 'Trocar uma foto', text: 'Qualquer imagem do site, em poucos toques.', Icon: Camera, soon: 'Etapa 3' },
  { title: 'Escrever no diário', text: 'Uma parada nova, prós, contras e fotos.', Icon: Notebook, soon: 'Etapa 2' },
  { title: 'Novo artigo no blog', text: 'Conte um destino com texto, fotos e vídeos.', Icon: Pen, soon: 'Etapa 2' },
  { title: 'Mudar um preço', text: 'Guias, e-books e links de compra.', Icon: Tag, soon: 'Etapa 2' },
  { title: 'Mexer no menu', text: 'Ordem e nomes das páginas do site.', Icon: Compass, soon: 'Etapa 2' },
  { title: 'Equipe', text: 'Convide pessoas e cuide dos acessos.', Icon: Users, to: '/equipe', adminOnly: true },
  { title: 'Atividades', text: 'Quem fez o quê, e quando.', Icon: Route, to: '/atividades', adminOnly: true },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const card = tw`relative flex min-h-[176px] flex-col justify-between overflow-hidden rounded-[26px] bg-white p-6 no-underline shadow-card transition duration-300`

function TaskCard({ task, index }: { task: Task; index: number }) {
  const { Icon } = task
  // Cartões levemente inclinados, como cartões-postais espalhados na mesa.
  const tilt = [-1.2, 0.8, -0.6, 1, -0.9, 0.7, -0.5][index % 7]
  const body = (
    <>
      <span css={[tw`grid h-12 w-12 place-items-center rounded-2xl`, task.soon ? tw`bg-mist text-muted` : tw`bg-sun-500 text-white`]}>
        <Icon width={24} height={24} />
      </span>
      <div>
        <h3 tw="m-0 font-serif text-[1.25rem] font-bold text-ink">{task.title}</h3>
        <p tw="m-0 mt-1 font-sans text-[13.5px] leading-snug text-muted">{task.text}</p>
      </div>
      {task.soon ? (
        <span tw="absolute right-5 top-5 rounded-full border-[1.5px] border-dashed border-sun-500/70 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[.14em] text-sun-600" style={{ transform: 'rotate(4deg)' }}>
          Em breve · {task.soon}
        </span>
      ) : (
        <Arrow tw="absolute right-6 top-7 text-pine-800 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </>
  )
  if (task.to)
    return (
      <Link to={task.to} className="group" css={[card, tw`hover:(-translate-y-1 shadow-lift)`]} style={{ transform: `rotate(${tilt}deg)` }}>
        {body}
      </Link>
    )
  return (
    <div css={[card, tw`cursor-default opacity-80`]} style={{ transform: `rotate(${tilt}deg)` }} aria-disabled="true">
      {body}
    </div>
  )
}

function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[] | null>(null)
  useEffect(() => {
    api.activity().then((r) => setItems(r.items.slice(0, 6))).catch(() => setItems([]))
  }, [])
  return (
    <aside tw="rounded-[26px] bg-white/70 p-6 shadow-card">
      <div tw="flex items-baseline justify-between">
        <h2 tw="m-0 font-script text-[28px] leading-none text-pine-800">Últimas paradas</h2>
        <Link to="/atividades" tw="font-sans text-[12.5px] font-semibold text-sun-600 no-underline hover:underline">Ver tudo</Link>
      </div>
      <ol tw="m-0 mt-5 list-none p-0">
        {items === null && <li tw="font-sans text-[13px] text-muted">Carregando…</li>}
        {items?.length === 0 && <li tw="font-sans text-[13px] text-muted">Nada por aqui ainda.</li>}
        {items?.map((a) => {
          const d = describe(a)
          return (
            <li key={a.id} tw="relative border-0 border-l-2 border-dashed border-line pb-4 pl-5 last:pb-0">
              <span css={[tw`absolute -left-[6px] top-1 h-2.5 w-2.5 rounded-full`, d.tone === 'warn' ? tw`bg-sun-500` : d.tone === 'ok' ? tw`bg-pine-700` : tw`bg-muted/50`]} />
              <p tw="m-0 font-sans text-[13px] leading-snug text-ink">{d.text}</p>
              <p tw="m-0 mt-0.5 font-sans text-[11.5px] text-muted">{timeAgo(a.createdAt)}</p>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

export function Home() {
  const { user } = useAuth()
  if (!user) return null
  const tasks = TASKS.filter((t) => !t.adminOnly || user.role === 'admin')
  return (
    <div>
      <p tw="m-0 font-sans text-[15px] text-muted">{greeting()}, {firstName(user)}!</p>
      <h1 tw="m-0 mt-1 font-script text-[64px] font-normal leading-[1] text-pine-900">Por onde vamos hoje?</h1>

      <label tw="mt-8 flex max-w-[640px] items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-card">
        <Search tw="text-muted" />
        <input
          disabled
          placeholder="O que você procura? Um texto, uma foto, uma página… (chega na Etapa 2)"
          tw="w-full border-0 bg-transparent font-sans text-[15px] text-ink outline-none placeholder:text-muted/70"
          aria-label="Busca no site"
        />
      </label>

      <div css={[tw`mt-12 grid gap-10`, user.role === 'admin' && tw`lg:grid-cols-[1fr_320px]`]}>
        <div tw="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((t, i) => <TaskCard key={t.title} task={t} index={i} />)}
        </div>
        {user.role === 'admin' && <RecentActivity />}
      </div>
    </div>
  )
}
