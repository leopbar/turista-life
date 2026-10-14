import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import tw from 'twin.macro'
import { links, nav } from '../content'
import { Container, Logo, SmartLink } from './ui'
import { Close, Menu, Search } from './icons'
import { SearchDialog } from '../search/SearchDialog'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const { pathname, hash } = useLocation()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' && !hash : href === pathname + hash || (href === '/blog' && pathname.startsWith('/blog/'))
  useEffect(() => setOpen(false), [pathname, hash])

  // Atalhos: Ctrl+K (ou Cmd+K) e "/" abrem a busca, fora de campos de texto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable]')
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearching(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      css={[
        tw`fixed inset-x-0 top-0 z-50 transition-all duration-300`,
        scrolled || open ? tw`bg-pine-900/95 shadow-lg backdrop-blur-md` : tw`bg-transparent`,
      ]}
    >
      <Container tw="flex h-20 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Principal" tw="hidden lg:block">
          <ul tw="flex items-center gap-5 xl:gap-7">
            {nav.map((item) => (
              <li key={item.href}>
                <SmartLink
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  css={[
                    tw`relative whitespace-nowrap py-2 font-sans text-[13px] font-medium text-white/90 no-underline transition-colors hover:text-white`,
                    tw`after:(absolute left-0 -bottom-1 h-[2px] w-full origin-left scale-x-0 rounded-full bg-sun-500 transition-transform content-[''])`,
                    tw`hover:after:scale-x-100`,
                    isActive(item.href) && tw`text-white after:scale-x-100`,
                  ]}
                >
                  {item.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>

        <div tw="flex items-center gap-2">
          <button type="button" aria-label="Buscar no site (Ctrl+K)" title="Buscar (Ctrl+K)" onClick={() => setSearching(true)} tw="grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/10">
            <Search />
          </button>
          <a
            href={links.youtube}
            target="_blank"
            rel="noreferrer"
            tw="hidden whitespace-nowrap rounded-full border border-white/25 bg-pine-800 px-5 py-2.5 font-sans text-[13px] font-semibold text-white no-underline transition hover:bg-pine-700 sm:inline-flex"
          >
            Inscreva-se
          </a>
          <button
            type="button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            tw="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </Container>

      {open && (
        <nav aria-label="Menu" tw="border-t border-white/10 lg:hidden">
          <Container tw="flex flex-col py-3">
            {nav.map((item) => (
              <SmartLink key={item.href} href={item.href} tw="py-3 font-sans text-base text-white no-underline">
                {item.label}
              </SmartLink>
            ))}
          </Container>
        </nav>
      )}
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
    </header>
  )
}
