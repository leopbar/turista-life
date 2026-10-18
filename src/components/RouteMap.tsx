import { useEffect, useMemo, useState } from 'react'
import tw from 'twin.macro'
import { countries, diaryPage } from '../diaryContent'
import { REGIONS, loadShapes, regionOf, type RegionShapes } from '../map/geo'
import { H, INSET_H, INSET_W, W, layoutRegion, type Crossing, type MapPoint } from '../map/layout'
import { LiveDot } from './ui'
import { t } from '../cms/runtime'

/** Ponto de partida da viagem (Sydney). */
const DEPARTURE: [number, number] = [-33.87, 151.21]

const halo = { paintOrder: 'stroke' as const, stroke: '#0B302E', strokeWidth: 6, strokeLinejoin: 'round' as const }
const thin = { vectorEffect: 'non-scaling-stroke' as const }

/** Todas as paradas, na ordem da viagem, já com a região do mapa de cada uma. */
function usePoints() {
  return useMemo(() => {
    const list: MapPoint[] = [
      { id: 'partida', label: diaryPage.departure.place.split(',')[0], sub: 'partida e volta', href: '#partida', coords: DEPARTURE, current: false },
      ...countries.flatMap((c) =>
        c.items.flatMap((s) =>
          s.type === 'stop' ? [{ id: s.id, label: s.city, sub: s.stay, href: `#${s.id}`, coords: s.coords, current: !!s.current, group: c.name }] : [],
        ),
      ),
    ]
    // O grupo (ex.: Bali) leva para o capítulo do país.
    const countryOf = new Map(countries.flatMap((c) => c.items.map((s) => [s.id, c.id] as const)))
    const byRegion = new Map<string, MapPoint[]>()
    for (const p of list) {
      const r = regionOf(p.coords)
      if (r) byRegion.set(r.id, [...(byRegion.get(r.id) ?? []), p])
    }
    // Onde a rota troca de aba (ex.: Hanói → Lisboa): uma saída numa aba e a chegada na outra.
    const crossings = new Map<string, Crossing[]>()
    const add = (id: string, c: Crossing) => crossings.set(id, [...(crossings.get(id) ?? []), c])
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1]
      const b = list[i]
      const ra = regionOf(a.coords)
      const rb = regionOf(b.coords)
      if (!ra || !rb || ra.id === rb.id) continue
      const west = b.coords[1] < a.coords[1]
      add(ra.id, { kind: 'out', at: a.id, dir: west ? -1 : 1, title: `${t('diario.mapa.segue-para', 'Segue para')} ${b.label}`, sub: west ? `← ${rb.label}` : `${rb.label} →`, target: rb.id })
      add(rb.id, { kind: 'in', at: b.id, dir: west ? 1 : -1, title: `${t('diario.mapa.vinda-de', 'Vinda de')} ${a.label}`, sub: west ? `${ra.label} →` : `← ${ra.label}`, target: ra.id })
    }
    const visited = new Map(countries.map((c) => [c.code.toUpperCase(), c.name]))
    const current = list.find((p) => p.current) ?? list[list.length - 1]
    return { byRegion, crossings, countryOf, visited, start: regionOf(current.coords)?.id ?? REGIONS[0].id }
  }, [])
}

