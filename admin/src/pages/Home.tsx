import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import tw from 'twin.macro'
import { api, timeAgo, type ActivityItem, type SearchResult, type SystemStatus } from '../api'
import { describe } from '../activityLabels'
import { firstName, useAuth } from '../auth'
import { Arrow, Camera, Compass, Notebook, Pen, Plus, Route, Search, Shield, Tag, Users } from '../components/icons'

type Task = {
  title: string
  text: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  to: string
  adminOnly?: boolean
  accent?: boolean
}

const edit = (route: string, doc?: string, field?: string) =>
  `/editar?rota=${encodeURIComponent(route)}${doc ? `&doc=${encodeURIComponent(doc)}` : ''}${field ? `&campo=${encodeURIComponent(field)}` : ''}`

const TASKS: Task[] = [
  { title: 'Editar o site', text: 'Toque em qualquer texto ou foto e mude ali mesmo.', Icon: Compass, to: '/editar', accent: true },
  { title: 'Salvar Fotos', text: 'Inclua novas fotos na biblioteca', Icon: Camera, to: '/fotos' },
  { title: 'Escrever no diário', text: 'Uma parada nova, prós, contras e fotos.', Icon: Notebook, to: edit('/diario', 'diario.countries') },
  { title: 'Novo artigo no blog', text: 'Conte um destino com texto, fotos e vídeos.', Icon: Pen, to: '/conteudo?novo=article' },
  { title: 'Mudar um preço', text: 'Guias, e-books e links de compra.', Icon: Tag, to: edit('/produtos', 'produtos.page', 'catalog') },
  { title: 'Mexer no menu', text: 'Ordem e nomes das páginas do site.', Icon: Route, to: edit('/', 'geral.nav') },
  { title: 'Criar uma página', text: 'Uma página nova, montada com blocos prontos.', Icon: Plus, to: '/conteudo?novo=page' },
  { title: 'Caderno de viagem', text: 'Tudo o que foi publicado, e voltar no tempo.', Icon: Notebook, to: '/caderno' },
  { title: 'Equipe', text: 'Convide pessoas e cuide dos acessos.', Icon: Users, to: '/equipe', adminOnly: true },
  { title: 'Backup', text: 'Baixe uma cópia de tudo para guardar.', Icon: Shield, to: '/backup', adminOnly: true },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const card = tw`relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-[26px] bg-white p-6 no-underline shadow-card transition duration-300 hover:(-translate-y-1 shadow-lift)`

function TaskCard({ task, index }: { task: Task; index: number }) {
  const { Icon } = task
  // Cartões levemente inclinados, como cartões-postais espalhados na mesa.
  const tilt = [-1.2, 0.8, -0.6, 1, -0.9, 0.7, -0.5, 0.9, -0.7, 0.6][index % 10]
  return (
    <Link to={task.to} className="group" css={[card, task.accent && tw`bg-pine-800`]} style={{ transform: `rotate(${tilt}deg)` }}>
      <span css={[tw`grid h-12 w-12 place-items-center rounded-2xl text-white`, task.accent ? tw`bg-sun-500` : tw`bg-pine-800`]}>
        <Icon width={24} height={24} />
      </span>
      <div>
        <h3 css={[tw`m-0 font-serif text-[1.25rem] font-bold`, task.accent ? tw`text-white` : tw`text-ink`]}>{task.title}</h3>
        <p css={[tw`m-0 mt-1 font-sans text-[13.5px] leading-snug`, task.accent ? tw`text-white/80` : tw`text-muted`]}>{task.text}</p>
      </div>
      <Arrow css={[tw`absolute right-6 top-7 transition-transform duration-300 group-hover:translate-x-1`, task.accent ? tw`text-sun-500` : tw`text-pine-800`]} />
    </Link>
  )
}

function SearchBox() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  useEffect(() => {
    if (q.trim().length < 2) return setResults(null)
    const t = setTimeout(() => api.search(q).then(setResults).catch(() => setResults([])), 250)
    return () => clearTimeout(t)
  }, [q])
  return (
    <div tw="relative mt-8 max-w-[680px]">
      <label tw="flex items-center gap-3 rounded-full bg-white px-5 py-3.5 shadow-card">
        <Search tw="text-muted" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="O que você procura? Um texto, um destino, um cupom…"
          tw="w-full border-0 bg-transparent font-sans text-[15px] text-ink outline-none placeholder:text-muted/70"
          aria-label="Buscar no conteúdo do site"
        />
      </label>
      {results && (
        <div tw="absolute inset-x-0 top-[calc(100%+8px)] z-20 max-h-[420px] overflow-y-auto rounded-2xl bg-white p-2 shadow-lift">
          {results.length === 0 && <p tw="m-3 font-sans text-[13.5px] text-muted">Nada encontrado com "{q}".</p>}
          {results.map((r, i) => (
            <Link
              key={`${r.key}-${r.path}-${i}`}
              to={edit(r.route, r.key, r.path)}
              tw="block rounded-xl px-4 py-3 no-underline hover:bg-mist"
            >
              <span tw="block font-sans text-[11.5px] font-semibold uppercase tracking-[.08em] text-sun-600">{r.label}</span>
              <span tw="mt-0.5 block font-sans text-[13.5px] leading-snug text-ink">{r.snippet}</span>
            </Link>
          ))}
        </div>
      )}
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

function Banners() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [pending, setPending] = useState(0)
  useEffect(() => {
    api.status().then(setStatus).catch(() => {})
    api.contentList().then((l) => setPending(l.filter((d) => d.status !== 'publicado').length)).catch(() => {})
  }, [])
  return (
    <div tw="mt-6 flex flex-col gap-3">
      {pending > 0 && (
        <Link to="/conteudo?filtro=mudancas" tw="flex items-center gap-3 rounded-2xl bg-[#FFF4EC] px-5 py-3.5 font-sans text-[14px] text-ink no-underline">
          <span tw="grid h-8 w-8 place-items-center rounded-full bg-sun-500 text-white"><Pen width={16} height={16} /></span>
          Há <strong>{pending} {pending === 1 ? 'rascunho' : 'rascunhos'}</strong> esperando para ir para o ar.
          <Arrow width={16} height={16} tw="ml-auto text-sun-600" />
        </Link>
      )}
      {status?.needsBackupDownload && (
        <Link to="/backup" tw="flex items-center gap-3 rounded-2xl bg-mist px-5 py-3.5 font-sans text-[14px] text-pine-900 no-underline">
          <span tw="grid h-8 w-8 place-items-center rounded-full bg-pine-800 text-white"><Shield width={16} height={16} /></span>
          Lembrete do mês: baixe uma cópia de segurança do site e guarde fora do servidor.
          <Arrow width={16} height={16} tw="ml-auto text-pine-800" />
        </Link>
      )}
      {/* Avisos de segurança (acessos alterados etc.) ficam só em "Atividades". */}
    </div>
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

      <SearchBox />
      <Banners />

      <div css={[tw`mt-10 grid gap-10`, user.role === 'admin' && tw`lg:grid-cols-[1fr_320px]`]}>
        <div tw="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((t, i) => <TaskCard key={t.title} task={t} index={i} />)}
        </div>
        {user.role === 'admin' && <RecentActivity />}
      </div>
    </div>
  )
}
