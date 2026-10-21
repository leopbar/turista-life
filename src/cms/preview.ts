/**
 * Só carrega na pré-visualização (build com VITE_CMS_PREVIEW=1) aberta dentro do painel.
 *
 * 1. Marca cada texto editável com o endereço do campo (caracteres invisíveis no fim do texto)
 *    e cada foto com "#cms=…" no endereço.
 * 2. Desenha o contorno laranja no que pode ser editado e avisa o painel (janela de cima, mesma
 *    origem) quando a pessoa clica.
 */
import { fieldsOf } from './schema'
import type { Field, Fields } from './fields'
import { liveUpdate } from './runtime'

/* ------------------------------------------------------------------ */
/* Marca invisível (stega)                                             */
/* ------------------------------------------------------------------ */

const DIGITS = ['​', '‌', '‍', '⁠']
const START = '⁢'
const END = '⁣'
const MARK = new RegExp(`${START}([${DIGITS.join('')}]+)${END}`, 'g')

function encode(payload: string) {
  let out = START
  for (const byte of new TextEncoder().encode(payload)) {
    for (let shift = 6; shift >= 0; shift -= 2) out += DIGITS[(byte >> shift) & 3]
  }
  return out + END
}

function decode(run: string) {
  const bytes: number[] = []
  for (let i = 0; i + 3 < run.length; i += 4) {
    let b = 0
    for (let j = 0; j < 4; j++) b = (b << 2) | DIGITS.indexOf(run[i + j])
    bytes.push(b)
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

export const stripMarks = (s: string) => s.replace(MARK, '')

function walk(v: unknown, field: Field | undefined, key: string, path: string): unknown {
  const at = (p: string | number) => (path ? `${path}.${p}` : String(p))
  if (typeof v === 'string') {
    if (!v) return v
    const kind = field?.kind ?? 'text'
    if (kind === 'text') return v + encode(`${key}|${path}`)
    if (kind === 'image') return `${v}${v.includes('#') ? '&' : '#'}cms=${encodeURIComponent(`${key}|${path}`)}`
    return v
  }
  if (Array.isArray(v)) {
    const of = field?.kind === 'list' ? field.of : undefined
    return v.map((item, i) => {
      if (field?.kind === 'blocks' && item && typeof item === 'object') {
        const variant = field.variants[(item as { type: string }).type]
        return walkObj(item as Record<string, unknown>, variant?.fields, key, at(i))
      }
      return walk(item, of, key, at(i))
    })
  }
  if (v && typeof v === 'object') return walkObj(v as Record<string, unknown>, field?.kind === 'object' ? field.fields : undefined, key, path)
  return v
}

function walkObj(o: Record<string, unknown>, fields: Fields | undefined, key: string, path: string) {
  const out: Record<string, unknown> = {}
  for (const [k, x] of Object.entries(o)) {
    // Sem mapa (textos fixos), tudo o que é texto vira editável.
    const f = fields ? fields[k] : undefined
    if (fields && !f) out[k] = x
    else out[k] = walk(x, f, key, path ? `${path}.${k}` : k)
  }
  return out
}

function stega(key: string, value: unknown) {
  const fields = fieldsOf(key)
  if (key === 'geral.textos') return walkObj(value as Record<string, unknown>, undefined, key, '')
  if (!fields || !value || typeof value !== 'object') return value
  return walkObj(value as Record<string, unknown>, fields, key, '')
}

/* ------------------------------------------------------------------ */
/* Contorno e clique                                                   */
/* ------------------------------------------------------------------ */

export type Target = { key: string; path: string; kind: 'text' | 'image' | 'link' }

function targetsOf(el: Element): Target[] {
  // Elemento sem texto marcado com cmsTarget() (ex.: ícone de rede social): abre o campo do link.
  const marked = el.getAttribute('data-cms')
  if (marked) {
    const [key, path] = marked.split('|')
    return [{ key, path, kind: 'link' }]
  }
  if (el instanceof HTMLImageElement) {
    const m = (el.getAttribute('src') ?? '').match(/[#&]cms=([^&]+)/)
    if (m) {
      const [key, path] = decodeURIComponent(m[1]).split('|')
      return [{ key, path, kind: 'image' }]
    }
    return []
  }
  const found: Target[] = []
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE) continue
    for (const m of (node.textContent ?? '').matchAll(MARK)) {
      const [key, path] = decode(m[1]).split('|')
      found.push({ key, path, kind: 'text' })
    }
  }
  return found
}

function findTarget(start: Element | null): { el: Element; targets: Target[] } | null {
  let el = start
  for (let depth = 0; el && depth < 4; depth++, el = el.parentElement) {
    const targets = targetsOf(el)
    if (targets.length) return { el, targets }
    // Foto de fundo: o clique cai numa camada por cima (degradê), e a foto é "irmã" dela.
    for (const img of Array.from(el.querySelectorAll?.(':scope > img') ?? [])) {
      const t = targetsOf(img)
      if (t.length) return { el: img, targets: t }
    }
  }
  return null
}

function setup() {
  let editing = true
  const box = document.createElement('div')
  box.setAttribute('aria-hidden', 'true')
  Object.assign(box.style, {
    position: 'fixed', pointerEvents: 'none', zIndex: '2147483646', border: '2px solid #F07A2A', borderRadius: '6px',
    boxShadow: '0 0 0 4px rgba(240,122,42,.18)', transition: 'all .12s ease', display: 'none',
  })
  const tag = document.createElement('div')
  Object.assign(tag.style, {
    position: 'absolute', top: '-24px', left: '-2px', background: '#F07A2A', color: '#fff', font: '600 11px Poppins, sans-serif',
    padding: '3px 8px', borderRadius: '6px 6px 6px 0', whiteSpace: 'nowrap',
  })
  box.appendChild(tag)
  document.body.appendChild(box)

  let current: { el: Element; targets: Target[] } | null = null
  const show = (hit: typeof current) => {
    current = hit
    if (!hit || !editing) return void (box.style.display = 'none')
    const r = hit.el.getBoundingClientRect()
    Object.assign(box.style, { display: 'block', top: `${r.top - 4}px`, left: `${r.left - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` })
    tag.textContent = { image: '📷 Trocar foto', link: '🔗 Editar link', text: '✎ Editar texto' }[hit.targets[0].kind]
  }

  document.addEventListener('mouseover', (e) => show(findTarget(e.target as Element)), true)
  document.addEventListener('scroll', () => current && show(current), true)
  document.addEventListener(
    'click',
    (e) => {
      if (!editing) return
      const hit = findTarget(e.target as Element)
      if (!hit) return
      e.preventDefault()
      e.stopPropagation()
      const r = hit.el.getBoundingClientRect()
      window.parent.postMessage({ type: 'cms:edit', targets: hit.targets, rect: { top: r.top, left: r.left, width: r.width, height: r.height } }, location.origin)
    },
    true,
  )

  // Conversa com o painel (mesma origem).
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== window.parent) return
    const msg = e.data as { type: string; key?: string; value?: unknown; editing?: boolean; path?: string }
    if (msg.type === 'cms:update' && msg.key) {
      if (!liveUpdate(msg.key, msg.value)) location.reload()
    } else if (msg.type === 'cms:mode') {
      editing = !!msg.editing
      show(null)
    } else if (msg.type === 'cms:navigate' && msg.path) {
      history.pushState(null, '', import.meta.env.BASE_URL.replace(/\/$/, '') + msg.path)
      dispatchEvent(new PopStateEvent('popstate'))
    }
  })

  // Avisa o painel em que página a pessoa está (para o seletor de páginas).
  const report = () => window.parent.postMessage({ type: 'cms:route', path: location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ''), '') || '/' }, location.origin)
  for (const fn of ['pushState', 'replaceState'] as const) {
    const orig = history[fn].bind(history)
    history[fn] = (...args: Parameters<typeof history.pushState>) => {
      orig(...args)
      setTimeout(report)
    }
  }
  addEventListener('popstate', report)
  report()
}

export function installPreview() {
  const cms = (window as unknown as { __TL_CMS__: { stega?: typeof stega } }).__TL_CMS__
  cms.stega = stega
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', setup)
  else setup()
}
