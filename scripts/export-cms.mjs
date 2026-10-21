/**
 * Exporta para o painel (server/painel/data/):
 *   cms-schema.json   o mapa de campos editáveis (src/cms/schema.ts + os textos fixos t('…'), ver src/cms/fixedTexts.ts)
 *   cms-defaults.json o conteúdo escrito hoje no código: é o ponto de partida do painel
 *
 * Rodar sempre que o mapa ou o conteúdo do código mudar:  node scripts/export-cms.mjs
 * (o Dockerfile do painel roda sozinho a cada build).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = join(root, 'server', 'painel', 'data')

const vite = await createServer({ root, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const load = (p) => vite.ssrLoadModule(p)
  for (const m of ['/src/content.ts', '/src/pagesContent.ts', '/src/aboutContent.ts', '/src/diaryContent.ts', '/src/blog/blogData.ts', '/src/cms/layouts.ts', '/src/cms/pages.ts']) await load(m)
  const { registered } = await load('/src/cms/runtime.ts')
  const { docs, collections } = await load('/src/cms/schema.ts')
  const registry = registered()

  // Fotos ficam relativas ao site ("/images/x.jpg" vira "images/x.jpg").
  const strip = (v) =>
    typeof v === 'string' ? (v.startsWith('/images/') ? v.slice(1) : v)
    : Array.isArray(v) ? v.map(strip)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strip(x)]))
    : v

  // Textos fixos dos componentes: t('id', 'texto').
  const textos = {}
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.tsx?$/.test(name)) {
        const src = readFileSync(p, 'utf8')
        for (const m of src.matchAll(/\bt\(\s*'([a-z0-9_.-]+)'\s*,\s*(['"])((?:\\.|(?!\2).)*)\2\s*\)/g)) {
          const value = m[3].replace(/\\(['"\\])/g, '$1')
          if (textos[m[1]] !== undefined && textos[m[1]] !== value) throw new Error(`Texto "${m[1]}" com dois valores diferentes`)
          textos[m[1]] = value
        }
      }
    }
  }
  walk(join(root, 'src'))
  // Cada texto fixo tem lugar no painel: na página onde aparece (pageTexts) ou no bloco comum (sharedTexts).
  const { pageTexts, sharedTexts, textHome, textKey } = await load('/src/cms/fixedTexts.ts')
  for (const id of Object.keys(textos)) {
    if (!textHome[id] && !(id in sharedTexts)) throw new Error(`Texto fixo "${id}" sem lugar no painel: coloque em src/cms/fixedTexts.ts`)
  }
  for (const id of [...Object.keys(textHome), ...Object.keys(sharedTexts)]) {
    if (!(id in textos)) throw new Error(`Texto fixo "${id}" está em src/cms/fixedTexts.ts, mas não existe mais no código`)
  }
  const sharedValues = Object.fromEntries(Object.keys(sharedTexts).sort((a, b) => a.localeCompare(b)).map((id) => [id, textos[id]]))

  // Capas de vídeo que já existem no site (as de vídeos novos o painel baixa sozinho).
  const staticThumbs = readdirSync(join(root, 'public', 'images', 'videos')).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4)).sort()
  // Fotos que vêm com o site ("images/…"): o painel recusa um caminho que não esteja aqui (ficaria quebrado).
  const staticImages = []
  const listImages = (dir, rel) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) listImages(p, `${rel}${name}/`)
      else staticImages.push(`${rel}${name}`)
    }
  }
  listImages(join(root, 'public', 'images'), 'images/')
  staticImages.sort()
  // Onde mora cada texto fixo de página: o servidor usa para levar o que já foi editado em "geral.textos" para lá.
  const homes = Object.fromEntries(Object.entries(textHome).map(([id, h]) => [id, [h.doc, h.group, h.key]]))
  const defaults = { docs: {}, collections: {}, staticThumbs, staticImages, textHome: homes }
  for (const d of docs) {
    if (d.key === 'geral.textos') {
      defaults.docs[d.key] = sharedValues
      d.fields = Object.fromEntries(Object.entries(sharedValues).map(([id, v]) => [id, { kind: 'text', label: sharedTexts[id], long: v.length > 80 }]))
      continue
    }
    if (!registry.has(d.key)) throw new Error(`Documento sem conteúdo no código: ${d.key}`)
    defaults.docs[d.key] = strip(registry.get(d.key))
    // "Textos fixos desta página": o texto escrito no código é o valor inicial.
    if (pageTexts[d.key]) {
      defaults.docs[d.key].textos = Object.fromEntries(Object.entries(pageTexts[d.key]).map(([g, group]) => [
        g, Object.fromEntries(Object.keys(group.texts).map((id) => [textKey(id), textos[id]])),
      ]))
      for (const [g, group] of Object.entries(pageTexts[d.key])) {
        for (const id of Object.keys(group.texts)) if (textos[id].length > 80) d.fields.textos.fields[g].fields[textKey(id)].long = true
      }
    }
  }
  for (const c of collections) {
    if (!registry.has(c.key)) throw new Error(`Coleção sem conteúdo no código: ${c.key}`)
    defaults.collections[c.key] = strip(registry.get(c.key))
  }

  writeFileSync(join(out, 'cms-schema.json'), JSON.stringify({ docs, collections }, null, 1))
  writeFileSync(join(out, 'cms-defaults.json'), JSON.stringify(defaults, null, 1))
  const count = Object.keys(defaults.docs).length + Object.values(defaults.collections).reduce((n, l) => n + l.length, 0)
  console.log(`Mapa e conteúdo exportados: ${count} documentos, ${Object.keys(textos).length} textos fixos.`)
} finally {
  await vite.close()
}
