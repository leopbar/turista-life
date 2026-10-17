/**
 * Monta o desenho do mapa de uma região a partir das paradas: enquadramento, cidades muito
 * próximas agrupadas (com um zoom ao lado), rota, rótulos sem sobrepor e nomes dos países.
 * Tudo em "pixels de desenho" de um quadro fixo de W × H; os contornos entram com uma escala.
 */
import { project, type Region, type RegionShapes } from './geo'

export const W = 1000
export const H = 870
export const INSET_W = 280
export const INSET_H = 170
const INSET_TOP = 30 // espaço do título dentro do zoom

export type MapPoint = {
  id: string
  label: string
  sub: string
  href: string
  coords: [number, number]
  current: boolean
  /** Para agrupar: "Canggu, Bali" → "Bali"; país da parada quando não há. */
  group?: string
}

type Box = { x0: number; y0: number; x1: number; y1: number }
export type Label = { x: number; y: number; anchor: 'start' | 'end' }
export type Node = MapPoint & { x: number; y: number; members?: MapPoint[]; text: Label }
export type InsetDot = MapPoint & { x: number; y: number; text: Label }
export type Inset = {
  title: string
  x: number
  y: number
  /** Contornos dentro do zoom: translate + escala em cima dos pixels da região. */
  tx: number
  ty: number
  s: number
  dots: InsetDot[]
  link: [number, number, number, number]
}
export type MapLayout = {
  /** Contornos no quadro: translate + escala em cima dos pixels da região. */
  tx: number
  ty: number
  s: number
  nodes: Node[]
  path: string
  insets: Inset[]
  countryLabels: { text: string; x: number; y: number }[]
}

const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
const hits = (b: Box, list: Box[]) => list.some((o) => overlaps(b, o))
const dot = (x: number, y: number, r: number): Box => ({ x0: x - r, y0: y - r, x1: x + r, y1: y + r })

/** Caixa aproximada de um rótulo de duas linhas (nome grande + linha menor embaixo). */
function labelBox(l: Label, title: string, sub: string, size: number): Box {
  const w = Math.max(title.length * size * 0.6, sub.length * size * 0.42) + 4
  const x0 = l.anchor === 'start' ? l.x : l.x - w
  return { x0, y0: l.y - size, x1: x0 + w, y1: l.y + size * 1.15 }
}

/** Escolhe o lado do rótulo (direita/esquerda, um pouco acima/abaixo) que não bate em nada. */
function placeLabel(x: number, y: number, title: string, sub: string, size: number, preferLeft: boolean, taken: Box[], frame: Box) {
  const gap = size * 0.7
  const sides: ('start' | 'end')[] = preferLeft ? ['end', 'start'] : ['start', 'end']
  const options: Label[] = []
  for (const dy of [0, -size * 1.3, size * 1.3]) for (const a of sides) options.push({ x: a === 'start' ? x + gap : x - gap, y: y - size * 0.15 + dy, anchor: a })
  const fits = (b: Box) => b.x0 >= frame.x0 && b.x1 <= frame.x1 && b.y0 >= frame.y0 && b.y1 <= frame.y1
  const best = options.find((l) => { const b = labelBox(l, title, sub, size); return fits(b) && !hits(b, taken) })
    ?? options.find((l) => fits(labelBox(l, title, sub, size)))
    ?? options[0]
  taken.push(labelBox(best, title, sub, size))
  return best
}

const mostCommon = (list: string[]) => {
  const count = new Map<string, number>()
  for (const s of list) count.set(s, (count.get(s) ?? 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1])[0]
}

