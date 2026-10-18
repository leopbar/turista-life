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
/** A rota passa de uma aba para outra: a parada ("at") ganha uma linha até a borda do quadro. */
export type Crossing = {
  kind: 'out' | 'in'
  at: string
  /** Borda de onde a linha sai ou chega: -1 esquerda, 1 direita. */
  dir: -1 | 1
  title: string
  sub: string
  target: string
}
export type CrossingLink = Crossing & { path: string; text: Label }
export type MapLayout = {
  /** Contornos no quadro: translate + escala em cima dos pixels da região. */
  tx: number
  ty: number
  s: number
  nodes: Node[]
  path: string
  insets: Inset[]
  links: CrossingLink[]
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
function placeLabel(x: number, y: number, title: string, sub: string, size: number, preferLeft: boolean, taken: Box[], frame: Box, soft = new Set<Box>()) {
  const gap = size * 0.7
  const sides: ('start' | 'end')[] = preferLeft ? ['end', 'start'] : ['start', 'end']
  const options: Label[] = []
  for (const dy of [0, -size * 1.3, size * 1.3]) for (const a of sides) options.push({ x: a === 'start' ? x + gap : x - gap, y: y - size * 0.15 + dy, anchor: a })
  const fits = (b: Box) => b.x0 >= frame.x0 && b.x1 <= frame.x1 && b.y0 >= frame.y0 && b.y1 <= frame.y1
  // Sem lado livre: fica onde bate em menos coisa; cruzar a linha da rota (soft) é bem melhor que cobrir outro rótulo.
  const crowd = (l: Label) => {
    const b = labelBox(l, title, sub, size)
    return fits(b) ? taken.reduce((n, o) => n + (overlaps(b, o) ? (soft.has(o) ? 1 : 100) : 0), 0) : Infinity
  }
  const best = options.reduce((a, l) => (crowd(l) < crowd(a) ? l : a))
  taken.push(labelBox(best, title, sub, size))
  return best
}

/** Trecho curvo da rota entre dois pontos, com caixinhas ao longo dele para os rótulos desviarem. */
function curve(x0: number, y0: number, x1: number, y1: number, arc = 0.22) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const qx = (x0 + x1) / 2
  const qy = (y0 + y1) / 2 - Math.min(120, len * arc)
  const boxes: Box[] = []
  // As pontas ficam de fora: ali já está a bolinha da parada.
  const steps = Math.ceil(len / 12)
  for (let k = 1; k < steps; k++) {
    const t = k / steps
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * qx + t ** 2 * x1
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * qy + t ** 2 * y1
    if (Math.hypot(x - x0, y - y0) > 14 && Math.hypot(x - x1, y - y1) > 14) boxes.push(dot(x, y, 4))
  }
  return { d: `M${x0},${y0} Q${qx},${qy} ${x1},${y1}`, boxes }
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
  crossings: Crossing[] = [],
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
  const curves = seq.slice(1).map((n, i) => curve(seq[i].x, seq[i].y, n.x, n.y))
  const path = curves.map((c) => c.d).join(' ')

  const frame: Box = { x0: 8, y0: 8, x1: W - 8, y1: H - 8 }
  const taken: Box[] = nodes.map((n) => dot(n.x, n.y, 12))

  // Saída/chegada da rota para outra aba: linha até a borda e um aviso clicável junto dela.
  const links: CrossingLink[] = []
  for (const c of crossings) {
    const i = raw.findIndex((p) => p.id === c.at)
    if (i < 0) continue
    const n = nodeOf.get(placeOf[i])!
    const ex = c.dir < 0 ? 0 : W
    const ey = Math.min(H - 120, Math.max(120, n.y))
    const k = c.kind === 'out' ? curve(n.x, n.y, ex, ey, 0.06) : curve(ex, ey, n.x, n.y, 0.06)
    curves.push(k)
    // Aviso acima da linha, junto da borda (abaixo dela quando não cabe em cima).
    const text: Label = { x: c.dir < 0 ? 24 : W - 24, y: ey - 60 >= 36 ? ey - 60 : ey + 44, anchor: c.dir < 0 ? 'start' : 'end' }
    taken.push(labelBox(text, c.title, c.sub, 24))
    links.push({ ...c, path: k.d, text })
  }

  // O traço da rota também conta como ocupado: nenhum rótulo fica por cima da linha.
  const routeBoxes = new Set(curves.flatMap((c) => c.boxes))
  taken.push(...routeBoxes)

  // Rótulos das paradas, sem sobrepor uns aos outros nem às bolinhas.
  for (const n of nodes) n.text = placeLabel(n.x, n.y, n.label, n.current ? 'agora' : n.sub, 26, n.x > W * 0.6, taken, frame, routeBoxes)

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
      // O nome do país fica clarinho embaixo de tudo: pode cruzar a linha da rota.
      if (b.x0 < 24 || b.x1 > W - 24 || b.y0 < 30 || b.y1 > H - 30 || hits(b, taken.filter((o) => !routeBoxes.has(o)))) continue
      taken.push(b)
      countryLabels.push({ text, x: x + dx, y: y + dy })
      break
    }
  }

  return { tx, ty, s, nodes, path, insets, links, countryLabels }
}
