/**
 * Conteúdo vindo do painel (Turista-Life Administração).
 *
 * Antes de o site montar, main.tsx baixa o conteúdo publicado (cms/site.json) e guarda em
 * window.__TL_CMS__. Cada arquivo de conteúdo chama doc()/collection() com o texto escrito no código
 * como reserva: se o painel ainda não publicou nada (ou o arquivo não carregar), vale a reserva.
 *
 * Dentro da pré-visualização do painel, os textos ganham uma marca invisível (stega) com o endereço
 * do campo, para o painel saber o que a pessoa clicou, e o painel pode trocar o conteúdo ao vivo.
 */

import { textHome } from './fixedTexts'

export type MediaMeta ={ alt: string; focal: [number, number]; w: number; h: number; widths: number[] }

export type Bundle = {
  version: number
  docs: Record<string, unknown>
  collections: Record<string, unknown[]>
  media?: Record<string, MediaMeta>
  thumbs?: string[]
}

type CmsGlobal = { bundle: Bundle | null; preview: boolean; stega?: (key: string, value: unknown) => unknown }

const BASE = import.meta.env.BASE_URL
// globalThis (e não window): o script de exportação (scripts/export-cms.mjs) carrega estes arquivos no Node.
const g = (): CmsGlobal => ((globalThis as unknown as { __TL_CMS__?: CmsGlobal }).__TL_CMS__ ??= { bundle: null, preview: false })

export const isPreview = () => g().preview
export const bundle = () => g().bundle

/**
 * Elemento sem texto que abre um campo do painel ao ser clicado na pré-visualização (ex.: o ícone do Instagram
 * abre "Redes sociais e contato" no campo do Instagram). Fora da pré-visualização não acrescenta nada.
 */
export const cmsTarget = (key: string, path: string): { 'data-cms'?: string } => (isPreview() ? { 'data-cms': `${key}|${path}` } : {})

/** Caminhos de foto no conteúdo são relativos ao site ("images/x.jpg", "cms/media/…"). */
const ASSET = /^(images|cms)\//

function resolve(v: unknown): unknown {
  if (typeof v === 'string') return ASSET.test(v) ? BASE + v : v
  if (Array.isArray(v)) return v.map(resolve)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x)]))
  return v
}

/** Campos novos no código (que o conteúdo publicado ainda não tem) vêm da reserva. */
function fill(value: unknown, fallback: unknown): unknown {
  if (!isObj(value) || !isObj(fallback)) return value
  const out: Record<string, unknown> = { ...value }
  for (const [k, f] of Object.entries(fallback)) {
    if (!(k in out)) out[k] = f
    else out[k] = fill(out[k], f)
  }
  return out
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/* Documentos e coleções já entregues, para a troca ao vivo na pré-visualização. */
const registry = new Map<string, unknown>()
const listeners = new Set<() => void>()
let version = 0

function prepare(key: string, raw: unknown, fallback: unknown) {
  let v = raw === undefined ? fallback : fill(resolve(raw), fallback)
  const cms = g()
  if (cms.preview && cms.stega) v = cms.stega(key, v)
  return v
}

export function doc<T>(key: string, fallback: T): T {
  const v = prepare(key, bundle()?.docs?.[key], fallback) as T
  registry.set(key, v)
  return v
}

export function collection<T>(key: string, fallback: T[], idOf: (item: T) => string): T[] {
  const raw = bundle()?.collections?.[key]
  const fallbackById = new Map(fallback.map((f) => [idOf(f), f]))
  const items = (raw ?? fallback).map((item) => {
    const id = idOf(item as T)
    return prepare(`${key}:${id}`, raw ? item : undefined, fallbackById.get(id) ?? (raw ? undefined : item)) as T
  })
  registry.set(key, items)
  items.forEach((it) => registry.set(`${key}:${idOf(it)}`, it))
  return items
}

/**
 * Texto fixo de componente ("Minha história"). Editável em "Textos fixos desta página", dentro da página onde
 * aparece (src/cms/fixedTexts.ts), ou em "Textos usados em várias páginas" quando aparece em várias.
 */
let textos: Record<string, string> | null = null
export function t(id: string, fallback: string): string {
  const home = textHome[id]
  let v: unknown
  if (home) {
    // O documento da página já foi entregue pelo arquivo de conteúdo dela (com a marca da pré-visualização).
    const page = (registry.get(home.doc) ?? bundle()?.docs?.[home.doc]) as { textos?: Record<string, Record<string, unknown>> } | undefined
    v = page?.textos?.[home.group]?.[home.key]
  } else {
    textos ??= doc<Record<string, string>>('geral.textos', {})
    v = textos[id]
  }
  return typeof v === 'string' && v.trim() ? v : fallback
}

/* ------------------------------------------------------------------ */
/* Pré-visualização: troca ao vivo                                    */
/* ------------------------------------------------------------------ */

/** Troca o conteúdo mantendo o mesmo objeto (os arquivos de conteúdo guardam a referência). */
function replaceInPlace(target: unknown, source: unknown) {
  if (Array.isArray(target) && Array.isArray(source)) {
    target.splice(0, target.length, ...source)
  } else if (isObj(target) && isObj(source)) {
    for (const k of Object.keys(target)) if (!(k in source)) delete target[k]
    for (const [k, v] of Object.entries(source)) {
      if ((Array.isArray(v) && Array.isArray(target[k])) || (isObj(v) && isObj(target[k]))) replaceInPlace(target[k], v)
      else target[k] = v
    }
  }
}

export function liveUpdate(key: string, raw: unknown) {
  const current = registry.get(key)
  if (current === undefined) return false
  replaceInPlace(current, prepare(key, raw, current))
  version++
  listeners.forEach((l) => l())
  return true
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getVersion = () => version

/** Para o script de exportação: tudo o que doc()/collection() entregaram. */
export const registered = () => registry

/* ------------------------------------------------------------------ */
/* Fotos                                                               */
/* ------------------------------------------------------------------ */

/**
 * Atributos de <img> para uma foto do conteúdo. Fotos enviadas pelo painel (cms/media/…) ganham
 * versões em vários tamanhos (srcset), o ponto de foco e a descrição guardada na biblioteca.
 */
export function imgProps(src: string, opts: { alt?: string; position?: string; sizes?: string } = {}) {
  const [path, hash = ''] = src.split('#')
  const m = path.match(/cms\/media\/([a-z0-9]+)\/(\d+)\.webp$/)
  const meta = m ? bundle()?.media?.[m[1]] : undefined
  const params = new URLSearchParams(hash)
  const focal = params.get('f')
  const style = opts.position ? { objectPosition: opts.position } : focal ? { objectPosition: focal.split(',').map((n) => n + '%').join(' ') } : undefined
  const props: { src: string; alt: string; style?: { objectPosition: string }; srcSet?: string; sizes?: string; 'data-cms'?: string } = {
    src: hash ? `${path}#${hash}` : path,
    alt: opts.alt ?? meta?.alt ?? '',
    style,
  }
  if (m && meta) {
    const dir = path.slice(0, path.lastIndexOf('/') + 1)
    props.srcSet = meta.widths.map((w) => `${dir}${w}.webp ${w}w`).join(', ')
    props.sizes = opts.sizes ?? '100vw'
  }
  return props
}

/** Miniatura de vídeo do YouTube: a do próprio site, ou a baixada pelo painel para vídeos novos. */
export function videoThumb(id: string) {
  return bundle()?.thumbs?.includes(id) ? `${BASE}cms/thumbs/${id}.jpg` : `${BASE}images/videos/${id}.jpg`
}
