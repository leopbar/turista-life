/**
 * Contrato do CMS: compara o mapa do painel (server/painel/data/cms-schema.json e as fotos que vêm com o
 * site em cms-defaults.json) de um commit anterior com o atual e diz o que a mudança faz com o conteúdo
 * que a Laura já editou em produção.
 *
 *   node scripts/check-cms-contract.mjs <commit-base>
 *
 * 🔴 perde conteúdo (campo/página removido ou renomeado, tipo trocado)
 * 🟠 pode dar erro (opção de lista removida, campo passou a ser obrigatório, limite menor, foto do site apagada)
 * 🟢 seguro (campo novo, nome de exibição trocado...)
 *
 * Sai com erro se houver 🔴 ou 🟠, a não ser que algum commit do intervalo tenha a linha
 * "CMS-impacto: aceito" na mensagem (mudança feita de propósito, depois de ver o aviso).
 * O relatório vai para o terminal e, no GitHub Actions, para o resumo da execução.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'

const SCHEMA = 'server/painel/data/cms-schema.json'
const DEFAULTS = 'server/painel/data/cms-defaults.json'
const ACK = /^CMS-impacto:\s*aceito\s*$/im

const base = process.argv[2]
if (!base) {
  console.error('Uso: node scripts/check-cms-contract.mjs <commit-base>')
  process.exit(2)
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const atBase = (path) => {
  try {
    return JSON.parse(git('show', `${base}:${path}`))
  } catch {
    return null // arquivo ainda não existia no commit base
  }
}
const now = (path) => JSON.parse(readFileSync(path, 'utf8'))

const RED = '🔴', ORANGE = '🟠', GREEN = '🟢'
const findings = []
const add = (level, where, what) => findings.push({ level, where, what })

const byKey = (list) => Object.fromEntries((list || []).map((d) => [d.key, d]))
const name = (trail) => trail.join(' › ')

function compareField(a, b, trail) {
  if (a.kind !== b.kind) {
    add(RED, name(trail), `tipo trocado (${a.kind} → ${b.kind}): o conteúdo guardado não serve mais neste campo.`)
    return
  }
  if (a.optional && !b.optional) add(ORANGE, name(trail), 'passou a ser obrigatório: se estiver vazio em produção, a publicação é recusada.')
  // Obrigatório só numa situação (requiredWhen): cada situação nova também pode recusar conteúdo que já existe.
  const when = (f) => (f.requiredWhen ? f.requiredWhen.values.map((v) => `${f.requiredWhen.field} = ${v}`) : [])
  const newWhen = when(b).filter((w) => !when(a).includes(w))
  if (b.optional && newWhen.length) add(ORANGE, name(trail), `passou a ser obrigatório quando ${newWhen.join(' ou ')}: se estiver vazio em produção, a publicação é recusada.`)
  if (b.pick && a.pick !== b.pick) add(ORANGE, name(trail), `passou a aceitar só páginas publicadas de "${b.pick}": um link para outra página dessa lista que não esteja no ar é recusado na publicação.`)
  if (b.max !== undefined && (a.max === undefined || b.max < a.max)) add(ORANGE, name(trail), `limite máximo menor (${a.max ?? 'sem limite'} → ${b.max}): textos/valores maiores passam a ser recusados.`)
  if (b.min !== undefined && (a.min === undefined || b.min > a.min)) add(ORANGE, name(trail), `mínimo maior (${a.min ?? 'sem mínimo'} → ${b.min}): valores menores passam a ser recusados.`)
  if (a.long && !b.long && a.kind === 'text') add(ORANGE, name(trail), 'deixou de ser texto longo: textos grandes passam a ser recusados.')
  if (a.kind === 'select') {
    const kept = new Set((b.options || []).map((o) => o.value))
    for (const o of a.options || []) if (!kept.has(o.value)) add(ORANGE, name(trail), `opção "${o.label}" removida: o conteúdo que usa essa opção é recusado na publicação.`)
  }
  if (a.kind === 'ref') {
    for (const k of ['source', 'list', 'valueField']) if (a[k] !== b[k]) add(ORANGE, name(trail), `passou a apontar para outra lista (${k}: ${a[k]} → ${b[k]}): as escolhas feitas podem não existir mais.`)
  }
  if (a.kind === 'object') compareFields(a.fields, b.fields, trail)
  if (a.kind === 'list') compareField(a.of, b.of, [...trail, a.itemLabel || 'item'])
  if (a.kind === 'blocks') {
    for (const [type, va] of Object.entries(a.variants || {})) {
      const vb = (b.variants || {})[type]
      if (!vb) add(RED, name([...trail, va.label]), 'tipo de bloco removido ou renomeado: os blocos desse tipo que já existem quebram.')
      else compareFields(va.fields, vb.fields, [...trail, va.label])
    }
  }
  if (a.label !== b.label) add(GREEN, name(trail), `nome no painel trocado para "${b.label}".`)
}

function compareFields(fa = {}, fb = {}, trail) {
  const gone = Object.keys(fa).filter((k) => !(k in fb))
  const added = Object.keys(fb).filter((k) => !(k in fa))
  // Um que saiu e um que entrou, do mesmo tipo, no mesmo lugar: quase sempre é renomeação.
  if (gone.length === 1 && added.length === 1 && fa[gone[0]].kind === fb[added[0]].kind) {
    const [k, n] = [gone[0], added[0]]
    add(RED, name([...trail, fa[k].label || k]), `campo renomeado (\`${k}\` → \`${n}\`): o conteúdo editado nele é descartado e volta o texto do código.`)
    gone.length = added.length = 0
  }
  for (const [k, a] of Object.entries(fa)) {
    if (gone.includes(k)) add(RED, name([...trail, a.label || k]), `campo removido ou renomeado (\`${k}\`): o conteúdo editado nele é descartado.`)
    else if (k in fb) compareField(a, fb[k], [...trail, a.label || k])
  }
  for (const k of added) add(GREEN, name([...trail, fb[k].label || k]), 'campo novo: entra no painel com o texto do código.')
}

function compareDefs(listA, listB, isCollection) {
  const A = byKey(listA), B = byKey(listB)
  for (const [key, a] of Object.entries(A)) {
    const b = B[key]
    const where = `${a.label} (\`${key}\`)`
    if (!b) {
      add(RED, where, isCollection ? 'lista removida ou renomeada: todos os itens editados nela somem do painel.' : 'página/seção removida ou renomeada: o conteúdo editado nela some.')
      continue
    }
    if (isCollection && a.idField !== b.idField) add(RED, where, `campo de endereço trocado (${a.idField} → ${b.idField}): os itens existentes perdem o endereço.`)
    // Textos fixos t('id', …): o "nome" é o próprio texto; o que importa é o id.
    if (key === 'geral.textos') {
      for (const id of Object.keys(a.fields || {})) if (!(id in (b.fields || {}))) add(RED, `Textos fixos › \`${id}\``, 'texto removido ou com id trocado: a versão editada no painel é descartada.')
      for (const id of Object.keys(b.fields || {})) if (!(id in (a.fields || {}))) add(GREEN, `Textos fixos › \`${id}\``, 'texto novo.')
      continue
    }
    compareFields(a.fields, b.fields, [a.label])
    if (a.route !== b.route) add(GREEN, where, `endereço da página no site mudou (${a.route} → ${b.route}).`)
  }
  for (const [key, b] of Object.entries(B)) if (!A[key]) add(GREEN, `${b.label} (\`${key}\`)`, isCollection ? 'lista nova.' : 'página/seção nova.')
}

const baseSchema = atBase(SCHEMA)
if (!baseSchema) {
  console.log(`O commit base (${base}) não tem ${SCHEMA}: nada para comparar.`)
  process.exit(0)
}
const headSchema = now(SCHEMA)
compareDefs(baseSchema.docs, headSchema.docs, false)
compareDefs(baseSchema.collections, headSchema.collections, true)

const baseImages = atBase(DEFAULTS)?.staticImages || []
const headImages = new Set(now(DEFAULTS).staticImages || [])
for (const img of baseImages) if (!headImages.has(img)) add(ORANGE, `Foto do site \`${img}\``, 'apagada ou renomeada: se o conteúdo publicado usar essa foto, ela aparece quebrada.')

// Relatório
const order = { [RED]: 0, [ORANGE]: 1, [GREEN]: 2 }
findings.sort((x, y) => order[x.level] - order[y.level] || x.where.localeCompare(y.where))
const risky = findings.filter((f) => f.level !== GREEN)
const messages = git('log', '--format=%B', `${base}..HEAD`)
const accepted = ACK.test(messages)

const lines = ['## Contrato do CMS', '']
if (!findings.length) lines.push(`${GREEN} Nenhuma mudança no mapa do painel desde \`${base.slice(0, 7)}\`.`)
else {
  const count = (l) => findings.filter((f) => f.level === l).length
  lines.push(`Comparado com \`${base.slice(0, 7)}\`: ${RED} ${count(RED)} perde conteúdo · ${ORANGE} ${count(ORANGE)} pode dar erro · ${GREEN} ${count(GREEN)} seguro`, '')
  lines.push('| | Onde | O que acontece no painel |', '|---|---|---|')
  for (const f of findings) lines.push(`| ${f.level} | ${f.where.replace(/\|/g, '\\|')} | ${f.what.replace(/\|/g, '\\|')} |`)
}
lines.push('')
if (risky.length && accepted) lines.push(`**Impacto aceito** por um commit com \`CMS-impacto: aceito\`. Confira no painel de produção os itens ${RED}/${ORANGE} acima depois do deploy.`)
else if (risky.length) lines.push(`**Reprovado:** esta mudança afeta conteúdo do painel. Se for de propósito, faça um commit com a linha \`CMS-impacto: aceito\` na mensagem; senão, desfaça a mudança.`)
const report = lines.join('\n')

console.log(report)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n')
if (risky.length && !accepted) {
  for (const f of risky) console.log(`::error title=Contrato do CMS::${f.level} ${f.where}: ${f.what}`)
  process.exit(1)
}
