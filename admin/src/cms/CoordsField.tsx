import { useEffect, useState } from 'react'
import tw from 'twin.macro'
import { api, ApiError, type GeoResult } from '../api'
import { REGIONS, loadShapes, project, regionOf, type RegionShapes } from '../../../src/map/geo'

const input = tw`w-full rounded-xl border-[1.5px] border-solid border-line bg-white px-3.5 py-2.5 font-sans text-[14px] text-ink outline-none transition placeholder:text-muted/60 focus:(border-pine-700 ring-4 ring-pine-700/10)`

/**
 * Posição de uma parada no mapa: a pessoa busca a cidade pelo nome e escolhe o resultado.
 * Guarda [latitude, longitude]; [0, 0] quer dizer "ainda não escolhida".
 */
export function CoordsField({ id, value, onChange }: { id: string; value: unknown; onChange: (v: [number, number]) => void }) {
  const coords = Array.isArray(value) && value.length === 2 ? (value as [number, number]) : null
  const chosen = coords && !(coords[0] === 0 && coords[1] === 0) ? coords : null
  const [q, setQ] = useState('')
  const [results, setResults] = useState<GeoResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState('')

  async function search() {
    const text = q.trim()
    if (text.length < 2) return
    setBusy(true)
    setError('')
    try {
      setResults(await api.geoSearch(text))
    } catch (err) {
      setResults(null)
      setError(err instanceof ApiError ? err.message : 'Não deu para buscar agora. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  function choose(r: GeoResult) {
    onChange([r.lat, r.lon])
    setPicked(r.label)
    setResults(null)
    setQ('')
  }

  const region = chosen && regionOf(chosen)

  return (
    <div tw="flex flex-col gap-2.5">
      <div tw="flex gap-2">
        <input
          id={id}
          css={input}
          value={q}
          placeholder={chosen ? 'Buscar outra cidade…' : 'Digite a cidade, ex.: Lisboa, Portugal'}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              search()
            }
          }}
        />
        <button
          type="button"
          disabled={busy || q.trim().length < 2}
          onClick={search}
          tw="shrink-0 cursor-pointer rounded-xl border-0 bg-pine-800 px-4 font-sans text-[13px] font-semibold text-white transition hover:bg-pine-900 disabled:(cursor-not-allowed opacity-50)"
        >
          {busy ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {error && <p tw="font-sans text-[12px] text-sun-600">{error}</p>}

      {results && (
        results.length === 0 ? (
          <p tw="font-sans text-[12px] text-muted">Nada encontrado. Tente com o país junto, ex.: Ubud, Indonésia.</p>
        ) : (
          <ul tw="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line">
            {results.map((r, i) => (
              <li key={`${r.lat},${r.lon},${i}`} css={i > 0 && tw`border-t border-line`}>
                <button
                  type="button"
                  onClick={() => choose(r)}
                  tw="flex w-full cursor-pointer flex-col items-start gap-0.5 border-0 bg-transparent px-3.5 py-2.5 text-left transition hover:bg-cream"
                >
                  <span tw="font-sans text-[13.5px] font-semibold text-pine-900">{r.label}</span>
                  {r.detail !== r.label && <span tw="font-sans text-[11.5px] text-muted">{r.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {chosen ? (
        <div tw="flex flex-col gap-2.5 rounded-xl bg-white p-3 ring-1 ring-line">
          <MiniMap coords={chosen} />
          <div tw="flex flex-col gap-1 font-sans text-[12.5px] leading-snug">
            <span tw="font-semibold text-pine-900">{picked ? `📍 ${picked}` : '📍 Posição escolhida'}</span>
            {region ? (
              <span tw="text-muted">Aparece no mapa do Diário, na aba “{region.label}”.</span>
            ) : (
              <span tw="text-sun-600">
                Este lugar fica fora das regiões do mapa ({REGIONS.map((r) => r.label).join(', ')}). A parada aparece no Diário, mas não no mapa.
              </span>
            )}
            <span tw="text-[11px] text-muted/80">Confira o pino. Se estiver errado, busque de novo com o país junto.</span>
          </div>
        </div>
      ) : (
        <p tw="font-sans text-[12px] text-muted">Ainda sem posição: busque a cidade e clique no resultado certo.</p>
      )}
    </div>
  )
}

/** Recorte do mapa da região em volta do ponto, só para conferir o pino. */
function MiniMap({ coords }: { coords: [number, number] }) {
  const region = regionOf(coords)
  const [shapes, setShapes] = useState<RegionShapes | null>(null)
  useEffect(() => {
    if (!region) return
    let alive = true
    loadShapes(region.id).then((s) => alive && setShapes(s))
    return () => {
      alive = false
    }
  }, [region])

  const w = 320
  const h = 150
  if (!region) return <div tw="aspect-[32/15] w-full rounded-lg bg-pine-800" />
  const [x, y] = project(region, coords)
  const s = w / (region.scale * ((18 * Math.PI) / 180)) // ~18° de largura
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Prévia da posição no mapa" tw="block h-auto w-full rounded-lg bg-pine-800">
      <g transform={`translate(${w / 2 - x * s} ${h / 2 - y * s}) scale(${s})`}>
        {shapes?.countries.map((c, i) => (
          <path key={i} d={c.d} fill="rgba(248,246,241,.12)" stroke="rgba(248,246,241,.45)" strokeWidth="1" style={{ vectorEffect: 'non-scaling-stroke' }} />
        ))}
      </g>
      <circle cx={w / 2} cy={h / 2} r="11" fill="#F07A2A" opacity=".25" />
      <circle cx={w / 2} cy={h / 2} r="5" fill="#F07A2A" stroke="#F8F6F1" strokeWidth="2" />
    </svg>
  )
}
