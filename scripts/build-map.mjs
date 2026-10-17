/**
 * Gera os mapas da rota em src/map/: o contorno real dos países (Natural Earth, domínio público,
 * via pacote world-atlas), um arquivo por região, já projetado em Mercator.
 *
 * Rodar só quando mudar a lista de regiões abaixo:  node scripts/build-map.mjs
 * As paradas, os países visitados e o enquadramento de cada aba são decididos no site,
 * a partir do conteúdo do painel; não é preciso rodar este script para um destino novo.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { geoCentroid, geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

/** Regiões do mapa, na ordem das abas. Uma parada entra na primeira região que contém suas coordenadas. */
const REGIONS = [
  { id: 'asia-oceania', label: 'Ásia e Oceania', bounds: { lonMin: 60, lonMax: 180, latMin: -48, latMax: 55 } },
  { id: 'europa', label: 'Europa', bounds: { lonMin: -25, lonMax: 45, latMin: 34, latMax: 71 } },
  { id: 'america-do-sul', label: 'América do Sul', bounds: { lonMin: -92, lonMax: -30, latMin: -56, latMax: 15 } },
]
const WIDTH = 2000

/** Nomes do Natural Earth que não batem com o nome em inglês da sigla de 2 letras. */
const ALIASES = {
  'United States of America': 'US', 'Dominican Rep.': 'DO', 'Bosnia and Herz.': 'BA', Macedonia: 'MK', 'North Macedonia': 'MK',
  'Czech Rep.': 'CZ', Czechia: 'CZ', 'Falkland Is.': 'FK', 'Solomon Is.': 'SB', 'Timor-Leste': 'TL', Laos: 'LA', 'Lao PDR': 'LA',
  'South Korea': 'KR', 'North Korea': 'KP', Myanmar: 'MM', Brunei: 'BN', 'Vatican': 'VA', 'Faeroe Is.': 'FO', 'Faroe Is.': 'FO',
  'Åland': 'AX', 'Isle of Man': 'IM', Kosovo: 'XK', Turkey: 'TR', 'Turkiye': 'TR',
  'Fr. S. Antarctic Lands': 'TF', 'S. Geo. and the Is.': 'GS', 'Heard I. and McDonald Is.': 'HM', 'N. Mariana Is.': 'MP',
  'Marshall Is.': 'MH', 'Cook Is.': 'CK', 'Wallis and Futuna Is.': 'WF', 'Pitcairn Is.': 'PN', 'Fr. Polynesia': 'PF',
  'Br. Indian Ocean Ter.': 'IO', 'Indian Ocean Ter.': 'CX',
  'Trinidad and Tobago': 'TT', 'St. Vin. and Gren.': 'VC', 'St. Lucia': 'LC', 'Saint Lucia': 'LC', 'St. Kitts and Nevis': 'KN', 'Antigua and Barb.': 'AG',
  'Cayman Is.': 'KY', 'Turks and Caicos Is.': 'TC', 'British Virgin Is.': 'VG', 'U.S. Virgin Is.': 'VI', 'Curaçao': 'CW',
  'Sint Maarten': 'SX', 'St-Martin': 'MF', 'St-Barthélemy': 'BL', 'Bahamas': 'BS', 'Taiwan': 'TW', 'Macao': 'MO', 'Hong Kong': 'HK',
  'Palestine': 'PS', 'W. Sahara': 'EH', 'Eq. Guinea': 'GQ', 'Central African Rep.': 'CF', 'Dem. Rep. Congo': 'CD', 'S. Sudan': 'SS',
  "Côte d'Ivoire": 'CI', 'eSwatini': 'SZ', 'São Tomé and Principe': 'ST', 'Somaliland': 'SO', 'Micronesia': 'FM',
  // Territórios disputados ou sem país próprio: aparecem no mapa, mas nunca como visitados.
  'Ashmore and Cartier Is.': '', 'Siachen Glacier': '', 'N. Cyprus': '', 'Cyprus U.N. Buffer Zone': '',
  'Russia': 'RU', 'Vietnam': 'VN', 'Syria': 'SY', 'Iran': 'IR', 'Moldova': 'MD', 'Bolivia': 'BO', 'Venezuela': 'VE', 'Tanzania': 'TZ',
}

const english = new Intl.DisplayNames(['en'], { type: 'region' })
const byName = new Map()
for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
  const code = String.fromCharCode(a, b)
  const name = english.of(code)
  if (name && name !== code) byName.set(name, code)
}
const isoOf = (name) => (name in ALIASES ? ALIASES[name] : byName.get(name) ?? null)

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)))
const features = feature(topo, topo.objects.countries).features

const area = (ring) => {
  let s = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1])
  return Math.abs(s / 2)
}

function build(region) {
  const b = region.bounds
  const projection = geoMercator().fitWidth(WIDTH, { type: 'MultiPoint', coordinates: [[b.lonMin, b.latMin], [b.lonMax, b.latMax]] })
  const [x0, y0] = projection([b.lonMin, b.latMax])
  const [x1, y1] = projection([b.lonMax, b.latMin])
  projection.translate([projection.translate()[0] - x0, projection.translate()[1] - y0]).clipExtent([[0, 0], [x1 - x0, y1 - y0]])
  const path = geoPath(projection).digits(1)
  // Mantém só as ilhas/polígonos que caem na região (com uma folga), descartando o resto do país.
  const m = (b.lonMax - b.lonMin) * 0.03
  const inside = (ring) => {
    let w = 180, e = -180, s = 90, n = -90
    for (const [lon, lat] of ring) { w = Math.min(w, lon); e = Math.max(e, lon); s = Math.min(s, lat); n = Math.max(n, lat) }
    return e >= b.lonMin - m && w <= b.lonMax + m && n >= b.latMin - m && s <= b.latMax + m
  }
  const missing = []
  const countries = features
    .map((f) => {
      const g = f.geometry
      if (!g) return null
      const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).filter((p) => inside(p[0]))
      if (!polys.length) return null
      const d = path({ type: 'MultiPolygon', coordinates: polys })
      if (!d || d.length < 12) return null
      const iso = isoOf(f.properties.name)
      if (iso === null) missing.push(f.properties.name)
      // Nome do país escrito no meio do maior pedaço dele (o continente, não uma ilha).
      const main = polys.reduce((a, p) => (area(p[0]) > area(a[0]) ? p : a))
      const label = projection(geoCentroid({ type: 'Polygon', coordinates: main })).map((n) => Math.round(n))
      return { iso: iso ?? '', d, label }
    })
    .filter(Boolean)
  if (missing.length) console.warn(`  ${region.id}: sem sigla para`, missing.join(', '))
  const meta = {
    id: region.id,
    label: region.label,
    bounds: b,
    width: Math.round(x1 - x0),
    height: Math.round(y1 - y0),
    scale: +projection.scale().toFixed(4),
    translate: projection.translate().map((n) => +n.toFixed(2)),
  }
  return { meta, countries }
}

const dir = new URL('../src/map/', import.meta.url)
mkdirSync(dir, { recursive: true })
const metas = []
for (const region of REGIONS) {
  const { meta, countries } = build(region)
  metas.push(meta)
  const json = JSON.stringify({ countries })
  writeFileSync(new URL(`${region.id}.json`, dir), json)
  console.log(`${region.id}: ${countries.length} países, ${(json.length / 1024).toFixed(0)} KB`)
}
writeFileSync(new URL('regions.json', dir), JSON.stringify(metas, null, 2) + '\n')
