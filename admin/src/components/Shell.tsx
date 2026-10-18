import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { firstName, useAuth } from '../auth'
import { Key, Logout } from './icons'

/** Avião com rastro pontilhado, a mesma assinatura do site. */
export const PlaneTrail = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 48" fill="none" aria-hidden="true">
    <path d="M4 40c18 6 46 4 70-10" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 5" strokeLinecap="round" />
    <path d="M86 10l26-8-10 24-6-8-10-8z" fill="currentColor" />
    <path d="M96 18l16-16" stroke="currentColor" strokeWidth="1.4" opacity=".6" />
  </svg>
)

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" css={[tw`inline-flex items-end gap-2 no-underline`, light ? tw`text-white` : tw`text-pine-900`]} aria-label="Turista-Life Administração, início">
      <span tw="whitespace-nowrap font-script text-[30px] leading-none">Turista Life</span>
      <span css={[tw`mb-[3px] hidden font-sans text-[10px] font-semibold uppercase tracking-[.22em] sm:inline`, light ? tw`text-white/70` : tw`text-sun-600`]}>Administração</span>
    </Link>
  )
}

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')

export function Avatar({ name, size = 40, muted = false }: { name: string; size?: number; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      css={[tw`grid shrink-0 place-items-center rounded-full font-sans font-semibold`, muted ? tw`bg-line text-muted` : tw`bg-pine-800 text-white`]}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  if (!user) return null
  return (
    <div ref={ref} tw="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menu de ${user.name}`}
        tw="flex cursor-pointer items-center gap-3 rounded-full border-0 bg-white py-1.5 pl-1.5 pr-4 shadow-card transition hover:shadow-lift"
      >
        <Avatar name={user.name} size={34} />
        <span tw="text-left font-sans">
          <span tw="block text-[13px] font-semibold text-ink">{firstName(user)}</span>
          <span tw="block text-[11px] text-muted">{user.role === 'admin' ? 'Administrador' : 'Editor'}</span>
        </span>
      </button>
      {open && (
        <div tw="absolute right-0 top-[calc(100%+8px)] z-30 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-lift">
          <button onClick={() => { setOpen(false); navigate('/minha-senha') }} css={menuItem}>
            <Key width={18} height={18} /> Minha senha
          </button>
          <button onClick={() => logout()} css={menuItem}>
            <Logout width={18} height={18} /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

const menuItem = tw`flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left font-sans text-[14px] text-ink hover:bg-mist`

/** Moldura das telas internas: papel creme, marca à esquerda e a pessoa logada à direita. */
export function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const links = [
    { to: '/', label: 'Início', end: true },
    { to: '/editar', label: 'Editar o site', end: false },
    { to: '/conteudo', label: 'Conteúdo', end: false },
    { to: '/fotos', label: 'Fotos', end: false },
    { to: '/caderno', label: 'Caderno', end: false },
    ...(user?.role === 'admin'
      ? [
          { to: '/equipe', label: 'Equipe', end: false },
          { to: '/atividades', label: 'Atividades', end: false },
          { to: '/backup', label: 'Backup', end: false },
        ]
      : []),
  ]
  return (
    <div tw="min-h-screen bg-cream" style={{ backgroundImage: 'radial-gradient(rgba(11,48,46,.045) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
      <header tw="sticky top-0 z-20 border-0 border-b border-solid border-line/70 bg-cream/85 backdrop-blur">
        {/* No celular, o menu desce para uma segunda linha e rola de lado. */}
        <div tw="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-8 lg:(h-[76px] flex-nowrap py-0)">
          <Brand />
          <nav aria-label="Seções do painel" tw="order-last flex w-full items-center gap-1 overflow-x-auto lg:(order-none w-auto overflow-visible)">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                css={tw`whitespace-nowrap rounded-full px-3.5 py-2 font-sans text-[13.5px] font-medium text-muted no-underline transition hover:text-pine-900 [&.active]:(bg-pine-800 text-white)`}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <UserMenu />
        </div>
      </header>
      <main tw="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:(px-8 pt-10)">{children}</main>
    </div>
  )
}
