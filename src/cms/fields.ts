/**
 * Linguagem do mapa de conteúdo: cada campo editável do site, com nome em português.
 * O painel monta os formulários a partir daqui e o servidor (Python) valida com a mesma descrição,
 * exportada para JSON por scripts/export-cms.mjs. Por isso: só dados, nenhuma função.
 */

type Base = {
  label: string; help?: string; optional?: boolean
  /** Obrigatório só quando outro campo do mesmo grupo tem um destes valores (ex.: a página do produto, quando ele está à venda). */
  requiredWhen?: { field: string; values: string[] }
}

export type Field =
  | (Base & { kind: 'text'; long?: boolean; max?: number })
  /**
   * Link: https://, mailto:, ou caminho do próprio site ("/produtos").
   * Com `pick` (uma coleção, ex.: 'productPage'), só vale escolher uma página dessa coleção, já publicada.
   */
  | (Base & { kind: 'url'; pick?: string })
  /** Foto: caminho relativo ao site ("images/x.jpg" ou "cms/media/…"). */
  | (Base & { kind: 'image' })
  | (Base & { kind: 'number'; min?: number; max?: number })
  | (Base & { kind: 'bool' })
  | (Base & { kind: 'select'; options: { value: string; label: string }[] })
  /** Código do vídeo no YouTube (o que vem depois de youtu.be/). */
  | (Base & { kind: 'video' })
  /** Endereço de envio de um formulário incorporado do MailerLite (o painel aceita colar o código inteiro). */
  | (Base & { kind: 'mailerlite' })
  /** Identificador técnico em minúsculas e hífens (aparece no endereço). */
  | (Base & { kind: 'slug' })
  | (Base & { kind: 'date' })
  /** Escolha entre os itens de outra lista do site (destinos, assuntos, categorias…). */
  | (Base & { kind: 'ref'; source: string; list: string; valueField: string; labelField: string })
  /** Posição no mapa: [latitude, longitude]. */
  | (Base & { kind: 'coords' })
  | (Base & { kind: 'list'; of: Field; itemTitle?: string; itemLabel?: string })
  | (Base & { kind: 'object'; fields: Fields })
  /** Lista de blocos de tipos diferentes, separados pelo campo `type`. */
  | (Base & { kind: 'blocks'; itemLabel?: string; variants: Record<string, { label: string; fields: Fields }> })

export type Fields = Record<string, Field>

export type Group = 'geral' | 'inicio' | 'sobre' | 'produtos' | 'recomendacoes' | 'parcerias' | 'diario' | 'blog' | 'paginas'

export type DocDef = {
  key: string
  label: string
  group: Group
  /** Página do site onde o documento aparece (para a pré-visualização). */
  route: string
  fields: Fields
}

/** Coleção: cada item é publicado separado (um artigo, uma página de produto…). */
export type CollectionDef = {
  key: string
  label: string
  itemLabel: string
  group: Group
  /** Campo que identifica o item e entra no endereço. */
  idField: string
  titleField: string
  /** Endereço de cada item, com {id} no lugar do identificador. */
  route: string
  /** Endereços que não podem ser usados (já são páginas do site). */
  reservedIds?: string[]
  /** Itens novos entram no topo da lista (no site e no painel), em vez de no fim. */
  newestFirst?: boolean
  fields: Fields
}

/* Atalhos para escrever o mapa sem repetição. */
export const text = (label: string, extra: Partial<Base> & { long?: boolean; max?: number } = {}): Field => ({ kind: 'text', label, ...extra })
export const long = (label: string, extra: Partial<Base> = {}): Field => ({ kind: 'text', label, long: true, ...extra })
export const url = (label: string, extra: Partial<Base> & { pick?: string } = {}): Field => ({ kind: 'url', label, ...extra })
export const mailerlite = (label: string, extra: Partial<Base> = {}): Field => ({ kind: 'mailerlite', label, ...extra })
export const image = (label = 'Foto', extra: Partial<Base> = {}): Field => ({ kind: 'image', label, ...extra })
export const bool = (label: string, extra: Partial<Base> = {}): Field => ({ kind: 'bool', label, optional: true, ...extra })
export const num = (label: string, extra: Partial<Base> & { min?: number; max?: number } = {}): Field => ({ kind: 'number', label, ...extra })
export const select = (label: string, options: [string, string][], extra: Partial<Base> = {}): Field => ({
  kind: 'select', label, options: options.map(([value, l]) => ({ value, label: l })), ...extra,
})
export const obj = (label: string, fields: Fields, extra: Partial<Base> = {}): Field => ({ kind: 'object', label, fields, ...extra })
export const list = (label: string, of: Field, extra: Partial<Base> & { itemTitle?: string; itemLabel?: string } = {}): Field => ({ kind: 'list', label, of, ...extra })
export const texts = (label: string, itemLabel = 'Item', extra: Partial<Base> = {}): Field => list(label, text(itemLabel, { long: true }), { itemLabel, ...extra })
export const opt = (f: Field): Field => ({ ...f, optional: true })
export const ref = (label: string, source: string, list: string, labelField = 'name', extra: Partial<Base> = {}): Field => ({
  kind: 'ref', label, source, list, valueField: 'id', labelField, ...extra,
})

export const position = (label = 'Enquadramento da foto'): Field =>
  text(label, { optional: true, help: 'Preenchido sozinho pelo ponto de foco da foto. Ex.: "50% 30%".' })
export const button = (label = 'Botão'): Field => obj(label, { label: text('Texto do botão'), href: url('Link do botão') })
export const tone = (label = 'Cor da capa'): Field => select(label, [['pine', 'Verde'], ['sun', 'Laranja'], ['sky', 'Azul']])
export const cover = (label = 'Capa'): Field =>
  obj(label, { image: image('Foto da capa'), top: text('Texto pequeno de cima'), title: text('Título da capa'), tone: tone() })
export const heroFields = (withPosition = false): Field =>
  obj('Topo da página', {
    eyebrow: text('Nome da página (acima do título)'),
    script: opt(text('Frase em letra cursiva')),
    title: text('Título'),
    text: long('Texto'),
    image: image('Foto de fundo'),
    ...(withPosition ? { position: position() } : {}),
  })
export const cta = (label = 'Chamada final'): Field => obj(label, { title: text('Título'), text: long('Texto'), cta: button() })
export const sectionHead = (label: string): Field => obj(label, { eyebrow: text('Chamada acima do título'), title: text('Título'), text: long('Texto') })