export function RouteMap() {
  const { byRegion, crossings, countryOf, visited, start } = usePoints()
  const tabs = REGIONS.filter((r) => byRegion.has(r.id))
  const [active, setActive] = useState(start)
  const region = tabs.find((r) => r.id === active) ?? tabs[0]
  const [shapes, setShapes] = useState<{ id: string; data: RegionShapes } | null>(null)

  useEffect(() => {
    if (!region) return
    let alive = true
    loadShapes(region.id).then((data) => alive && setShapes({ id: region.id, data }))
    return () => {
      alive = false
    }
  }, [region])

  const data = shapes?.id === region?.id ? shapes.data : null
  const map = useMemo(
    () => region && layoutRegion(region, byRegion.get(region.id)!, data, visited, (place) => `${t('diario.mapa.zoom-em', 'ZOOM EM')} ${place.toUpperCase()}`, crossings.get(region.id)),
    [region, byRegion, crossings, data, visited],
  )
  if (!region || !map) return null

  const live = [
    ...map.nodes.filter((n) => n.current && !n.members).map((n) => [n.x, n.y] as const),
    ...map.insets.flatMap((i) => i.dots.filter((d) => d.current).map((d) => [i.x + d.x, i.y + d.y] as const)),
  ]

  return (
    <div tw="flex flex-col gap-3">
      {tabs.length > 1 && (
        <div role="group" aria-label="Regiões do mapa" tw="flex flex-wrap gap-1.5 sm:gap-2">
          {tabs.map((r) => {
            const on = r.id === region.id
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(r.id)}
                css={[
                  tw`cursor-pointer rounded-full border-0 px-3 py-1.5 font-sans text-[12.5px] font-medium ring-1 transition sm:(px-4 py-2 text-[13.5px])`,
                  on ? tw`bg-pine-800 text-white ring-pine-800` : tw`bg-white text-pine-900 ring-line hover:ring-pine-800`,
                ]}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      )}
      <div tw="relative overflow-hidden rounded-[24px] bg-pine-800 shadow-lift">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Mapa da rota da Laura (${region.label}): ${map.nodes.map((n) => n.label).join(', ')}`}
          tw="block h-auto w-full"
        >
          {/* Países: os visitados um pouco mais claros */}
          <g transform={`translate(${map.tx} ${map.ty}) scale(${map.s})`} strokeLinejoin="round">
            {data?.countries.map((c, i) => {
              const on = visited.has(c.iso)
              return (
                <path
                  key={i}
                  d={c.d}
                  fill={on ? 'rgba(248,246,241,.13)' : 'rgba(248,246,241,.05)'}
                  stroke={on ? 'rgba(248,246,241,.55)' : 'rgba(248,246,241,.18)'}
                  strokeWidth={on ? 1.4 : 1}
                  style={thin}
                />
              )
            })}
          </g>

          {map.countryLabels.map((l) => (
            <text key={l.text} x={l.x} y={l.y} textAnchor="middle" fill="#F8F6F1" opacity=".38" fontFamily="Poppins, sans-serif" fontSize="22" fontWeight="600" letterSpacing="7">
              {l.text}
            </text>
          ))}

          {/* Rota */}
          <path d={map.path} fill="none" stroke="#F07A2A" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />

          {/* Rota seguindo em outra aba: clicar abre a aba */}
          {map.links.map((l) => {
            const open = () => setActive(l.target)
            return (
              <g
                key={`${l.kind}-${l.at}`}
                role="button"
                tabIndex={0}
                aria-label={`${l.title}: ver no mapa (${l.sub.replace(/[←→]/g, '').trim()})`}
                onClick={open}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    open()
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <path d={l.path} fill="none" stroke="#F07A2A" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
                <text x={l.text.x} y={l.text.y} textAnchor={l.text.anchor} fill="#F8F6F1" fontFamily="Poppins, sans-serif" fontSize="24" fontWeight="600" style={halo}>
                  {l.title}
                </text>
                <text x={l.text.x} y={l.text.y + 26} textAnchor={l.text.anchor} fill="#F07A2A" fontFamily="Poppins, sans-serif" fontSize="19" fontWeight="600" style={halo}>
                  {l.sub}
                </text>
              </g>
            )
          })}

          {/* Zooms das cidades muito próximas */}
          {map.insets.map((z, zi) => (
            <g key={z.title}>
              <path d={`M${z.link[0]},${z.link[1]} L${z.link[2]},${z.link[3]}`} stroke="rgba(248,246,241,.4)" strokeWidth="1.5" strokeDasharray="4 5" />
              <g transform={`translate(${z.x} ${z.y})`}>
                <rect width={INSET_W} height={INSET_H} rx="14" fill="#0B302E" stroke="rgba(248,246,241,.35)" strokeWidth="1.3" />
                <clipPath id={`inset-clip-${zi}`}>
                  <rect width={INSET_W} height={INSET_H} rx="14" />
                </clipPath>
                <g clipPath={`url(#inset-clip-${zi})`}>
                  <g transform={`translate(${z.tx} ${z.ty}) scale(${z.s})`}>
                    {data?.countries.map((c, i) => (
                      <path key={i} d={c.d} fill="rgba(248,246,241,.14)" stroke="rgba(248,246,241,.55)" strokeWidth="1" style={thin} />
                    ))}
                  </g>
                </g>
                <text x="12" y="22" fill="#F8F6F1" opacity=".7" fontFamily="Poppins, sans-serif" fontSize="12" fontWeight="600" letterSpacing="2.5">{z.title}</text>
                {z.dots.map((d) => (
                  <a key={d.id} href={d.href} aria-label={`${d.label}: ir para o capítulo`}>
                    <circle cx={d.x} cy={d.y} r={d.current ? 0 : 5} fill="#F8F6F1" stroke="#0B302E" strokeWidth="2" />
                    <text x={d.text.x} y={d.text.y} textAnchor={d.text.anchor} fill="#F8F6F1" fontFamily="Poppins, sans-serif" fontSize="13" fontWeight="600" style={halo}>
                      {d.label.split(',')[0]}
                    </text>
                  </a>
                ))}
              </g>
            </g>
          ))}

          {/* Paradas */}
          {map.nodes.map((n) => (
            <a key={n.id} href={n.members ? `#${countryOf.get(n.members[0].id) ?? n.members[0].id}` : n.href} aria-label={`${n.label}: ir para o capítulo`}>
              <circle cx={n.x} cy={n.y} r={n.current ? 0 : 8} fill={n.current ? 'transparent' : '#F8F6F1'} stroke="#0F3D3A" strokeWidth="3" />
              <text x={n.text.x} y={n.text.y} textAnchor={n.text.anchor} fill="#F8F6F1" fontFamily="Poppins, sans-serif" fontSize="26" fontWeight="600" style={halo}>
                {n.label}
              </text>
              <text x={n.text.x} y={n.text.y + 26} textAnchor={n.text.anchor} fill="#F8F6F1" fillOpacity=".75" fontFamily="Poppins, sans-serif" fontSize="18" style={halo}>
                {n.current ? 'agora' : n.sub}
              </text>
            </a>
          ))}
          <text x="24" y={H - 20} fill="#F8F6F1" fillOpacity=".4" fontFamily="Poppins, sans-serif" fontSize="15">Mapa: Natural Earth</text>
        </svg>
        {/* Luz de "agora" como camada HTML: anima só opacidade, sem redesenhar o SVG. */}
        {live.map(([x, y]) => (
          <span
            key={`${x},${y}`}
            tw="pointer-events-none absolute"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, transform: 'translate(-50%, -50%)' }}
          >
            <LiveDot size={14} />
          </span>
        ))}
      </div>
    </div>
  )
}
