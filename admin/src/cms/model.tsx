import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CollectionDef, DocDef, Field, Fields } from '../../../src/cms/fields'
import { api, type CmsSchema, type DocStatus } from '../api'

/* ------------------------------------------------------------------ */
/* Mapa de conteúdo (vem do servidor)                                  */
/* ------------------------------------------------------------------ */

const SchemaContext = createContext<CmsSchema | null>(null)

export function SchemaProvider({ children }: { children: ReactNode }) {
  const [schema, setSchema] = useState<CmsSchema | null>(null)
  useEffect(() => {
    api.schema().then(setSchema).catch(() => setSchema({ docs: [], collections: [] }))
  }, [])
  return <SchemaContext.Provider value={schema}>{children}</SchemaContext.Provider>
}

export function useSchema() {
  return useContext(SchemaContext)
}

export const baseKey = (key: string) => key.split(':')[0]

export function definitionOf(schema: CmsSchema, key: string): DocDef | CollectionDef | undefined {
  const b = baseKey(key)
  return schema.docs.find((d) => d.key === b) ?? schema.collections.find((c) => c.key === b)
}

export const isCollection = (d: DocDef | CollectionDef): d is CollectionDef => 'idField' in d

export const GROUPS: { id: string; label: string; emoji: string }[] = [
  { id: 'inicio', label: 'Página inicial', emoji: '🏠' },
  { id: 'sobre', label: 'Sobre mim', emoji: '👋' },
  { id: 'produtos', label: 'Produtos', emoji: '📘' },
  { id: 'recomendacoes', label: 'Recomendações', emoji: '🧳' },
  { id: 'parcerias', label: 'Parcerias', emoji: '🤝' },
  { id: 'diario', label: 'Diário', emoji: '🗺️' },
  { id: 'blog', label: 'Blog', emoji: '✍️' },
  { id: 'paginas', label: 'Páginas novas', emoji: '✨' },
  { id: 'geral', label: 'Em todo o site', emoji: '🌍' },
]

export const STATUS: Record<DocStatus, { label: string; tone: 'ok' | 'draft' | 'new' | 'out' }> = {
  publicado: { label: 'No ar', tone: 'ok' },
  alterado: { label: 'Rascunho com mudanças', tone: 'draft' },
  novo: { label: 'Ainda não publicado', tone: 'new' },
  sair: { label: 'Vai sair do site', tone: 'out' },
}

/* ------------------------------------------------------------------ */
/* Caminhos dentro do conteúdo ("items.2.title")                       */
/* ------------------------------------------------------------------ */

const parts = (path: string) => (path ? path.split('.') : [])

export function getAt(value: unknown, path: string): unknown {
  let v = value
  for (const p of parts(path)) {
    if (v === null || v === undefined) return undefined
    v = (v as Record<string, unknown>)[p]
  }
  return v
}

export function setAt<T>(value: T, path: string, next: unknown): T {
  const ps = parts(path)
  if (!ps.length) return next as T
  const [head, ...rest] = ps
  const copy: unknown = Array.isArray(value) ? [...value] : { ...(value as object) }
  const child = (value as Record<string, unknown> | undefined)?.[head]
  const updated = setAt(child, rest.join('.'), next)
  if (updated === undefined && !Array.isArray(copy)) delete (copy as Record<string, unknown>)[head]
  else (copy as Record<string, unknown>)[head] = updated
  return copy as T
}

/** O campo (do mapa) que corresponde a um caminho do conteúdo. */
export function fieldAt(fields: Fields, value: unknown, path: string): Field | undefined {
  let current = { kind: 'object', label: '', fields } as Field | undefined
  let v: unknown = value
  for (const p of parts(path)) {
    const f = current
    if (!f) return undefined
    if (f.kind === 'object') current = f.fields[p]
    else if (f.kind === 'list') current = f.of
    else if (f.kind === 'blocks') {
      const item = (v as unknown[] | undefined)?.[Number(p)] as { type?: string } | undefined
      const variant = item?.type ? f.variants[item.type] : undefined
      v = item
      current = variant ? ({ kind: 'object', label: variant.label, fields: variant.fields } as Field) : undefined
      continue
    } else return undefined
    v = (v as Record<string, unknown> | undefined)?.[p]
  }
  return current
}

/** Nomes dos campos do caminho, para mostrar "Linha do tempo › Momento 3 › Título". */
export function pathLabels(fields: Fields, value: unknown, path: string): string[] {
  const out: string[] = []
  const ps = parts(path)
  for (let i = 1; i <= ps.length; i++) {
    const f = fieldAt(fields, value, ps.slice(0, i).join('.'))
    if (!f) break
    if (/^\d+$/.test(ps[i - 1])) {
      const parent = fieldAt(fields, value, ps.slice(0, i - 1).join('.'))
      const itemLabel = parent && (parent.kind === 'list' || parent.kind === 'blocks') ? parent.itemLabel ?? 'Item' : 'Item'
      out.push(`${itemLabel} ${Number(ps[i - 1]) + 1}`)
    } else out.push(f.label)
  }
  return out
}

/** Valor vazio de um campo (para itens novos de listas). */
export function emptyValue(f: Field): unknown {
  switch (f.kind) {
    case 'text': case 'url': case 'image': case 'video': case 'slug': case 'ref': return ''
    case 'date': return new Date().toISOString().slice(0, 10)
    case 'number': return f.min ?? 0
    case 'bool': return false
    case 'select': return f.options[0]?.value ?? ''
    case 'coords': return [0, 0]
    case 'list': case 'blocks': return []
    case 'object': {
      const o: Record<string, unknown> = {}
      for (const [k, sub] of Object.entries(f.fields)) if (!sub.optional) o[k] = emptyValue(sub)
      return o
    }
  }
}

export function emptyFromFields(fields: Fields) {
  return emptyValue({ kind: 'object', label: '', fields }) as Record<string, unknown>
}

/** Um texto curto que identifica um item de lista no cabeçalho do card. */
export function itemTitle(f: Field, item: unknown, index: number): string {
  if (f.kind === 'blocks') {
    const it = item as { type: string; text?: string; title?: string }
    const variant = f.variants[it?.type]?.label ?? 'Bloco'
    const hint = (it?.title || it?.text || '').toString()
    return hint ? `${variant}: ${hint}` : variant
  }
  if (f.kind === 'list') {
    if (typeof item === 'string') return item || `${f.itemLabel ?? 'Item'} ${index + 1}`
    const key = f.itemTitle
    const v = key ? (item as Record<string, unknown>)?.[key] : undefined
    if (f.of.kind === 'object' && key && f.of.fields[key]?.kind === 'select') {
      const opt = (f.of.fields[key] as Extract<Field, { kind: 'select' }>).options.find((o) => o.value === v)
      if (opt) return opt.label
    }
    return typeof v === 'string' && v ? v : `${f.itemLabel ?? 'Item'} ${index + 1}`
  }
  return `Item ${index + 1}`
}

/** "inicio.hero" + "/" → endereço da pré-visualização. */
export const previewUrl = (route: string) => `/site${route === '/' ? '/' : route}`
