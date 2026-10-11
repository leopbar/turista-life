import { useMemo } from 'react'
import tw, { css } from 'twin.macro'
import { allStops } from '../diaryContent'
import { BALI_INSET, MAIN_MAP, type MapLayer } from '../mapData'

/** Mercator igual ao do d3 (scale + translate), para posicionar as cidades sobre os contornos. */
const project = (m: MapLayer, [lat, lon]: [number, number]) => [
  m.translate[0] + m.scale * ((lon * Math.PI) / 180),
  m.translate[1] - m.scale * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
]

const BALI_IDS = ['canggu', 'ubud', 'gili', 'nusa-penida', 'uluwatu']

/** Posição e escala do zoom de Bali dentro do mapa grande (canto do Oceano Índico, sem terra). */
const INSET = { x: 16, y: 480, k: 0.85 }

/** Lado do rótulo de cada cidade no zoom de Bali, para não sobrepor. */
const insetLabel: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' }> = {
  canggu: { dx: -10, dy: -4, anchor: 'end' },
  ubud: { dx: 8, dy: -10, anchor: 'start' },
  gili: { dx: 10, dy: 4, anchor: 'start' },
  'nusa-penida': { dx: 10, dy: 12, anchor: 'start' },
  uluwatu: { dx: -10, dy: 12, anchor: 'end' },
}

const countryLabels: { t: string; at: [number, number]; rotate?: number }[] = [
  { t: 'TAILÂNDIA', at: [13, 94.6] as [number, number], rotate: -90 },
  { t: 'INDONÉSIA', at: [-1.5, 102.5] as [number, number] },
  { t: 'AUSTRÁLIA', at: [-24.5, 127] as [number, number] },
]

const halo = { paintOrder: 'stroke' as const, stroke: '#0B302E', strokeWidth: 6, strokeLinejoin: 'round' as const }