export function layoutRegion(
  region: Region,
  points: MapPoint[],
  shapes: RegionShapes | null,
  visited: Map<string, string>,
  zoomTitle: (place: string) => string,
): MapLayout {
  const raw = points.map((p) => ({ ...p, xy: project(region, p.coords) }))

  // Enquadramento: as paradas ocupam o miolo do quadro, com espaço para os rótulos.
  const xs = raw.map((p) => p.xy[0])
  const ys = raw.map((p) => p.xy[1])
  const minW = region.scale * ((24 * Math.PI) / 180) // nunca mais perto do que ~24° de longitude
  let vw = Math.max((Math.max(...xs) - Math.min(...xs)) / 0.7, minW)
  let vh = Math.max((Math.max(...ys) - Math.min(...ys)) / 0.72, 1)
  if (vw / vh > W / H) vh = (vw * H) / W
  else vw = (vh * W) / H
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2
  const s = W / vw
  const tx = W / 2 - cx * s
  const ty = H / 2 - cy * s
  const toFrame = ([x, y]: [number, number]) => [tx + x * s, ty + y * s] as [number, number]

  // Mesmo lugar visitado duas vezes (ex.: Sydney) vira um ponto só.
  type Place = MapPoint & { x: number; y: number; index: number }
  const places: Place[] = []
  const placeOf: Place[] = []
  raw.forEach((p, i) => {
    const [x, y] = toFrame(p.xy)
    const same = places.find((o) => o.label === p.label || Math.hypot(o.coords[0] - p.coords[0], o.coords[1] - p.coords[1]) < 0.02)
    if (same) {
      same.current ||= p.current
      placeOf[i] = same
    } else {
      const np = { ...p, x, y, index: places.length }
      places.push(np)
      placeOf[i] = np
    }
  })

  // Cidades muito próximas no quadro viram um grupo (ex.: Bali), detalhado num zoom.
  const parent = places.map((_, i) => i)
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i])))
  for (let i = 0; i < places.length; i++)
    for (let j = i + 1; j < places.length; j++)
      if (Math.hypot(places[i].x - places[j].x, places[i].y - places[j].y) < 46) parent[root(j)] = root(i)
  const clusters = new Map<number, Place[]>()
  places.forEach((p, i) => clusters.set(root(i), [...(clusters.get(root(i)) ?? []), p]))

  const nodeOf = new Map<Place, Node>()
  const nodes: Node[] = []
  const blank: Label = { x: 0, y: 0, anchor: 'start' }
  for (const members of clusters.values()) {
    if (members.length === 1) {
      const n: Node = { ...members[0], text: blank }
      nodes.push(n)
      nodeOf.set(members[0], n)
      continue
    }
    const name = mostCommon(members.map((m) => m.label.split(',')[1]?.trim()).filter(Boolean) as string[])
    const label = name && name[1] > 1 ? name[0] : members[0].group ?? members[0].label.split(',')[0]
    const n: Node = {
      ...members[0],
      id: `grupo-${members[0].id}`,
      label,
      sub: `${members.length} cidades`,
      current: false,
      x: members.reduce((a, m) => a + m.x, 0) / members.length,
      y: members.reduce((a, m) => a + m.y, 0) / members.length,
      members,
      text: blank,
    }
    nodes.push(n)
    for (const m of members) nodeOf.set(m, n)
  }

  // Rota: na ordem das paradas, pulando as voltas dentro do mesmo grupo.
  const seq: Node[] = []
  for (let i = 0; i < raw.length; i++) {
    const n = nodeOf.get(placeOf[i])!
    if (seq[seq.length - 1] !== n) seq.push(n)
  }
  const path = seq
    .slice(1)
    .map((n, i) => {
      const p = seq[i]
      const bend = Math.min(120, Math.hypot(n.x - p.x, n.y - p.y) * 0.22)
      return `M${p.x},${p.y} Q${(p.x + n.x) / 2},${(p.y + n.y) / 2 - bend} ${n.x},${n.y}`
    })
    .join(' ')

  // Rótulos das paradas, sem sobrepor uns aos outros nem às bolinhas.
  const frame: Box = { x0: 8, y0: 8, x1: W - 8, y1: H - 8 }
  const taken: Box[] = nodes.map((n) => dot(n.x, n.y, 12))
  for (const n of nodes) n.text = placeLabel(n.x, n.y, n.label, n.current ? 'agora' : n.sub, 26, n.x > W * 0.6, taken, frame)

  // Zooms dos grupos, no canto do quadro com menos coisa embaixo.
  const insets: Inset[] = []
  const corners: [number, number][] = [[16, H - 56 - INSET_H], [W - 16 - INSET_W, H - 56 - INSET_H], [16, 16], [W - 16 - INSET_W, 16]]
  for (const g of nodes.filter((n) => n.members).slice(0, 4)) {
    const free = corners.filter((c) => !insets.some((i) => i.x === c[0] && i.y === c[1]))
    const score = (c: [number, number]) => {
      const b = { x0: c[0], y0: c[1], x1: c[0] + INSET_W, y1: c[1] + INSET_H }
      return taken.filter((t) => overlaps(b, t)).length
    }
    const [ix, iy] = free.reduce((a, c) => (score(c) < score(a) ? c : a))
    const box = { x0: ix, y0: iy, x1: ix + INSET_W, y1: iy + INSET_H }
    taken.push(box)

    const ms = g.members!.map((m) => ({ m, xy: project(region, m.coords) }))
    const gx = ms.map((o) => o.xy[0])
    const gy = ms.map((o) => o.xy[1])
    const bw = Math.max(...gx) - Math.min(...gx)
    const bh = Math.max(...gy) - Math.min(...gy)
    const maxS = INSET_W / (region.scale * ((0.5 * Math.PI) / 180)) // no máximo ~0,5° de largura
    const is = Math.min((INSET_W - 150) / Math.max(bw, 1e-6), (INSET_H - INSET_TOP - 46) / Math.max(bh, 1e-6), maxS)
    const icx = (Math.max(...gx) + Math.min(...gx)) / 2
    const icy = (Math.max(...gy) + Math.min(...gy)) / 2
    const itx = INSET_W / 2 - icx * is
    const ity = INSET_TOP + (INSET_H - INSET_TOP) / 2 - icy * is
    const dots = ms.map(({ m, xy }) => ({ ...m, x: itx + xy[0] * is, y: ity + xy[1] * is, text: blank }))
    const itaken: Box[] = dots.map((d) => dot(d.x, d.y, 8))
    const iframe: Box = { x0: 4, y0: INSET_TOP - 6, x1: INSET_W - 4, y1: INSET_H - 4 }
    for (const d of dots) d.text = placeLabel(d.x, d.y, d.label.split(',')[0], '', 15, d.x > INSET_W * 0.55, itaken, iframe)

    // Ligação do grupo até o canto mais próximo do zoom.
    const cornersOf: [number, number][] = [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]]
    const near = cornersOf.reduce((a, c) => (Math.hypot(c[0] - g.x, c[1] - g.y) < Math.hypot(a[0] - g.x, a[1] - g.y) ? c : a))
    insets.push({ title: zoomTitle(g.label), x: ix, y: iy, tx: itx, ty: ity, s: is, dots, link: [g.x, g.y, near[0], near[1]] })
  }

  // Nome dos países visitados, no meio do país, onde não atrapalhar as paradas.
  const countryLabels: MapLayout['countryLabels'] = []
  const seen = new Set<string>()
  for (const c of shapes?.countries ?? []) {
    const name = visited.get(c.iso)
    if (!name || seen.has(c.iso)) continue
    seen.add(c.iso)
    const text = name.toUpperCase()
    const w = text.length * 22 + 10
    const [x, y] = toFrame(c.label)
    for (const [dx, dy] of [[0, 0], [0, -60], [0, 60], [-120, 0], [120, 0], [0, -120], [0, 120]]) {
      const b = { x0: x + dx - w / 2, y0: y + dy - 22, x1: x + dx + w / 2, y1: y + dy + 4 }
      if (b.x0 < 24 || b.x1 > W - 24 || b.y0 < 30 || b.y1 > H - 30 || hits(b, taken)) continue
      taken.push(b)
      countryLabels.push({ text, x: x + dx, y: y + dy })
      break
    }
  }

  return { tx, ty, s, nodes, path, insets, countryLabels }
}
