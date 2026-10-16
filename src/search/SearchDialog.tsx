import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import tw from 'twin.macro'
import { GROUP_ORDER, POPULAR, search, type SearchItem } from './searchIndex'
import { Arrow, Close, Pin, Play, Search } from '../components/icons'

const groupIcon = (g: SearchItem['group']) => (g === 'Diário' ? Pin : g === 'Vídeos' ? Play : Arrow)

/** Busca com sugestões enquanto digita. Abre pela lupa do cabeçalho ou com Ctrl+K / "/". */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const results = useMemo(() => (query.trim() ? search(query) : POPULAR), [query])
  const grouped = useMemo(() => {
    const out: { group: SearchItem['group']; items: { item: SearchItem; index: number }[] }[] = []
    results.forEach((item, index) => {
      let g = out.find((o) => o.group === item.group)
      if (!g) out.push((g = { group: item.group, items: [] }))
      g.items.push({ item, index })
    })
    // Sem busca, mantém a ordem dos populares; com busca, ordena os grupos de forma estável.
    return query.trim() ? out.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)) : out
  }, [results, query])
  const flat = grouped.flatMap((g) => g.items.map((i) => i.item))

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 10)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  const go = (item: SearchItem) => {
    onClose()
    if (item.href.startsWith('http')) window.open(item.href, '_blank', 'noopener')
    else navigate(item.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && flat[active]) { e.preventDefault(); go(flat[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  useEffect(() => {
    document.getElementById(`search-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const hasQuery = query.trim().length > 0

  // Portal no body: o cabeçalho usa backdrop-filter, que prenderia um elemento fixed dentro dele.
  return createPortal(
    <div tw="fixed inset-0 z-[60] flex items-start justify-center bg-pine-950/60 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar no site"
        onMouseDown={(e) => e.stopPropagation()}
        tw="w-full max-w-[620px] overflow-hidden rounded-[20px] bg-white shadow-lift"
      >
        <div tw="flex items-center gap-3 border-b border-line px-5">
          <Search tw="shrink-0 text-pine-800" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Busque destinos, produtos, cupons, vídeos…"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="search-results"
            aria-activedescendant={flat.length ? `search-opt-${active}` : undefined}
            aria-autocomplete="list"
            tw="h-16 min-w-0 flex-1 bg-transparent font-sans text-[16px] text-ink outline-none placeholder:text-muted"
          />
          <button type="button" onClick={onClose} aria-label="Fechar busca" tw="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-mist">
            <Close width={18} height={18} />
          </button>
        </div>

        <div id="search-results" role="listbox" aria-label="Sugestões" tw="max-h-[60vh] overflow-y-auto py-2">
          {!hasQuery && <p tw="px-5 pt-2 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Mais procurados</p>}

          {grouped.map((g) => (
            <div key={g.group} role="group" aria-label={g.group}>
              {hasQuery && <p tw="px-5 pt-3 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[.14em] text-muted">{g.group}</p>}
              {g.items.map(({ item }) => {
                const i = flat.indexOf(item)
                const I = groupIcon(item.group)
                const selected = i === active
                return (
                  <div
                    key={item.id}
                    id={`search-opt-${i}`}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    css={[tw`mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5`, selected && tw`bg-mist`]}
                  >
                    <span css={[tw`grid h-9 w-9 shrink-0 place-items-center rounded-full`, selected ? tw`bg-pine-800 text-white` : tw`bg-cream text-pine-800`]}>
                      <I width={16} height={16} />
                    </span>
                    <span tw="min-w-0 flex-1">
                      <Highlight text={item.title} query={query} />
                      {item.subtitle && <span tw="block truncate font-sans text-[12px] text-muted">{item.subtitle}</span>}
                    </span>
                    {item.href.startsWith('http') && <span tw="shrink-0 font-sans text-[11px] text-muted">YouTube ↗</span>}
                  </div>
                )
              })}
            </div>
          ))}

          {hasQuery && flat.length === 0 && (
            <p tw="px-5 py-8 text-center font-sans text-[14px] text-muted">
              Nada encontrado para “{query}”. Tente um destino, como <strong tw="text-pine-900">Bali</strong>, ou <strong tw="text-pine-900">cupom</strong>.
            </p>
          )}
        </div>

        <div tw="hidden items-center gap-4 border-t border-line bg-cream px-5 py-2.5 font-sans text-[11px] text-muted sm:flex">
          <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar</span>
          <span><Kbd>Enter</Kbd> abrir</span>
          <span><Kbd>Esc</Kbd> fechar</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const Kbd = tw.kbd`rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] text-ink`

/** Destaca no título o começo das palavras que bate com o que foi digitado. */
function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .split(/[^a-z0-9]+/).filter(Boolean)
  if (!terms.length) return <span tw="block truncate font-sans text-[14px] font-semibold text-pine-900">{text}</span>
  const parts = text.split(/(\s+)/).map((word, i) => {
    const plain = word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const t = terms.find((term) => plain.startsWith(term))
    if (!t) return <span key={i}>{word}</span>
    return (
      <span key={i}>
        <mark tw="rounded-sm bg-sun-500/20 text-pine-900">{word.slice(0, t.length)}</mark>
        {word.slice(t.length)}
      </span>
    )
  })
  return <span tw="block truncate font-sans text-[14px] font-semibold text-pine-900">{parts}</span>
}
