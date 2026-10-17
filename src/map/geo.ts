/**
 * Regiões do mapa da rota (geradas por scripts/build-map.mjs) e as contas de posição.
 * Usado pelo site (mapa do Diário) e pelo painel (prévia da posição de uma parada).
 */
import regions from './regions.json'

export type Region = {
  id: string
  label: string
  bounds: { lonMin: number; lonMax: number; latMin: number; latMax: number }
  width: number
  height: number
  scale: number
  translate: [number, number]
}

export type RegionShapes = { countries: { iso: string; d: string; label: [number, number] }[] }

export const REGIONS = regions as Region[]

/** Mercator igual ao do d3 (scale + translate), em pixels do mapa da região. */
export const project = (r: Region, [lat, lon]: [number, number]): [number, number] => [
  r.translate[0] + r.scale * ((lon * Math.PI) / 180),
  r.translate[1] - r.scale * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
]

/** Primeira região que contém o ponto; null quando ele fica fora de todas. */
export const regionOf = ([lat, lon]: [number, number]) =>
  REGIONS.find((r) => lon >= r.bounds.lonMin && lon <= r.bounds.lonMax && lat >= r.bounds.latMin && lat <= r.bounds.latMax) ?? null

const loaders = import.meta.glob<RegionShapes>(['./*.json', '!./regions.json'], { import: 'default' })
const cache = new Map<string, Promise<RegionShapes>>()

/** Contornos dos países de uma região, baixados só quando a aba é aberta. */
export function loadShapes(id: string) {
  let p = cache.get(id)
  if (!p) {
    p = loaders[`./${id}.json`]()
    cache.set(id, p)
  }
  return p
}