export function RouteMap() {
  const { nodes, path, baliStops } = useMemo(() => {
    const bali = allStops.filter((s) => BALI_IDS.includes(s.id))
    const rest = allStops.filter((s) => !BALI_IDS.includes(s.id))
    const list = [
      { id: 'partida', label: 'Sydney', sub: 'partida e volta', coords: [-33.87, 151.21] as [number, number], current: false },
      { id: 'indonesia', label: 'Bali', sub: `${bali.length} cidades`, coords: [-8.6, 115.2] as [number, number], current: false },
      ...rest.map((s) => ({ id: s.id, label: s.city, sub: s.stay, coords: s.coords, current: !!s.current })),
    ].map((n) => ({ ...n, xy: project(MAIN_MAP, n.coords) }))
    const d = list
      .slice(1)
      .map((n, i) => {
        const [px, py] = list[i].xy
        const [x, y] = n.xy
        const bend = Math.min(120, Math.hypot(x - px, y - py) * 0.22)
        return `M${px},${py} Q${(px + x) / 2},${(py + y) / 2 - bend} ${x},${y}`
      })
      .join(' ')
    return { nodes: list, path: d, baliStops: bali.map((s) => ({ ...s, xy: project(BALI_INSET, s.coords) })) }
  }, [])

  const bali = nodes.find((n) => n.id === 'indonesia')!
  const insetW = BALI_INSET.width * INSET.k

  return (
    <div tw="relative overflow-hidden rounded-[24px] bg-pine-800 shadow-lift">
      <svg
        viewBox={`0 0 ${MAIN_MAP.width} ${MAIN_MAP.height}`}
        role="img"
        aria-label="Mapa da rota da Laura: Sydney, Bali, Perth, Sydney, Bangkok, Chiang Mai e Krabi"
        tw="block h-auto w-full"
      >
        {/* Países: os visitados um pouco mais claros */}
        <g strokeLinejoin="round">
          {MAIN_MAP.countries.map((c) => (
            <path
              key={c.name}
              d={c.d}
              fill={c.visited ? 'rgba(248,246,241,.13)' : 'rgba(248,246,241,.05)'}
              stroke={c.visited ? 'rgba(248,246,241,.55)' : 'rgba(248,246,241,.18)'}
              strokeWidth={c.visited ? 1.4 : 1}
            />
          ))}
        </g>

        {countryLabels.map((l) => {
          const [x, y] = project(MAIN_MAP, l.at)
          return (
            <text key={l.t} x={x} y={y} transform={l.rotate ? `rotate(${l.rotate} ${x} ${y})` : undefined} textAnchor="middle" fill="#F8F6F1" opacity=".38" fontFamily="Poppins, sans-serif" fontSize="22" fontWeight="600" letterSpacing="7">
              {l.t}
            </text>
          )
        })}

        {/* Rota */}
        <path
          d={path}
          fill="none"
          stroke="#F07A2A"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
          css={css`
            animation: dash 40s linear infinite;
            @keyframes dash { to { stroke-dashoffset: -600; } }
            @media (prefers-reduced-motion: reduce) { animation: none; }
          `}
        />

        {/* Ligação Bali → zoom */}
        <path
          d={`M${bali.xy[0]},${bali.xy[1]} L${INSET.x + insetW},${INSET.y}`}
          stroke="rgba(248,246,241,.4)"
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />

        {/* Zoom de Bali */}
        <g transform={`translate(${INSET.x} ${INSET.y}) scale(${INSET.k})`}>
          <rect width={BALI_INSET.width} height={BALI_INSET.height} rx="16" fill="#0B302E" stroke="rgba(248,246,241,.35)" strokeWidth="1.5" />
          <clipPath id="inset-clip">
            <rect width={BALI_INSET.width} height={BALI_INSET.height} rx="16" />
          </clipPath>
          <g clipPath="url(#inset-clip)">
            {BALI_INSET.countries.map((c) => (
              <path key={c.name} d={c.d} fill="rgba(248,246,241,.14)" stroke="rgba(248,246,241,.55)" strokeWidth="1.2" />
            ))}
          </g>
          <text x="14" y="26" fill="#F8F6F1" opacity=".7" fontFamily="Poppins, sans-serif" fontSize="14" fontWeight="600" letterSpacing="3">ZOOM EM BALI</text>
          {baliStops.map((s) => {
            const [x, y] = s.xy
            const l = insetLabel[s.id] ?? { dx: 10, dy: 4, anchor: 'start' as const }
            return (
              <a key={s.id} href={`#${s.id}`} aria-label={`${s.city}: ir para o capítulo`}>
                <circle cx={x} cy={y} r="6" fill="#F8F6F1" stroke="#0B302E" strokeWidth="2.5" />
                <text x={x + l.dx} y={y + l.dy} textAnchor={l.anchor} fill="#F8F6F1" fontFamily="Poppins, sans-serif" fontSize="15" fontWeight="600" style={halo}>
                  {s.city.split(',')[0]}
                </text>
              </a>
            )
          })}
        </g>

        {/* Paradas */}
        {nodes.map((n, i) => {
          // Um lugar visitado duas vezes (Sydney) aparece uma vez só no mapa.
          if (nodes.findIndex((o) => o.label === n.label) !== i) return null
          const [x, y] = n.xy
          const left = x > MAIN_MAP.width * 0.6
          const tx = left ? x - 18 : x + 18
          return (
            <a key={`${n.id}-${i}`} href={`#${n.id}`} aria-label={`${n.label}: ir para o capítulo`}>
              {n.current && (
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill="#4ADE80"
                  opacity=".45"
                  css={css`
                    transform-origin: ${x}px ${y}px;
                    animation: ping 1.8s ease-out infinite;
                    @keyframes ping { to { transform: scale(2.6); opacity: 0; } }
                    @media (prefers-reduced-motion: reduce) { animation: none; }
                  `}
                />
              )}
              <circle cx={x} cy={y} r={n.current ? 11 : 8} fill={n.current ? '#4ADE80' : '#F8F6F1'}
                style={n.current ? { filter: 'drop-shadow(0 0 8px rgba(74,222,128,.9))' } : undefined} stroke="#0F3D3A" strokeWidth="3" />
              <text x={tx} y={y - 4} textAnchor={left ? 'end' : 'start'} fill="#F8F6F1" fontFamily="Poppins, sans-serif" fontSize="26" fontWeight="600" style={halo}>
                {n.label}
              </text>
              <text x={tx} y={y + 22} textAnchor={left ? 'end' : 'start'} fill="#F8F6F1" fillOpacity=".75" fontFamily="Poppins, sans-serif" fontSize="18" style={halo}>
                {n.current ? 'agora' : n.sub}
              </text>
            </a>
          )
        })}
      </svg>
      <p tw="absolute left-4 bottom-3 font-sans text-[10px] text-white/40">Mapa: Natural Earth</p>
    </div>
  )
}

