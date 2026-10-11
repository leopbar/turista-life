/**
 * Gera src/mapData.ts com o contorno real dos países (Natural Earth, domínio público,
 * via pacote world-atlas) recortado para a região da viagem, já projetado em Mercator.
 *
 * Rodar só quando a rota sair da região atual:  node scripts/build-map.mjs
 * Para cobrir países novos, ajuste MAIN_BOUNDS e VISITED abaixo.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const MAIN_BOUNDS = { lonMin: 90, lonMax: 162, latMin: -38, latMax: 21 }
const MAIN_SIZE = { width: 1000, height: 870, pad: 0, digits: 0 }
const INSET_BOUNDS = { lonMin: 114.45, lonMax: 116.75, latMin: -9.0, latMax: -8.05 }
const INSET_SIZE = { width: 330, height: 200, pad: 0, digits: 1 }
const VISITED = ['Thailand', 'Indonesia', 'Australia']

const load = (file) => {
  const topo = JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${file}`, import.meta.url)))
  return feature(topo, topo.objects.countries).features
}

const box = (b) => ({ type: 'MultiPoint', coordinates: [[b.lonMin, b.latMin], [b.lonMax, b.latMax]] })

function build(features, bounds, size) {
  const projection = geoMercator()
    .fitExtent([[size.pad, size.pad], [size.width - size.pad, size.height - size.pad]], box(bounds))
    .clipExtent([[0, 0], [size.width, size.height]])
  const path = geoPath(projection).digits(size.digits)
  // Mantém só as ilhas/polígonos que caem no recorte (com uma folga), descartando o resto do país.
  const m = (bounds.lonMax - bounds.lonMin) * 0.05
  const ringInside = (ring) => {
    let w = 180, e = -180, s = 90, n = -90
    for (const [lon, lat] of ring) { w = Math.min(w, lon); e = Math.max(e, lon); s = Math.min(s, lat); n = Math.max(n, lat) }
    return e >= bounds.lonMin - m && w <= bounds.lonMax + m && n >= bounds.latMin - m && s <= bounds.latMax + m
  }
  const trim = (f) => {
    const g = f.geometry
    if (!g) return null
    const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).filter((p) => ringInside(p[0]))
    return polys.length ? { ...f, geometry: { type: 'MultiPolygon', coordinates: polys } } : null
  }
  const countries = features
    .map(trim)
    .filter(Boolean)
    .map((f) => ({ name: f.properties.name, visited: VISITED.includes(f.properties.name), d: path(f) }))
    .filter((c) => c.d && c.d.length > 10)
    // Países visitados por último, para o contorno deles ficar por cima.
    .sort((a, b) => Number(a.visited) - Number(b.visited))
  return {
    width: size.width,
    height: size.height,
    scale: +projection.scale().toFixed(4),
    translate: projection.translate().map((n) => +n.toFixed(2)),
    countries,
  }
}

const main = build(load('countries-50m.json'), MAIN_BOUNDS, MAIN_SIZE)
const inset = build(load('countries-10m.json'), INSET_BOUNDS, INSET_SIZE)

const out = `/* Arquivo gerado por scripts/build-map.mjs. Não edite à mão. */
/* Contornos: Natural Earth (naturalearthdata.com), domínio público. Projeção Mercator. */

export type MapLayer = {
  width: number
  height: number
  scale: number
  translate: [number, number]
  countries: { name: string; visited: boolean; d: string }[]
}

export const MAIN_MAP: MapLayer = ${JSON.stringify(main)}

export const BALI_INSET: MapLayer = ${JSON.stringify(inset)}
`
writeFileSync(new URL('../src/mapData.ts', import.meta.url), out)
console.log('main:', main.countries.length, 'países;', 'inset:', inset.countries.length, '; tamanho', (out.length / 1024).toFixed(0), 'KB')
console.log('main países:', main.countries.map((c) => c.name).join(', '))
